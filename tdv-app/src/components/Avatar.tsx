import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { avatarEmoji } from '../api/profile';
import { UPLOADS_URL } from '../config';

// Busca la imagen en backend/uploads/avatars/<id>.<ext> probando estas extensiones en orden.
// Si ninguna existe, cae al emoji, así nunca se ve roto.
const EXTS = ['png', 'webp', 'jpg', 'jpeg'];

export function avatarUrl(id: string | null | undefined, extIndex = 0) {
  return id && extIndex < EXTS.length ? `${UPLOADS_URL}avatars/${id}.${EXTS[extIndex]}` : null;
}

export default function Avatar({ id, size = 88 }: { id: string | null | undefined; size?: number }) {
  const [extIndex, setExtIndex] = useState(0);
  const [lastId, setLastId] = useState(id);
  if (id !== lastId) { setLastId(id); setExtIndex(0); }   // si cambia el avatar, vuelve a probar desde .png

  const url = avatarUrl(id, extIndex);
  if (!url) return <Text style={{ fontSize: size * 0.45 }}>{avatarEmoji(id)}</Text>;
  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <Image key={url} source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setExtIndex(i => i + 1)} />
    </View>
  );
}
