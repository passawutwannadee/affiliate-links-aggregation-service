// const mysql = require('mysql2/promise');

// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
//   database: process.env.DB_DATABASE
// })

// db.getConnection((err) => {
//   if(err) {
//     console.error('Error connecting to MySQL database: ', err);
//   }else{
//     console.log('Connected to MySQL database!');
//   }
// })

// module.exports = db;

const knex = require('knex');
const knexfile = require('./knexfile');

const db = knex(knexfile[process.env.ENVIRONMENT]);
module.exports = db;