// backup_express.js
// Run as a small Express server with GET /backup (returns SQL file)
// Or run as CLI to create a dump file and exit.
//
// Install:
//   npm install express mysqldump dotenv
//
// Usage (env):
//   Set MYSQL_URL (e.g. mysql://user:pass@host:3306/dbname) OR
//   set MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB
//
// CLI:
//   node backup_express.js --dump-file=mydump.sql
// Server:
//   node backup_express.js --serve --port=5000
//
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const { URL } = require('url');
const mysqldump = require('mysqldump');
const express = require('express');
const argv = require('yargs/yargs')(process.argv.slice(2)).argv;

function getConnFromEnv() {
  const mysqlUrl = process.env.MYSQL_URL || process.env.RAILWAY_MYSQL_URL || process.env.CLEARDB_DATABASE_URL;
  if (mysqlUrl) {
    const u = new URL(mysqlUrl);
    const user = decodeURIComponent(u.username || '');
    const password = decodeURIComponent(u.password || '');
    const host = u.hostname;
    const port = u.port ? Number(u.port) : 3306;
    const db = u.pathname ? u.pathname.replace(/^\//, '') : '';
    return { host, port, user, password, db };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    db: process.env.DB_NAME || '',
  };
}

async function dumpDatabaseToFile(connInfo, outPath, options = {}) {
  // mysqldump npm package handles schema + data, routines, triggers by default (most setups)
  // docs: https://www.npmjs.com/package/mysqldump
  if (!connInfo.db) throw new Error('Database name not provided (MYSQL_DB or in MYSQL_URL).');
  await mysqldump({
    connection: {
      host: connInfo.host,
      port: connInfo.port,
      user: connInfo.user,
      password: connInfo.password,
      database: connInfo.db,
      // ensure we use utf8mb4
      charset: 'utf8mb4',
    },
    dumpToFile: outPath,
    ...(options.dumpOptions ? { dump: options.dumpOptions } : {}),
  });
}

async function cli() {
  const conn = getConnFromEnv();
  const out = argv['dump-file'] || argv.o || `${conn.db || 'database'}_dump_${Date.now()}.sql`;
  console.log('Dumping database to:', out);
  try {
    await dumpDatabaseToFile(conn, out);
    console.log('Dump completed:', out);
  } catch (err) {
    console.error('Dump failed:', err.message || err);
    process.exit(1);
  }
}

async function serve(port = 5000) {
  const app = express();
  const conn = getConnFromEnv();

  app.get('/backup', async (req, res) => {
    const fname = `${conn.db || 'database'}_dump_${Date.now()}.sql`;
    const outPath = path.join(process.cwd(), fname);
    try {
      await dumpDatabaseToFile(conn, outPath);
    } catch (err) {
      console.error('Dump error:', err);
      return res.status(500).json({ ok: false, error: String(err) });
    }
    res.download(outPath, fname, (err) => {
      // attempt to remove temporary file after sending
      try { fs.unlinkSync(outPath); } catch (_) {}
      if (err) console.error('Send file error:', err);
    });
  });

  app.listen(port, () => {
    console.log(`Backup server listening at http://127.0.0.1:${port}/backup`);
  });
}

// decide run mode
(async () => {
  if (argv.serve) {
    const port = argv.port ? Number(argv.port) : 5000;
    await serve(port);
  } else {
    await cli();
  }
})();
