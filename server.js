// server.js
// ES Module entry point at root
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const distServer = path.resolve(__dirname, 'dist/server.cjs');

if (fs.existsSync(distServer)) {
  require(distServer);
} else {
  import('./server/index.js');
}
