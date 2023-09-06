// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */


module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      database: process.env.DB_DATABASE
    },
    migrations: {
      tableName: 'migrations',
    },
  },
};