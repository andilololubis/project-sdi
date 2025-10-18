// backend/server.js
const express = require('express');
const { connect } = require('./db');
const config = require('./config');
const apiRoutes = require('./routes');

const app = express();

// Middleware
app.use(express.json());

// Hubungkan ke Database
connect();

// Gunakan Routes
app.use('/api', apiRoutes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} with ${config.dbType} database.`);
});