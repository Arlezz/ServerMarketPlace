const mysql = require('mysql');

const mysqlConnection = mysql.createConnection({
    host:  'localhost',
    user: 'root',
    password: 'password',
    database: 'marketplace',
    multipleStatements: 'true'
});

mysqlConnection.connect(function (err) {    
    if(err){
        console.log(err);
        return;
    }else{
        console.log('Db is connected');
    }
});

module.exports = mysqlConnection;