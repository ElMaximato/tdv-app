import fs from 'fs';
import multer from 'multer';
import path from 'path';

import { ROOT_DIR } from '../config/paths.js';

// ── Directorios de uploads ────────────────────────────────────
export const UPLOAD_DIR   = path.join(ROOT_DIR, 'uploads/covers');
export const FEATURED_DIR = path.join(ROOT_DIR, 'uploads/featured');
export const CONSOLES_DIR = path.join(ROOT_DIR, 'uploads/consoles');
export const SAGAS_DIR    = path.join(ROOT_DIR, 'uploads/sagas');
export const AVATARS_DIR  = path.join(ROOT_DIR, 'uploads/avatars');

[UPLOAD_DIR, FEATURED_DIR, CONSOLES_DIR, SAGAS_DIR, AVATARS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Multer ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const consoleFields  = ['hero_banner', 'hero_logo', 'hero_console_img', 'gallery'];
    const featuredFields = ['hero_image', 'screenshots'];
    const sagaFields     = ['saga_cover', 'saga_hero'];
    if (consoleFields.includes(file.fieldname))  return cb(null, CONSOLES_DIR);
    if (sagaFields.includes(file.fieldname))     return cb(null, SAGAS_DIR);
    if (featuredFields.includes(file.fieldname)) return cb(null, FEATURED_DIR);
    return cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_').slice(0, 80);
    cb(null, `${Date.now()}-${safe}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 8*1024*1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Solo JPG, PNG o WebP'));
  }
});

export const featuredUpload = upload.fields([{ name: 'hero_image', maxCount: 1 }, { name: 'screenshots', maxCount: 10 }]);
export const consoleUpload  = upload.fields([{ name: 'hero_banner', maxCount: 1 }, { name: 'hero_logo', maxCount: 1 }, { name: 'hero_console_img', maxCount: 1 }, { name: 'gallery', maxCount: 20 }]);
export const sagaUpload     = upload.fields([{ name: 'saga_cover', maxCount: 1 }, { name: 'saga_hero', maxCount: 1 }]);

// ── Validación de imágenes ────────────────────────────────────
function hasValidImageBytes(filepath) {
  try {
    const fd = fs.openSync(filepath, 'r'); const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0); fs.closeSync(fd);
    const isJpeg = buf[0]===0xFF&&buf[1]===0xD8&&buf[2]===0xFF;
    const isPng  = buf[0]===0x89&&buf[1]===0x50&&buf[2]===0x4E&&buf[3]===0x47;
    const isWebp = buf[0]===0x52&&buf[1]===0x49&&buf[2]===0x46&&buf[3]===0x46&&buf[8]===0x57&&buf[9]===0x45&&buf[10]===0x42&&buf[11]===0x50;
    return isJpeg||isPng||isWebp;
  } catch { return false; }
}
export function validateUploadedFiles(req, res, next) {
  const files = [...(req.file ? [req.file] : []), ...Object.values(req.files||{}).flat()];
  for (const file of files) {
    if (!hasValidImageBytes(file.path)) { fs.unlink(file.path, () => {}); return res.status(400).json({ error: 'Archivo inválido' }); }
  }
  next();
}
