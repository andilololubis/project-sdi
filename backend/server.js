// backend/server.js
const express = require('express');
const { connect, db } = require('./db'); // Pastikan db diimpor
const config = require('./config');
const apiRoutes = require('./routes');

const app = express();

app.use(express.json());
app.use('/api', apiRoutes);

async function startServer() {
  try {
    console.log("Attempting to connect to database..."); // Log Tambahan 1
    await connect(); // Pastikan ada await
    console.log("Database connection attempt finished."); // Log Tambahan 2

    // Periksa status koneksi secara eksplisit
    if (!db || !db.client) {
        console.error("FATAL: db.client is not defined after connect(). Check db.js");
        throw new Error("Database connection failed, db.client is not set.");
    }
    console.log("db.client seems to be set. Starting server..."); // Log Tambahan 3

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} with ${config.dbType} database.`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();