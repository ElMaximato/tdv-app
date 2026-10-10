// ============================================================
//  IGDB IMPORTER v3 — Búsqueda por nombre (sin IDs incorrectos)
//  backend/scripts/igdb-import.js
//  Uso: node scripts/igdb-import.js
// ============================================================

import mysql  from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// ─── Mapeo IGDB platform_id → slug de tu BD ──────────────────
const IGDB_PLATFORM_IDS = {
  snes: 19,
  n64:  4,
  gbc:  22,
  gba:  24,
  ps1:  7,
  ps2:  8,
  ngc:  21,
}

// ─── Mapeo géneros IGDB → slug de tu BD ──────────────────────
const GENRE_MAP = {
  12: 'rpg',
  31: 'aventura',
  8:  'plataformas',
  5:  'shooter',
  11: 'carreras',
  14: 'deportes',
  6:  'lucha',
  9:  'puzzle',
  13: 'simulacion',
  15: 'estrategia',
  10: 'accion',
  4:  'accion',
  2:  'plataformas',
  33: 'accion',
}

// ─── Lista curada — nombre exacto + plataforma + slug para tu BD ─
const GAMES = [
  // ── SNES ──────────────────────────────────────────────────
  { name: 'Chrono Trigger',                          platform: 'snes', slug: 'chrono-trigger' },
  { name: 'Super Metroid',                           platform: 'snes', slug: 'super-metroid' },
  { name: 'Super Mario World',                       platform: 'snes', slug: 'super-mario-world' },
  { name: 'The Legend of Zelda: A Link to the Past', platform: 'snes', slug: 'zelda-link-to-the-past' },
  { name: 'Donkey Kong Country',                     platform: 'snes', slug: 'donkey-kong-country' },
  { name: 'Final Fantasy VI',                        platform: 'snes', slug: 'final-fantasy-vi' },
  { name: 'Mega Man X',                              platform: 'snes', slug: 'mega-man-x' },
  { name: 'Super Mario Kart',                        platform: 'snes', slug: 'super-mario-kart' },
  { name: "Super Mario World 2: Yoshi's Island",     platform: 'snes', slug: 'yoshis-island-snes' },
  { name: 'EarthBound',                              platform: 'snes', slug: 'earthbound' },
  { name: 'Secret of Mana',                          platform: 'snes', slug: 'secret-of-mana' },
  { name: 'Super Castlevania IV',                    platform: 'snes', slug: 'super-castlevania-iv' },

  // ── N64 ───────────────────────────────────────────────────
  { name: 'The Legend of Zelda: Ocarina of Time',    platform: 'n64',  slug: 'zelda-ocarina-of-time' },
  { name: 'Super Mario 64',                          platform: 'n64',  slug: 'super-mario-64' },
  { name: 'GoldenEye 007',                           platform: 'n64',  slug: 'goldeneye-007' },
  { name: 'Mario Kart 64',                           platform: 'n64',  slug: 'mario-kart-64' },
  { name: 'Banjo-Kazooie',                           platform: 'n64',  slug: 'banjo-kazooie' },
  { name: "The Legend of Zelda: Majora's Mask",      platform: 'n64',  slug: 'zelda-majoras-mask' },
  { name: 'Star Fox 64',                             platform: 'n64',  slug: 'star-fox-64' },
  { name: 'Donkey Kong 64',                          platform: 'n64',  slug: 'donkey-kong-64' },
  { name: 'Paper Mario',                             platform: 'n64',  slug: 'paper-mario' },
  { name: 'Perfect Dark',                            platform: 'n64',  slug: 'perfect-dark' },

  // ── PS1 ───────────────────────────────────────────────────
  { name: 'Final Fantasy VII',                       platform: 'ps1',  slug: 'final-fantasy-vii' },
  { name: 'Final Fantasy VIII',                      platform: 'ps1',  slug: 'final-fantasy-viii' },
  { name: 'Final Fantasy IX',                        platform: 'ps1',  slug: 'final-fantasy-ix' },
  { name: 'Castlevania: Symphony of the Night',      platform: 'ps1',  slug: 'castlevania-sotn' },
  { name: 'Metal Gear Solid',                        platform: 'ps1',  slug: 'metal-gear-solid' },
  { name: 'Resident Evil 2',                         platform: 'ps1',  slug: 'resident-evil-2' },
  { name: 'Resident Evil',                           platform: 'ps1',  slug: 'resident-evil' },
  { name: 'Crash Bandicoot',                         platform: 'ps1',  slug: 'crash-bandicoot' },
  { name: 'Spyro the Dragon',                        platform: 'ps1',  slug: 'spyro-the-dragon' },
  { name: 'Tekken 3',                                platform: 'ps1',  slug: 'tekken-3' },
  { name: 'Silent Hill',                             platform: 'ps1',  slug: 'silent-hill' },
  { name: 'Chrono Cross',                            platform: 'ps1',  slug: 'chrono-cross' },

  // ── PS2 ───────────────────────────────────────────────────
  { name: 'Shadow of the Colossus',                  platform: 'ps2',  slug: 'shadow-of-the-colossus' },
  { name: 'Ico',                                     platform: 'ps2',  slug: 'ico' },
  { name: 'Kingdom Hearts',                          platform: 'ps2',  slug: 'kingdom-hearts' },
  { name: 'Kingdom Hearts II',                       platform: 'ps2',  slug: 'kingdom-hearts-ii' },
  { name: 'God of War',                              platform: 'ps2',  slug: 'god-of-war' },
  { name: 'God of War II',                           platform: 'ps2',  slug: 'god-of-war-ii' },
  { name: 'Grand Theft Auto: San Andreas',           platform: 'ps2',  slug: 'gta-san-andreas' },
  { name: 'Grand Theft Auto: Vice City',             platform: 'ps2',  slug: 'gta-vice-city' },
  { name: 'Devil May Cry',                           platform: 'ps2',  slug: 'devil-may-cry' },
  { name: 'Okami',                                   platform: 'ps2',  slug: 'okami' },
  { name: 'Dragon Quest VIII',                       platform: 'ps2',  slug: 'dragon-quest-viii' },
  { name: 'Final Fantasy X',                         platform: 'ps2',  slug: 'final-fantasy-x' },
  { name: 'Metal Gear Solid 3: Snake Eater',         platform: 'ps2',  slug: 'metal-gear-solid-3' },
  { name: 'Resident Evil 4',                         platform: 'ps2',  slug: 'resident-evil-4-ps2' },

  // ── GBA ───────────────────────────────────────────────────
  { name: 'Pokémon FireRed',                         platform: 'gba',  slug: 'pokemon-firered' },
  { name: 'Castlevania: Aria of Sorrow',             platform: 'gba',  slug: 'castlevania-aria-of-sorrow' },
  { name: 'Golden Sun',                              platform: 'gba',  slug: 'golden-sun' },
  { name: 'Metroid Fusion',                          platform: 'gba',  slug: 'metroid-fusion' },
  { name: 'Fire Emblem',                             platform: 'gba',  slug: 'fire-emblem-gba' },
  { name: 'The Legend of Zelda: The Minish Cap',     platform: 'gba',  slug: 'zelda-minish-cap' },

  // ── GameCube ──────────────────────────────────────────────
  { name: 'The Legend of Zelda: The Wind Waker',     platform: 'ngc',  slug: 'zelda-wind-waker' },
  { name: 'Metroid Prime',                           platform: 'ngc',  slug: 'metroid-prime' },
  { name: 'Resident Evil 4',                         platform: 'ngc',  slug: 'resident-evil-4' },
  { name: 'Super Smash Bros. Melee',                 platform: 'ngc',  slug: 'super-smash-bros-melee' },
  { name: 'Mario Kart: Double Dash!!',               platform: 'ngc',  slug: 'mario-kart-double-dash' },
  { name: 'Luigi\'s Mansion',                        platform: 'ngc',  slug: 'luigis-mansion' },

  // ── Game Boy / Color ──────────────────────────────────────
  { name: 'Pokémon Gold',                            platform: 'gbc',  slug: 'pokemon-gold' },
  { name: 'Pokémon Crystal',                         platform: 'gbc',  slug: 'pokemon-crystal' },
  { name: "The Legend of Zelda: Link's Awakening DX", platform: 'gbc', slug: 'zelda-links-awakening-dx' },
]

