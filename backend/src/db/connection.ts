// ─── Database Connection Layer (mssql driver — SQL Server) ─────────────────
// Every repository / service imports ONLY this module.
//
// Driver selection (automatic):
//   • Windows Integrated Auth  → uses msnodesqlv8 (native ODBC driver)
//   • Username/password auth   → uses tedious (pure JS, cross-platform)
//
// Teammates on Mac / Linux / Docker just need a DATABASE_URL with user=…;password=…
// ────────────────────────────────────────────────────────────────────────────

import type * as MsSql from 'mssql';

// ─── Dynamic driver loading ────────────────────────────────────────────────
// Try the native Windows driver first; fall back to the pure-JS tedious driver
// so the same codebase works on every OS and in Docker.
let sql: typeof MsSql;
let usingNativeDriver = false;

try {
  sql = require('mssql/msnodesqlv8');
  usingNativeDriver = true;
} catch {
  sql = require('mssql');
}

// ─── Parse DATABASE_URL from .env ──────────────────────────────────────────
function parseConnectionUrl(url: string): MsSql.config {
  // Format: sqlserver://host:port;database=name;integratedSecurity=true;...
  //    or:  sqlserver://host;instanceName=SQLEXPRESS;database=name;...
  const cleaned = url.replace(/^["']|["']$/g, '');
  const params = new Map<string, string>();

  // Extract host:port
  const hostMatch = cleaned.match(/sqlserver:\/\/([^;]+)/);
  const hostPort = hostMatch ? hostMatch[1] : 'localhost';
  const [server, portStr] = hostPort.includes(':') ? hostPort.split(':') : [hostPort, '1433'];

  // Parse semicolon-separated key=value pairs
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
    database: params.get('database') || 'alchex',
    options: {
      trustServerCertificate: params.get('trustservercertificate') === 'true',
      encrypt: params.get('encrypt') !== 'DANGER_PLAINTEXT',
      instanceName: params.get('instancename') || undefined,
    },
  };

  // Windows Integrated Auth — only works when the native driver loaded
  const wantsIntegrated = params.get('integratedsecurity') === 'true';
  if (wantsIntegrated && usingNativeDriver) {
    (cfg as any).driver = 'ODBC Driver 18 for SQL Server';
    (cfg.options as any).trustedConnection = true;
  } else if (wantsIntegrated && !usingNativeDriver) {
    console.warn(
      '[DB] integratedSecurity requested but msnodesqlv8 is not available.\n' +
      '     Falling back to SQL auth — set user= and password= in DATABASE_URL.'
    );
    cfg.user = params.get('user') || '';
    cfg.password = params.get('password') || '';
  } else {
    // Standard SQL Server Authentication (username + password)
    cfg.user = params.get('user') || '';
    cfg.password = params.get('password') || '';
  }

  return cfg;
}

// ─── Connection pool (lazy-initialised) ────────────────────────────────────
let pool: MsSql.ConnectionPool | null = null;

async function getPool(): Promise<MsSql.ConnectionPool> {
  if (pool && pool.connected) return pool;

  const url = process.env.DATABASE_URL || '';
  if (!url) throw new Error('DATABASE_URL environment variable is not set');

  const cfg = parseConnectionUrl(url);
  const driverLabel = usingNativeDriver ? 'msnodesqlv8 (native)' : 'tedious (pure JS)';
  pool = new sql.ConnectionPool(cfg);
  await pool.connect();
  console.log(`[DB] Connected to SQL Server — ${cfg.server}:${cfg.port}/${cfg.database}  [${driverLabel}]`);
  return pool;
}

// ─── Helper: build a Request with @v0, @v1, … inputs ──────────────────────
// NOTE: We use "v" prefix (not "p") because ODBC's sp_executesql generates
// @P1, @P2, … for '?' placeholders and SQL Server is case-insensitive,
// so @p1 would collide with ODBC's @P1.
function addInputs(request: MsSql.Request, values: any[]): void {
  values.forEach((val, i) => {
    if (val === null || val === undefined) {
      request.input(`v${i}`, sql.NVarChar, null);
    } else if (typeof val === 'string') {
      request.input(`v${i}`, sql.NVarChar, val);
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) request.input(`v${i}`, sql.Int, val);
      else request.input(`v${i}`, sql.Float, val);
    } else if (typeof val === 'boolean') {
      request.input(`v${i}`, sql.Bit, val ? 1 : 0);
    } else if (val instanceof Date) {
      request.input(`v${i}`, sql.DateTime, val);
    } else {
      // Fallback — stringify objects/arrays
      request.input(`v${i}`, sql.NVarChar, JSON.stringify(val));
    }
  });
}

/**
 * Run a SELECT query via tagged template literal.
 * Usage:  const rows = await db.query\`SELECT * FROM users WHERE id = \${id}\`;
 */
async function query<T = any[]>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T> {
  const p = await getPool();
  // Build the SQL string with @v0, @v1, … placeholders
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += `@v${i}` + strings[i + 1];
  }
  const request = p.request();
  addInputs(request, values);
  const result = await request.query(text);
  return result.recordset as T;
}

/**
 * Run INSERT / UPDATE / DELETE via tagged template literal.
 * Returns the number of affected rows.
 */
async function execute(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<number> {
  const p = await getPool();
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += `@v${i}` + strings[i + 1];
  }
  const request = p.request();
  addInputs(request, values);
  const result = await request.query(text);
  return result.rowsAffected[0] ?? 0;
}

/**
 * Dynamic SELECT — for queries built at runtime (already containing @v0, @v1…).
 */
async function queryUnsafe<T = any[]>(
  text: string,
  ...values: any[]
): Promise<T> {
  const p = await getPool();
  const request = p.request();
  addInputs(request, values);
  const result = await request.query(text);
  return result.recordset as T;
}

/**
 * Dynamic INSERT / UPDATE / DELETE built at runtime.
 * Returns the number of affected rows.
 */
async function executeUnsafe(
  text: string,
  ...values: any[]
): Promise<number> {
  const p = await getPool();
  const request = p.request();
  addInputs(request, values);
  const result = await request.query(text);
  return result.rowsAffected[0] ?? 0;
}

/** Gracefully close the connection pool */
async function disconnect(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('[DB] Connection pool closed');
  }
}

const db = { query, execute, queryUnsafe, executeUnsafe, disconnect };
export default db;

