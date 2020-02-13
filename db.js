require('dotenv').config()
const mysql = require('mysql')

var pool = mysql.createPool({
    connectionLimit : 100, //important
    host     : process.env.DATABASE_HOST,
    port     : process.env.DATABASE_PORT,
    user     : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE,
    debug    :  false
});

module.exports = pool;