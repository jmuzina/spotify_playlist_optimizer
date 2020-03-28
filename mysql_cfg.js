var mysql = require('mysql');

exports.con = mysql.createConnection({
    host: "localhost",
    user: "",
    password: ""
});

this.con.connect(function(err) {
    if (err) throw err;
    console.log("Successfully connected to SQL Database!");
})