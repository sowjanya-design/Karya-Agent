import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsxBin = join(__dirname, 'node_modules', '.bin', 'tsx');

execFileSync(tsxBin, ['server.ts'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env, NODE_ENV: 'production' }
});
