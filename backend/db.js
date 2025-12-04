const { Pool } = require('pg');
require('dotenv').config();

// Configuration du pool de connexions PostgreSQL
// Utilise le pooler Supabase qui supporte IPv4
const pool = new Pool({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  user: 'postgres.frcrzayagaxnqrglyocg',
  password: '#prnCQiUr7fL*MN',
  database: 'postgres',
  port: 5432,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Gestion des événements du pool
pool.on('connect', () => {
  console.log('✅ Nouvelle connexion PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur inattendue du pool PostgreSQL:', err);
  process.exit(-1);
});

// Test de connexion
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err);
  } else {
    console.log('✅ Base de données connectée:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
