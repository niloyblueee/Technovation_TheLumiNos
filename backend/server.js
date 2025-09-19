const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET is not set. Auth token generation will fail. Set JWT_SECRET in environment.');
}

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
function buildDbConfigFromEnv() {
    const urlStr = process.env.DB_URL;
    /** @type {import('mysql2').PoolOptions} */
    let cfg;

    if (urlStr) {
        try {
            const url = new URL(urlStr);
            cfg = {
                host: url.hostname,
                port: url.port ? Number(url.port) : 3306,
                user: decodeURIComponent(url.username),
                password: decodeURIComponent(url.password),
                database: url.pathname ? url.pathname.replace(/^\//, '') : undefined,
            };
        } catch (e) {
            console.warn('Invalid DB_URL, falling back to discrete env vars:', e.message);
        }
    }

    if (!cfg) {
        cfg = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'technovation_luminos',
        };
    }

    // Common pool options
    cfg.waitForConnections = true;
    cfg.connectionLimit = Number(process.env.DB_CONNECTION_LIMIT || 10);
    cfg.queueLimit = 0;
    // Slightly higher timeout for cloud DBs
    cfg.connectTimeout = Number(process.env.DB_CONNECT_TIMEOUT || 20000);

    // Optional SSL (useful when connecting through managed/proxy providers)
    if (String(process.env.DB_SSL).toLowerCase() === 'true') {
        const rejectUnauthorized = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true';
        cfg.ssl = { rejectUnauthorized };
    }

    return cfg;
}

const dbConfig = buildDbConfigFromEnv();
const pool = mysql.createPool(dbConfig);

// Verify pool connectivity on startup (non-fatal if it fails, but logs clearly)
(async () => {
    try {
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();
        console.log('✅ Database pool connected:', `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    } catch (err) {
        console.error('❌ Database pool connection failed:', err.message);
    }
})();

// Minimal schema check/migration: ensure users.reward_points exists
(async () => {
    try {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reward_point'`,
            [dbConfig.database]
        );
        const hasCol = rows && rows[0] && rows[0].cnt > 0;

    } catch (e) {
        console.warn('Schema check/migration skipped or failed:', e.message);
    }
})();

// Make database available to routes
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/events', require('./routes/events'));

// Health check endpoint (includes DB ping)
app.get('/api/health', async (req, res) => {
    const result = {
        status: 'OK',
        message: 'Technovation TheLumiNos API is running',
        timestamp: new Date().toISOString(),
        db: { status: 'unknown' }
    };

    try {
        const [rows] = await pool.query('SELECT 1 AS ok');
        if (rows && rows[0] && rows[0].ok === 1) {
            result.db = { status: 'connected' };
        } else {
            result.db = { status: 'degraded' };
        }
    } catch (err) {
        result.db = { status: 'error', error: err.message };
    }

    res.json(result);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});



app.use('/api/submit-issue', require('./routes/submit-issues'));

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});






// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
});

module.exports = app;
