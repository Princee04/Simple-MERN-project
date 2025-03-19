const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',      
    user: 'root',          
    password: '', 
    database:'Seimad' 
});

connection.query('TRUNCATE TABLE personnels',err=>{
    if(err){
        console.log("Enable to delete all from personnels");
    }
    return;
})