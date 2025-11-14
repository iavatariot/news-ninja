/**
 * News Ninja Backend API Server
 * Server principale per l'applicazione News Ninja con integrazione Ollama
 * Supporta CORS per localhost e IP pubblico, PostgreSQL, e API RESTful
 * 
 * Struttura:
 * - /api/health - Health check
 * - /api/articles - Gestione articoli (GET, POST generate)
 * - /api/trends - Statistiche per paese
 * 
 * Dipendenze: npm install express cors helmet morgan express-rate-limit pg dotenv
 */

// Import moduli principali
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes (assumendo routes/index.js nella cartella routes/)
let routes;
try {
  routes = require('./routes');
} catch (err) {
  console.warn('⚠️ Routes non trovate. Creando fallback...');
  // Fallback routes basiche se il file manca
  routes = require('express').Router();
  routes.get('/health', (req, res) => {
    res.json({ 
      success: true, 
      message: 'News Ninja API is running (fallback mode)',
      routesLoaded: false 
    });
  });
}

// Inizializza Express app
const app = express();

// Configurazione server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ========== MIDDLEWARE DI SICUREZZA ==========

// 1. Disabilita X-Powered-By header di Express (fix errore undefined)
app.disable('x-powered-by');

// 2. Helmet per security headers (escluso xPoweredBy per evitare l'errore)
app.use(helmet({
  contentSecurityPolicy: false,  // Disabilita CSP per dev; configura in production
  hidePoweredBy: false,           // Usa app.disable invece
  noSniff: true,
  xssFilter: true,
  frameguard: {
    action: 'deny'
  },
  ieNoOpen: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// 3. Rate limiting per prevenire API abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: NODE_ENV === 'production' ? 100 : 1000, // Limite più alto in dev
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 * 1000 / 1000)  // Secondi
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limit per health check e localhost in dev
    return req.path === '/health' || 
           (NODE_ENV === 'development' && req.ip === '::1') ||
           (NODE_ENV === 'development' && req.ip === '127.0.0.1');
  }
});

// Applica rate limiting solo alle API routes
app.use('/api/', apiLimiter);

// ========== CORS CONFIGURATION ==========

const corsOptions = {
  origin: (origin, callback) => {
    // Permetti tutte le origini in sviluppo (più flessibile)
    if (NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, lista esplicita di origini permesse
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',  // Vite default port
      'http://57.129.111.150:3000',  // IP pubblico dal tuo errore
      'https://57.129.111.150:3000',  // HTTPS version
      'http://news-ninja-gpu.local:3000',  // Hostname locale
      undefined  // Per richieste da curl/Postman
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin} at ${new Date().toISOString()}`);
      callback(new Error(`Origin ${origin} non autorizzata`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control'
  ],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400  // 24 ore cache preflight requests
};

// Applica CORS
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// ========== BODY PARSERS E LOGGING ==========

// JSON e URL-encoded parsers con limite per payload grandi (articoli)
app.use(express.json({ 
  limit: '10mb',
  strict: false 
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// File uploads (se necessario per immagini/articles)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging requests (morgan)
const logFormat = NODE_ENV === 'development' 
  ? 'dev' 
  : 'combined';
app.use(morgan(logFormat, {
  skip: (req) => req.path === '/health'  // Skip health check spam
}));

// Middleware per nascondere informazioni sensibili
app.use((req, res, next) => {
  // Nascondi Express version
  res.removeHeader('X-Powered-By');
  
  // Aggiungi header custom per API
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Environment', NODE_ENV);
  
  next();
});

// ========== HEALTH CHECKS ==========

// Health check principale
app.get('/health', (req, res) => {
  const health = {
    success: true,
    message: 'News Ninja API is running successfully',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    },
    endpoints: {
      articles: '/api/articles',
      trends: '/api/trends/countries',
      generate: '/api/articles/generate',
      health: '/health'
    },
    database: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
    ollama: process.env.OLLAMA_URL || 'http://localhost:11434',
    cors: {
      allowedOrigins: [
        'http://localhost:3000',
        'http://57.129.111.150:3000'
      ]
    }
  };

  res.status(200).json(health);
});

// Health check dettagliato per monitoring (Kubernetes/PM2)
app.get('/health/detailed', async (req, res) => {
  try {
    // Test Ollama connection se disponibile
    let ollamaStatus = 'not_configured';
    if (process.env.OLLAMA_URL) {
      try {
        const ollamaResponse = await fetch(`${process.env.OLLAMA_URL}/api/tags`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)  // 5s timeout
        });
        ollamaStatus = ollamaResponse.ok ? 'healthy' : 'unreachable';
      } catch (err) {
        ollamaStatus = 'error';
      }
    }

    // Test database se configurato
    let dbStatus = 'not_configured';
    if (process.env.DATABASE_URL) {
      try {
        const { query } = require('./config/database');
        await query('SELECT 1');
        dbStatus = 'healthy';
      } catch (err) {
        dbStatus = 'error';
      }
    }

    res.json({
      success: true,
      components: {
        server: 'healthy',
        database: dbStatus,
        ollama: ollamaStatus,
        routes: routes.stack ? 'loaded' : 'fallback'
      }
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      details: err.message
    });
  }
});

// ========== ROUTES PRINCIPALI ==========

// API Routes (tutte le API sotto /api)
app.use('/api', routes);

// Redirect root a health
app.get('/', (req, res) => {
  res.redirect('/health');
});

// API documentation (opzionale, per sviluppo)
if (NODE_ENV === 'development') {
  app.get('/api/docs', (req, res) => {
    res.json({
      success: true,
      documentation: 'https://github.com/your-org/news-ninja/blob/main/API.md',
      endpoints: [
        { method: 'GET', path: '/api/health', description: 'Server health check' },
        { method: 'GET', path: '/api/articles', description: 'Get recent articles' },
        { method: 'GET', path: '/api/articles/:id', description: 'Get article by ID' },
        { method: 'POST', path: '/api/articles/generate', description: 'Generate custom article with Ollama' },
        { method: 'GET', path: '/api/trends/countries', description: 'Get articles by country' },
        { method: 'GET', path: '/api/trends/country/:code', description: 'Get trends for specific country' }
      ]
    });
  });
}

// ========== ERROR HANDLING ==========

// 404 Handler per route non trovate (dopo tutte le route)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      available: ['/api/health', '/api/articles', '/api/trends/countries']
    });
  }
  
  // Per altre route, redirect a health
  res.redirect('/health');
});

// Error handler globale (deve essere l'ultimo middleware)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const isDev = NODE_ENV === 'development';

  // Log dettagliato dell'errore
  const errorLog = {
    message: err.message,
    stack: isDev ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    timestamp: new Date().toISOString(),
    statusCode: status
  };

  console.error('🚨 Server Error:', errorLog);

  // Response client
  const response = {
    success: false,
    error: isDev ? err.message : 'Internal server error',
    timestamp: new Date().toISOString(),
    request: {
      path: req.path,
      method: req.method,
      ip: req.ip
    }
  };

  if (isDev && err.stack) {
    response.stack = err.stack.split('\n').slice(0, 5);  // Solo prime 5 linee
  }

  if (status === 429) {  // Rate limit
    response.retryAfter = err.retryAfter || 900;
  }

  if (err.code === 'ECONNREFUSED') {  // Database/Ollama connection
    response.service = 'database or ollama';
  }

  res.status(status).json(response);
});

// ========== AVVIO SERVER ==========

// Graceful shutdown handling
let server;
const gracefulShutdown = (signal) => {
  console.log(`🛑 Received ${signal}. Shutting down gracefully...`);
  
  if (server) {
    server.close((err) => {
      if (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
      console.log('🔌 Server closed successfully');
      process.exit(0);
    });

    // Force close dopo 30s
    setTimeout(() => {
      console.error('⚠️ Force shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Avvio server
server = app.listen(PORT, HOST, (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }

  const bindUrl = HOST === '0.0.0.0' 
    ? `http://localhost:${PORT}` 
    : `http://${HOST}:${PORT}`;

  console.log(`
╔══════════════════════════════════════════════════════╗
║                News Ninja Backend API                 ║
║                                                      ║
║ 🚀 Server started successfully                        ║
║ 📡 Local: ${bindUrl}                                  ║
║ 🌐 External: http://57.129.111.150:${PORT}             ║
║ 🔍 Health: ${bindUrl}/health                          ║
║ 🛡️ CORS: localhost:3000, 57.129.111.150:3000         ║
║ 🗄️ DB: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'} ║
║ 🤖 Ollama: ${process.env.OLLAMA_URL || 'localhost:11434'} ║
║ 🛡️ Rate Limit: ${apiLimiter.max} req/15min            ║
║                                                      ║
║ 📋 Available Endpoints:                               ║
║   GET  ${bindUrl}/api/health                 Health   ║
║   GET  ${bindUrl}/api/articles?limit=10      Articles ║
║   GET  ${bindUrl}/api/trends/countries       Trends   ║
║   POST ${bindUrl}/api/articles/generate      Generate ║
║                                                      ║
║ Environment: ${NODE_ENV} | Node: ${process.version}   ║
║ Uptime: 0s | PID: ${process.pid}                      ║
╚══════════════════════════════════════════════════════╝
  `);

  // In production, log anche external IP
  if (NODE_ENV === 'production') {
    console.log(`\n🌍 Accessibile da: http://57.129.111.150:${PORT}`);
    console.log(`🔒 Protezioni attive: Helmet, Rate Limiting, CORS\n`);
  }
});

// Export per testing
module.exports = { app, server };
