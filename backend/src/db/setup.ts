// ─── Database Setup Script ──────────────────────────────────────────────────
// Creates the database, tables, views, and optionally seeds dummy data.
//
// Usage:
//   npm run setup          → creates DB + tables + views + seed
//   npm run setup:schema   → creates DB + tables + views only (no seed)
// ────────────────────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import type * as MsSql from 'mssql';

// ─── Dynamic driver loading (same as connection.ts) ────────────────────────
let sql: typeof MsSql;
let usingNativeDriver = false;
try {
  sql = require('mssql/msnodesqlv8');
  usingNativeDriver = true;
} catch {
  sql = require('mssql');
}

// ─── Parse DATABASE_URL ────────────────────────────────────────────────────
function parseConnectionUrl(url: string, overrideDb?: string): MsSql.config {
  const cleaned = url.replace(/^["']|["']$/g, '');
  const params = new Map<string, string>();

  const hostMatch = cleaned.match(/sqlserver:\/\/([^;]+)/);
  const hostPort = hostMatch ? hostMatch[1] : 'localhost';
  const [server, portStr] = hostPort.includes(':') ? hostPort.split(':') : [hostPort, '1433'];

  const rest = cleaned.substring(cleaned.indexOf(';') + 1);
  for (const part of rest.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx > 0) {
      params.set(part.substring(0, eqIdx).trim().toLowerCase(), part.substring(eqIdx + 1).trim());
    }
  }

  const cfg: MsSql.config = {
    server,
    port: parseInt(portStr, 10),
    database: overrideDb || params.get('database') || 'alchex',
    options: {
      trustServerCertificate: params.get('trustservercertificate') === 'true',
      encrypt: params.get('encrypt') !== 'DANGER_PLAINTEXT',
      instanceName: params.get('instancename') || undefined,
    },
  };

  const wantsIntegrated = params.get('integratedsecurity') === 'true';
  if (wantsIntegrated && usingNativeDriver) {
    (cfg as any).driver = 'ODBC Driver 18 for SQL Server';
    (cfg.options as any).trustedConnection = true;
  } else {
    cfg.user = params.get('user') || '';
    cfg.password = params.get('password') || '';
  }

  return cfg;
}

function getDatabaseName(url: string): string {
  const match = url.match(/database=([^;]+)/i);
  return match ? match[1] : 'alchex';
}

// ─── Run a .sql file, splitting on GO batches ──────────────────────────────
async function runSqlFile(pool: MsSql.ConnectionPool, filePath: string, label: string) {
  const fullPath = path.resolve(__dirname, '../../sql', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  ${label} — file not found: ${fullPath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  // Split on GO (must be on its own line)
  const batches = content
    .split(/^\s*GO\s*$/gim)
    .map(b => b.trim())
    .filter(b => b.length > 0);

  for (const batch of batches) {
    try {
      await pool.request().query(batch);
    } catch (err: any) {
      // Skip "already exists" errors (2714) so setup is re-runnable
      if (err.number === 2714 || err.message?.includes('already exists')) {
        continue;
      }
      // Skip duplicate index errors (1913)
      if (err.number === 1913) continue;
      throw err;
    }
  }
  console.log(`   ✅ ${label}`);
}

// ─── Extract only the VIEWS section from queries.sql ───────────────────────
async function runViews(pool: MsSql.ConnectionPool) {
  const fullPath = path.resolve(__dirname, '../../sql/queries.sql');
  if (!fs.existsSync(fullPath)) {
    console.log('   ⚠️  Views — queries.sql not found');
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  // Extract everything from SECTION 1 up to SECTION 2
  const section1Match = content.match(
    /-- ═+\s*\n-- SECTION 1:[\s\S]*?(?=-- ═+\s*\n-- SECTION 2:)/
  );
  if (!section1Match) {
    console.log('   ⚠️  Views — could not find SECTION 1 in queries.sql');
    return;
  }

  const viewsSql = section1Match[0];
  const batches = viewsSql
    .split(/^\s*GO\s*$/gim)
    .map(b => b.trim())
    .filter(b => b.length > 0 && b.includes('CREATE'));

  for (const batch of batches) {
    try {
      await pool.request().query(batch);
    } catch (err: any) {
      console.warn(`   ⚠️  View warning: ${err.message?.substring(0, 80)}`);
    }
  }
  console.log(`   ✅ Views (${batches.length} created)`);
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const url = process.env.DATABASE_URL || '';
  if (!url) {
    console.error('❌ DATABASE_URL not set in .env — copy .env.example to .env and edit it');
    process.exit(1);
  }

  const dbName = getDatabaseName(url);
  const skipSeed = process.argv.includes('--no-seed');

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     AlchEx — Database Setup                  ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ── Step 1: Connect to master & create database if needed ──
  console.log('1️⃣  Creating database if not exists...');
  const masterCfg = parseConnectionUrl(url, 'master');
  const masterPool = new sql.ConnectionPool(masterCfg);
  await masterPool.connect();

  try {
    await masterPool.request().query(
      `IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${dbName}')
       CREATE DATABASE [${dbName}]`
    );
    console.log(`   ✅ Database [${dbName}] ready`);
  } finally {
    await masterPool.close();
  }

  // ── Step 2: Connect to the actual database ──
  console.log('\n2️⃣  Creating tables...');
  const appCfg = parseConnectionUrl(url);
  const appPool = new sql.ConnectionPool(appCfg);
  await appPool.connect();

  try {
    await runSqlFile(appPool, 'schema.sql', 'Tables created');

    // ── Step 3: Create views ──
    console.log('\n3️⃣  Creating views...');
    await runViews(appPool);
  } finally {
    await appPool.close();
  }

  // ── Step 4: Seed (unless --no-seed flag) ──
  if (!skipSeed) {
    console.log('\n4️⃣  Seeding dummy data...');
    // Import and run seed dynamically (it uses db module which reads DATABASE_URL)
    const { default: db } = await import('./connection');
    const seedPath = path.resolve(__dirname, 'seed.ts');
    // Use child_process to run seed as a separate script
    const { execSync } = require('child_process');
    try {
      execSync('npx tsx src/db/seed.ts', {
        cwd: path.resolve(__dirname, '../..'),
        stdio: 'inherit',
        env: process.env,
      });
    } catch {
      console.log('   ⚠️  Seed had issues — you can run it separately: npm run seed');
    }
    await db.disconnect();
  } else {
    console.log('\n4️⃣  Skipping seed (--no-seed flag)');
  }

  console.log('\n✨ Setup complete! Run: npm run dev\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Setup failed:', err.message || err);
  process.exit(1);
});
