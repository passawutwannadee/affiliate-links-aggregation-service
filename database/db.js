const knex = require('knex');
const knexfile = require('./knexfile');

const db = knex(knexfile[process.env.ENVIRONMENT]);

module.exports = db;
