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
      database: process.env.DB_DATABASE,
    },
    migrations: {
      tableName: 'migrations',
    },
    ssl: {
      // You can provide SSL options here
      // For example, if you're using a self-signed certificate, you can specify it like this:
      rejectUnauthorized: true, // Set this to false if using self-signed certificates
      // Alternatively, you can provide the path to your CA certificate, client certificate, and client key:
      // ca: fs.readFileSync('/path/to/ca-cert.pem'),
      // cert: fs.readFileSync('/path/to/client-cert.pem'),
      // key: fs.readFileSync('/path/to/client-key.pem')
    },
  },
  production: { client: 'mysql2', connection: process.env.DATABASE_URL },
};
