import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Avatar from '../components/Avatar';
import { AVATARS, fetchProfile, updateAvatar, updateBio, updateFavConsole, updateFavGame, type Profile } from '../api/profile';
import { fetchPlatforms } from '../api/games';
import { Dropdown, type Option } from '../components/Dropdown';
import { GamePicker } from '../components/GamePicker';
import { KeyboardForm } from '../components/KeyboardForm';
import { FullError } from '../components/states';
import { Button, ErrorText } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts, radius } from '../theme';
import type { Platform } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;
const BIO_MAX = 200;

export default function EditProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [consoleSlug, setConsoleSlug] = useState('');
  const [favGame, setFavGame] = useState<{ id: number; title: string } | null>(null);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, pl] = await Promise.all([fetchProfile(), fetchPlatforms().catch(() => [] as Platform[])]);
      setProfile(p); setPlatforms(pl); setError(null);
      setAvatar(p.avatar_id ?? ''); setBio(p.bio ?? ''); setConsoleSlug(p.fav_console ?? '');
      setFavGame(p.fav_game_id ? { id: p.fav_game_id, title: p.fav_game_title ?? p.fav_game_data?.title ?? 'Juego' } : null);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar tu perfil'); }
  }, []);
  useFocusEffect(useCallback(() => { if (!profile) load(); }, [load, profile]));

  const consoleOpts = useMemo<Option[]>(() => [{ value: '', label: 'Sin elegir' }, ...platforms.map(p => ({ value: p.slug, label: p.name }))], [platforms]);

  if (error && !profile) return <FullError message={error} onRetry={load} />;
  if (!profile) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><ActivityIndicator color={colors.red} /></View>;

  async function save() {
    const p = profile!;
    setBusy(true); setSaveErr(null);
    try {
      // Solo se mandan los cambios que de verdad cambiaron.
      const jobs: Promise<unknown>[] = [];
      if (avatar && avatar !== (p.avatar_id ?? '')) jobs.push(updateAvatar(avatar));
      if (bio.trim() !== (p.bio ?? '')) jobs.push(updateBio(bio.trim()));
      if (consoleSlug && consoleSlug !== (p.fav_console ?? '')) jobs.push(updateFavConsole(consoleSlug));
      if (favGame && favGame.id !== p.fav_game_id) jobs.push(updateFavGame(favGame.id));
      await Promise.all(jobs);
      navigation.goBack();
    } catch (err) { setSaveErr(err instanceof Error ? err.message : 'No se pudieron guardar los cambios'); }
    finally { setBusy(false); }
  }

  return (
    <KeyboardForm>
      <Text style={s.h}>ELIGE TU AVATAR</Text>
      <View style={s.grid}>
        {AVATARS.map(a => {
          const sel = a.id === avatar;
          return (
            <Pressable key={a.id} onPress={() => setAvatar(a.id)} style={[s.av, sel && s.avSel]}>
              <Avatar id={a.id} size={48} />
              <Text style={{ color: sel ? colors.gold : colors.dim, fontSize: 10, marginTop: 4, fontWeight: '700' }} numberOfLines={1}>{a.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[s.h, { marginTop: 22 }]}>SOBRE MÍ</Text>
      <TextInput
        value={bio}
        onChangeText={t => setBio(t.slice(0, BIO_MAX))}
        placeholder="¿Qué juegas? ¿Cuál es tu juego de cabecera?"
        placeholderTextColor={colors.dim}
        multiline
        style={s.bio}
        textAlignVertical="top"
      />
      <Text style={{ color: colors.dim, fontSize: 11, textAlign: 'right', marginTop: 4 }}>{bio.length}/{BIO_MAX}</Text>

      <Text style={[s.h, { marginTop: 18 }]}>CONSOLA FAVORITA</Text>
      <View style={{ flexDirection: 'row' }}><Dropdown label="CONSOLA" value={consoleSlug} options={consoleOpts} onChange={setConsoleSlug} icon="🎮" /></View>

      <Text style={[s.h, { marginTop: 18 }]}>JUEGO FAVORITO</Text>
      <Pressable onPress={() => setPicker(true)} style={s.pick}>
        <Text style={{ color: favGame ? colors.text : colors.dim, fontSize: 15, fontWeight: favGame ? '700' : '400', flex: 1 }} numberOfLines={1}>{favGame ? `⭐ ${favGame.title}` : 'Toca para elegir un juego'}</Text>
        <Text style={{ color: colors.gold, fontWeight: '800' }}>Cambiar</Text>
      </Pressable>

      <View style={{ height: 22 }} />
      <ErrorText message={saveErr} />
      <Button title="Guardar cambios" onPress={save} loading={busy} />

      <GamePicker visible={picker} title="Tu juego favorito" onClose={() => setPicker(false)} onPick={g => { setFavGame({ id: g.id, title: g.title }); setPicker(false); }} />
    </KeyboardForm>
  );
}

const s = StyleSheet.create({
  h: { color: colors.red, fontFamily: fonts.pixel, fontSize: 9, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  av: { width: '22.5%', aspectRatio: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avSel: { borderColor: colors.gold, backgroundColor: colors.elevated },
  bio: { minHeight: 96, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 14, fontSize: 15 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 52 },
});
