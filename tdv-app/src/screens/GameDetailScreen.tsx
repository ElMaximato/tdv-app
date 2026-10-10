import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ApiError } from '../api/client';
import { fetchGame, removeVote, voteGame } from '../api/games';
import { useAuth } from '../auth/AuthContext';
import { coverUrl } from '../components/GameCard';
import { ScoreSlider } from '../components/ScoreSlider';
import { FullError } from '../components/states';
import { Button, ErrorText } from '../components/ui';
import { useFavorites } from '../favorites/FavoritesContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts, radius, scoreColor } from '../theme';
import { GameDetail, toNum } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'GameDetail'>;

export default function GameDetailScreen({ route, navigation }: Props) {
  const { slug } = route.params;
  const { user } = useAuth();
  const fav = useFavorites();
  const { width } = useWindowDimensions();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [draft, setDraft] = useState(75);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [voteMsg, setVoteMsg] = useState<string | null>(null);
  const [voteErr, setVoteErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetchGame(slug)
      .then(g => { setGame(g); setMyVote(g.my_vote); setDraft(g.my_vote ?? 75); })
      .catch(err => setError(err instanceof ApiError ? err.message : 'No se pudo cargar el juego'));
  }, [slug]);
  useEffect(load, [load]);

  if (error) return <FullError message={error} onRetry={load} />;
  if (!game) return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.red} /></View>;

  const g = game;
  const img = coverUrl(g.cover_image);
  const emilio = toNum(g.score_overall);
  const gente = toNum(g.community_avg);
  const isFav = fav.isFavorite(g.id);
  const dirty = myVote == null || draft !== myVote;
  const heroH = Math.round(width * 1.08);

  async function onHeart() {
    const ok = await fav.toggle(g.id);
    if (!ok) navigation.navigate('Login');
    else Haptics.selectionAsync().catch(() => {});
  }

  async function save() {
    setBusy(true); setVoteErr(null); setVoteMsg(null);
    try {
      const r = await voteGame(g.id, draft);
      setMyVote(r.score);
      setGame(prev => prev && { ...prev, community_avg: r.community_avg, vote_count: r.vote_count });
      setVoteMsg('¡Listo! Tu calificación quedó guardada.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) { setVoteErr(err instanceof Error ? err.message : 'No se pudo guardar tu calificación'); }
    finally { setBusy(false); }
  }

  async function clearVote() {
    setBusy(true); setVoteErr(null); setVoteMsg(null);
    try {
      const r = await removeVote(g.id);
      setMyVote(null); setDraft(75);
      setGame(prev => prev && { ...prev, community_avg: r.community_avg, vote_count: r.vote_count });
      setVoteMsg('Quitaste tu calificación.');
    } catch (err) { setVoteErr(err instanceof Error ? err.message : 'No se pudo quitar tu calificación'); }
    finally { setBusy(false); }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 48 }} scrollEnabled={!dragging} keyboardShouldPersistTaps="handled">
      {/* Portada grande, con la misma imagen desenfocada de fondo para que nada se recorte */}
      <View style={{ height: heroH, backgroundColor: colors.card, overflow: 'hidden' }}>
        {img ? <Image source={{ uri: img }} blurRadius={28} style={[StyleSheet.absoluteFill, { opacity: 0.55 }]} resizeMode="cover" /> : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,15,26,0.35)' }]} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          {img ? <Image source={{ uri: img }} style={s.cover} resizeMode="contain" />
               : <View style={[s.cover, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.elevated }]}><Text style={{ fontSize: 60 }}>🎮</Text></View>}
        </View>
        <Pressable onPress={onHeart} style={s.heart} hitSlop={8}><Text style={{ fontSize: 22 }}>{isFav ? '❤️' : '🤍'}</Text></Pressable>
        <View style={s.heroFade} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Text style={s.title}>{g.title}</Text>
        <Text style={s.meta}>{g.platform_name}{g.release_year ? ` · ${g.release_year}` : ''}{g.developer ? ` · ${g.developer}` : ''}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {g.is_essential ? <Text style={[s.tag, { color: colors.gold, borderColor: colors.gold }]}>ESENCIAL</Text> : null}
          {g.is_gem ? <Text style={[s.tag, { color: colors.cyan, borderColor: colors.cyan }]}>JOYA</Text> : null}
          {g.genres.map(x => <Text key={x.slug} style={s.genre}>{x.name}</Text>)}
        </View>

        {/* Las dos calificaciones, separadas */}
        <View style={s.scoresRow}>
          <ScoreCard label="NOTA DE EMILIO" score={emilio} sub={g.emilio_rank ? `Puesto #${g.emilio_rank}` : 'Reseña oficial'} />
          <ScoreCard label="NOTA DE LA GENTE" score={gente} sub={g.vote_count ? `${g.vote_count} ${g.vote_count === 1 ? 'voto' : 'votos'}` : 'Aún sin votos'} />
        </View>

        {g.summary ? <Text style={s.summary}>{g.summary}</Text> : null}

        {/* Tu calificación */}
        <View style={s.card}>
          <Text style={s.h}>TU CALIFICACIÓN</Text>
          {user ? (
            <>
              <ScoreSlider value={draft} onChange={v => { setDraft(v); setVoteMsg(null); }} onDragState={setDragging} />
              <ErrorText message={voteErr} />
              {voteMsg ? <Text style={{ color: colors.green, textAlign: 'center', marginTop: 10, fontWeight: '700' }}>{voteMsg}</Text> : null}
              <Button title={myVote == null ? 'Guardar mi calificación' : 'Actualizar mi calificación'} onPress={save} loading={busy} disabled={!dirty} style={{ marginTop: 16 }} />
              {myVote != null ? <Button title="Quitar mi calificación" variant="ghost" onPress={clearVote} disabled={busy} style={{ marginTop: 10 }} /> : null}
              <Text style={s.note}>Tu nota se promedia con la de los demás jugadores. No cambia la nota de Emilio ni el orden del ranking.</Text>
            </>
          ) : (
            <>
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 14 }}>Inicia sesión para calificar este juego y ver cómo se compara con la nota de Emilio.</Text>
              <Button title="Iniciar sesión" onPress={() => navigation.navigate('Login')} />
            </>
          )}
        </View>

        {g.review_body ? (
          <View style={s.card}><Text style={s.h}>RESEÑA</Text><Text style={s.body}>{g.review_body}</Text></View>
        ) : null}
        {g.personal_note ? (
          <View style={s.card}><Text style={s.h}>NOTA PERSONAL</Text><Text style={[s.body, { fontStyle: 'italic' }]}>{g.personal_note}</Text></View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function ScoreCard({ label, score, sub }: { label: string; score: number | null; sub: string }) {
  const c = scoreColor(score);
  return (
    <View style={[s.scoreCard, { borderColor: score == null ? colors.border : c }]}>
      <Text style={s.scoreLabel}>{label}</Text>
      <Text style={{ color: c, fontFamily: fonts.pixel, fontSize: 30, marginVertical: 12 }}>{score == null ? '--' : Math.round(score)}</Text>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{sub}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  cover: { width: '100%', height: '100%', borderRadius: 14 },
  heart: { position: 'absolute', top: 14, right: 14, width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(5,5,12,0.62)', alignItems: 'center', justifyContent: 'center' },
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 28, backgroundColor: 'rgba(15,15,26,0.5)' },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 18 },
  meta: { color: colors.muted, fontSize: 14, marginTop: 5 },
  tag: { fontFamily: fonts.pixel, fontSize: 7, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  genre: { color: colors.cyan, fontSize: 11, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  scoresRow: { flexDirection: 'row', gap: 12, marginTop: 22, marginBottom: 18 },
  scoreCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 2, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  scoreLabel: { color: colors.muted, fontFamily: fonts.pixel, fontSize: 7, textAlign: 'center', lineHeight: 12 },
  summary: { color: colors.text, fontSize: 16, lineHeight: 25, marginBottom: 18 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  h: { color: colors.red, fontFamily: fonts.pixel, fontSize: 10, marginBottom: 14 },
  body: { color: colors.text, fontSize: 15, lineHeight: 23 },
  note: { color: colors.dim, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14 },
});
