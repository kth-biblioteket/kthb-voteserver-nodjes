require('dotenv').config()
const mysql = require('mysql')

const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

connection.connect(function(error) {
    if (error) {
        console.log(error);
    }
    
});

module.exports = connection;