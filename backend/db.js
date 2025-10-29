const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const config = require('./config');

let db = {};

async function connect() {
  if (config.dbType === 'postgres') {
    const pool = new Pool(config.postgres);
    try {
      // You can actually remove the explicit pool.connect() here,
      // as the pool connects lazily. A query attempt will reveal connection issues.
      // Let's test the connection with a simple query instead.
      await pool.query('SELECT NOW()'); // Simple query to test connection
      console.log('Successfully connected to PostgreSQL.');
      db.client = pool;
    } catch (err) {
      console.error('Connection error during PostgreSQL setup:', err.stack);
      // RE-THROW THE ERROR
      throw err;
    }
  } else if (config.dbType === 'mongo') {
    const client = new MongoClient(config.mongo.uri, {
      maxPoolSize: 1100
    });
    try {
      await client.connect();
      // Optional: Ping the database to confirm connection
      await client.db('admin').command({ ping: 1 });
      console.log('Successfully connected and pinged MongoDB.');
      db.client = client.db('frs_db');
    } catch (err) {
      console.error('Connection error during MongoDB setup:', err.stack);
      // RE-THROW THE ERROR
      throw err;
    }
  }
}

module.exports = { connect, db };