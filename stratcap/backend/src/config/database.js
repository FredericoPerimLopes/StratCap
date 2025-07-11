require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'stratcap_user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'stratcap_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  test: {
    username: process.env.DB_USER || 'stratcap_user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'stratcap_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};