// ─── IGDB helpers ─────────────────────────────────────────────

async function getToken () {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  const data = await res.json()
  if (!data.access_token) throw new Error('Token fallido: ' + JSON.stringify(data))
  console.log('✅ Token IGDB obtenido\n')
  return data.access_token
}

async function igdbSearch (token, name, igdbPlatformId) {
  const body = `
  search "${name}";
  fields id,name,summary,first_release_date,cover.image_id,genres,platforms;
  where platforms = (${igdbPlatformId});
  limit 1;
`;
  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID':     process.env.IGDB_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'text/plain',
    },
    body,
  })
  return res.json()
}

function sleep (ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  const db = await mysql.createConnection({
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     Number(process.env.DB_PORT) || 3307, // <--- IMPORTANTE: Usar el puerto 3307
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '', 
  database: process.env.DB_NAME || 'tiempodevideojuegos',
});

  const token = await getToken();

  // 1. Definimos qué plataformas queremos y cuántos juegos de cada una
  // IDs de IGDB: 19=SNES, 4=N64, 7=PS1, 8=PS2, 24=GBA, 21=GameCube
  const plataformasAImportar = [
    //{ id: 19, slug: 'snes' },
    //{ id: 4,  slug: 'n64' },
    //{ id: 7,  slug: 'ps1' },
    //{ id: 8,  slug: 'ps2' },
    //{ id: 24, slug: 'gba' },

    // Nuevas consolas // 
    { id: 5, slug: 'wii' },
    { id: 33, slug: 'gb' },
    { id: 22, slug: 'gbc' },
  ];

  for (const plataforma of plataformasAImportar) {
    console.log(`\n🚀 Jalando los 100 mejores de: ${plataforma.slug.toUpperCase()}...`);

    // 2. Pedimos los 100 juegos más populares/mejor calificados de ESA plataforma específica
    const body = `
      fields name, summary, first_release_date, cover.image_id, total_rating, slug;
      where platforms = (${plataforma.id}) & total_rating > 70 & version_parent = null;
      sort total_rating desc;
      limit 100;
    `;

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body,
    });

    const juegos = await res.json();

    for (const game of juegos) {
      // 3. Verificar si el juego ya existe para no duplicar
      const [existing] = await db.query('SELECT id FROM games WHERE slug = ?', [game.slug]);
      
      if (existing.length === 0) {
        const year = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null;
        const coverUrl = game.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : null;
        
        // Buscamos el ID de la plataforma en TU base de datos usando el slug
        const [platRows] = await db.query('SELECT id FROM platforms WHERE slug = ?', [plataforma.slug]);
        const platformDbId = platRows[0]?.id;

        if (platformDbId) {
          await db.query(
            `INSERT INTO games (title, slug, platform_id, release_year, cover_image, description, is_published)
             VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
            [game.name, game.slug, platformDbId, year, coverUrl, game.summary]
          );
          console.log(`  ✅ Guardado: ${game.name} (${year})`);
        }
      }
      await sleep(250); // Para no saturar la API
    }
  }

  console.log("\n⭐ ¡Proceso masivo terminado!");
  await db.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })