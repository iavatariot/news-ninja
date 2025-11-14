const { Pool } = require('pg');
const path = require('path');

// Carica .env dalla root del backend (se non già caricato)
require('dotenv').config({ path: path.resolve(__dirname, '../..../.env') });

// Debug - stampa le variabili per verificare caricamento
console.log('🔍 DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// Verifica che DATABASE_URL sia una stringa valida
if (!process.env.DATABASE_URL || typeof process.env.DATABASE_URL !== 'string') {
  console.error('❌ DATABASE_URL is missing or not a string');
  console.error('Current value:', process.env.DATABASE_URL);
  process.exit(1);
}

// Crea pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,  // Max connessioni simultanee
  idleTimeoutMillis: 30000,  // Chiusura idle connections
  connectionTimeoutMillis: 2000,
});

let connectionReady = false;

// Event handlers
pool.on('connect', (client) => {
  console.log('🔗 New PostgreSQL connection established');
  connectionReady = true;
});

pool.on('acquire', () => {
  console.log('📦 Database connection acquired from pool');
});

pool.on('remove', (client) => {
  console.log('🗑️ Database connection removed from pool');
});

pool.on('error', (err, client) => {
  console.error('🚨 PostgreSQL pool error:', err.message);
  connectionReady = false;
  // Non exit process per pool errors, ma logga
});

// Test iniziale della connessione
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW(), version() as postgres_version');
    console.log('✅ Database connection successful');
    console.log('⏰ Server time:', result.rows[0].now);
    console.log('🐘 PostgreSQL version:', result.rows[0].postgres_version);
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('💡 Check: DATABASE_URL, PostgreSQL service, network access');
    return false;
  }
}

// Esegui test all'avvio
testConnection().catch(console.error);

// Export per uso in controller
module.exports = {
  query: (text, params) => {
    if (!connectionReady) {
      throw new Error('Database connection not ready');
    }
    return pool.query(text, params);
  },
  pool,
  testConnection,
  isConnected: () => connectionReady,
};
