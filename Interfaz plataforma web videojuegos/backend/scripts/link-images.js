// ============================================================
//  backend/scripts/link-images.js
//  Copia imágenes a backend/uploads/ y las enlaza en la base de datos buscando por NOMBRE.
//
//  Portadas de videojuegos:
//    node scripts/link-images.js "C:\ruta\a\mis-portadas"
//  Fotos de productos (ropa, tazas, etc.):
//    node scripts/link-images.js "C:\ruta\a\mis-productos" --products
//  Ver qué haría SIN cambiar nada:
//    node scripts/link-images.js "C:\ruta\a\mis-portadas" --dry-run
//
//  Cómo busca: compara el nombre del archivo (sin extensión, sin acentos, sin espacios
//  ni símbolos) con el slug y el título del juego/producto. Ej.: "Super Mario 64.jpg",
//  "super-mario-64.png" o "supermario64.webp" enlazan con el juego "Super Mario 64".
//  También funciona si el nombre del archivo contiene el título (o al revés).
//  Lo que no encuentre lo lista al final para que lo renombres y vuelvas a correrlo.
// ============================================================
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const args = process.argv.slice(2);
const dir = args.find(a => !a.startsWith('--'));
const products = args.includes('--products');
const dry = args.includes('--dry-run');

if (!dir) {
  console.error('Uso: node scripts/link-images.js "<carpeta con imágenes>" [--products] [--dry-run]');
  process.exit(1);
}
if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(`✖ No encuentro la carpeta: ${dir}`);
  process.exit(1);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.resolve(HERE, '..', 'uploads');
const sub = products ? 'products' : 'covers';
const table = products ? 'products' : 'games';
const column = products ? 'image' : 'cover_image';
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'tiempodevideojuegos',
});

try {
  const [rows] = products
    ? await db.query('SELECT id, name AS title, slug FROM products')
    : await db.query('SELECT id, title, slug FROM games');
  const items = rows.map(r => ({ ...r, nSlug: norm(r.slug), nTitle: norm(r.title) }));

  const files = fs.readdirSync(dir).filter(f => EXT.has(path.extname(f).toLowerCase()));
  if (!files.length) { console.error('✖ No hay imágenes (.jpg .png .webp .gif) en esa carpeta.'); process.exit(1); }

  if (!dry) fs.mkdirSync(path.join(UPLOADS, sub), { recursive: true });

  const linked = [], unmatched = [], taken = new Set();
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const n = norm(path.basename(file, path.extname(file)));
    if (!n) { unmatched.push(file); continue; }

    // Solo coincidencia EXACTA (slug o título). Las parciales confundían "Resident Evil" con "Resident Evil 4"
    // o "The Last of Us Part 2" con "The Last of Us".
    const hit = items.filter(i => i.nSlug === n || i.nTitle === n);
    if (hit.length !== 1) { unmatched.push(file); continue; }

    const it = hit[0];
    if (taken.has(it.id)) { unmatched.push(`${file}  (ya hay otra imagen para "${it.title}")`); continue; }
    taken.add(it.id);

    const destName = `${it.slug}${ext}`;
    const rel = `${sub}/${destName}`;                 // ruta relativa a /uploads/ (así la espera la app)
    if (!dry) {
      const from = path.join(dir, file);
      const to = path.join(UPLOADS, sub, destName);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      if (path.resolve(from).toLowerCase() === path.resolve(to).toLowerCase()) {
        // ya está en su lugar con el nombre correcto: no se copia
      } else if (path.resolve(dir).toLowerCase() === path.resolve(UPLOADS, sub).toLowerCase()) {
        fs.renameSync(from, to);                         // misma carpeta: se renombra, nunca se copia sobre sí mismo
      } else {
        fs.copyFileSync(from, to);
      }
      await db.query(`UPDATE ${table} SET ${column}=? WHERE id=?`, [rel, it.id]);
    }
    linked.push(`${file}  →  ${it.title}   (${rel})`);
  }

  console.log(`\n${dry ? '[PRUEBA, no se cambió nada] ' : ''}${products ? 'Productos' : 'Juegos'} enlazados: ${linked.length} de ${files.length} imágenes\n`);
  linked.forEach(l => console.log('  ✔ ' + l));
  if (unmatched.length) {
    console.log(`\nSin coincidencia (${unmatched.length}) — renómbralas como el slug o el título y vuelve a correr:`);
    unmatched.forEach(u => console.log('  ✖ ' + u));
  }
  const [missing] = await db.query(`SELECT title_ AS t FROM (SELECT ${products ? 'name' : 'title'} AS title_, ${column} AS img FROM ${table}) x WHERE img IS NULL OR img=''`);
  if (missing.length) {
    console.log(`\nTodavía sin imagen en la base de datos (${missing.length}):`);
    missing.slice(0, 40).forEach(m => console.log('  · ' + m.t));
    if (missing.length > 40) console.log(`  … y ${missing.length - 40} más`);
  }
} catch (err) {
  console.error('✖ ' + err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
