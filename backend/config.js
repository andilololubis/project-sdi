require('dotenv').config();

module.exports = {
  dbType: process.env.DB_TYPE || 'postgres', // 'postgres' atau 'mongo'
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'secretkey',
  postgres: {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
  },
  mongo: {
    uri: process.env.MONGO_URI,
  },
};