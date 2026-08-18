/* eslint-disable */
// Test connection via Prisma (already installed in node_modules).
// Loads .env.local, picks the requested URL, runs SELECT 1, redacts password.

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function loadEnv(file) {
  const envPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(envPath)) {
    console.error(`Arquivo ${file} não encontrado.`);
    process.exit(1);
  }
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
}

loadEnv('.env.local');

const urlEnvName = process.argv[2];
if (!urlEnvName || !(urlEnvName in process.env)) {
  console.error(`Use: node scripts/test-connection.js <DATABASE_URL|DIRECT_URL>`);
  process.exit(1);
}
const url = process.env[urlEnvName];
if (!url) {
  console.error(`Variável ${urlEnvName} ausente.`);
  process.exit(1);
}

function redact(u) {
  try {
    const parsed = new URL(u);
    if (parsed.password) parsed.password = '***REDACTED***';
    return parsed.toString();
  } catch (_e) {
    return '<unparseable-url>';
  }
}

(async () => {
  console.log(`[test] usando ${urlEnvName} (host oculto).`);
  // Force Prisma to use this specific URL regardless of schema mapping.
  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: ['error'],
  });
  try {
    const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
    console.log(`[test] OK -> ${JSON.stringify(rows)}`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error(`[test] FALHA ao conectar via ${urlEnvName}:`);
    console.error(`  message: ${e.message}`);
    if (e.code) console.error(`  code: ${e.code}`);
    try {
      await prisma.$disconnect();
    } catch (_) {}
    process.exit(1);
  }
})();
