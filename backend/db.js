const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const config = require('./config');

let db = {};

async function connect() {
  if (config.dbType === 'postgres') {
    const pool = new Pool(config.postgres);
    try {
      await pool.connect();
      console.log('Successfully connected to PostgreSQL.');
      db.client = pool;
    } catch (err) {
      console.error('Connection error to PostgreSQL', err.stack);
    }
  } else if (config.dbType === 'mongo') {
    const client = new MongoClient(config.mongo.uri);
    try {
      await client.connect();
      console.log('Successfully connected to MongoDB.');
      db.client = client.db('frs_db'); // atau nama database Anda
    } catch (err) {
      console.error('Connection error to MongoDB', err.stack);
    }
  }
}

module.exports = { connect, db };