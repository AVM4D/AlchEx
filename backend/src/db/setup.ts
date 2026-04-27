// ─── Database Setup Script ──────────────────────────────────────────────────
// Creates the database, tables, views, stored procedures, and optionally seeds.
//
// Usage:
//   npm run setup          → creates DB + tables + views + SPs + seed
//   npm run setup:schema   → creates DB + tables + views + SPs only (no seed)
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
  console.log('║     AlchEx — Database Setup (BCNF)           ║');
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
  console.log('\n2️⃣  Creating tables (BCNF normalized)...');
  const appCfg = parseConnectionUrl(url);
  const appPool = new sql.ConnectionPool(appCfg);
  await appPool.connect();

  try {
    await runSqlFile(appPool, 'schema.sql', 'Tables created (BCNF)');

    // ── Step 3: Create views ──
    console.log('\n3️⃣  Creating views...');
    await runSqlFile(appPool, 'views.sql', 'Views created');

    // ── Step 4: Create stored procedures ──
    console.log('\n4️⃣  Creating stored procedures...');
    await runSqlFile(appPool, 'stored_procedures.sql', 'Stored procedures created');

  } finally {
    await appPool.close();
  }

  // ── Step 5: Seed (unless --no-seed flag) ──
  if (!skipSeed) {
    console.log('\n5️⃣  Seeding dummy data...');
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
    console.log('\n5️⃣  Skipping seed (--no-seed flag)');
  }

  console.log('\n✨ Setup complete! Run: npm run dev\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Setup failed:', err.message || err);
  process.exit(1);
});
