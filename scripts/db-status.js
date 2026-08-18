/* eslint-disable */
// Run Prisma CLI commands programmatically with env loaded from .env.local.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const envFile = process.argv[2];
const args = process.argv.slice(3);
if (!envFile || args.length === 0) {
  console.error('Uso: node scripts/db-status.js <envFile> <cli args...>');
  process.exit(2);
}

const txt = fs.readFileSync(path.join(__dirname, '..', envFile), 'utf8');
for (const line of txt.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (!(key in process.env)) process.env[key] = val;
}

// Use the prisma binary inside node_modules, executed with Node directly.
const prismaBin = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
try {
  const out = execFileSync(process.execPath, [prismaBin, ...args], {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  process.stdout.write(out);
  process.exit(0);
} catch (e) {
  if (e.stdout) process.stdout.write(e.stdout);
  if (e.stderr) process.stderr.write(e.stderr);
  process.exit(e.status || 1);
}
