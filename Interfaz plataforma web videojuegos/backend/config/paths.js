import path from 'path';
import { fileURLToPath } from 'url';

// Carpeta backend/ (donde viven server.js y uploads/)
export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
