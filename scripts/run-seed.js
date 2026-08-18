/* eslint-disable */
// Run any command from node_modules via Node directly, capturing stdout/stderr.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const envFile = process.argv[2];
const target = process.argv[3]; // 'tsx' | path to a node bin file
const script = process.argv[4];
const rest = process.argv.slice(5);

const envPath = path.join(__dirname, '..', envFile);
const txt = fs.readFileSync(envPath, 'utf8');
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

// Resolve target to a JS file inside node_modules.
let exePath;
if (target === 'tsx') {
  exePath = path.join(__dirname, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs');
} else {
  exePath = path.join(__dirname, '..', 'node_modules', target);
}

const fullScript = path.join(__dirname, '..', script);
try {
  const out = execFileSync(process.execPath, [exePath, fullScript, ...rest], {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    cwd: path.join(__dirname, '..'),
  });
  process.stdout.write(out);
  process.exit(0);
} catch (e) {
  if (e.stdout) process.stdout.write(e.stdout);
  if (e.stderr) process.stderr.write(e.stderr);
  process.exit(e.status || 1);
}
