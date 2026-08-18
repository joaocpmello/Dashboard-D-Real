/* eslint-disable */
// Helper: load .env.local into process.env, then exec the requested command.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const envFile = process.argv[2];
const cmd = process.argv[3];
const rest = process.argv.slice(4);
if (!envFile || !cmd) {
  console.error('Uso: node scripts/load-env.js <envFile> <cmd> [...args]');
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

const isWin = process.platform === 'win32';
// On Windows, prefer the .cmd shim if no extension provided and a .cmd exists in node_modules/.bin
let exe = cmd;
if (isWin && !/\.[a-z]+$/i.test(cmd)) {
  const tryCmd = path.join(__dirname, '..', 'node_modules', '.bin', `${cmd}.cmd`);
  if (fs.existsSync(tryCmd)) exe = tryCmd;
}
const result = spawnSync(exe, rest, {
  stdio: 'inherit',
  // Do NOT use shell:true on Windows — paths with spaces get split. Use exec directly.
  shell: false,
  env: process.env,
  windowsVerbatimArguments: false,
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
console.error(`[load-env] exit code: ${result.status}`);
process.exit(result.status ?? 0);
