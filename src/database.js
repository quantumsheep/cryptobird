const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    port: 9956,
    user: 'root',
    password: 'koala',
    database: 'cryptobird'
});

connection.connect();

module.exports = connection;