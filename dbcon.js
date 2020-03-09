const config = require("./db_config.json");

//Connect to database
var mysql = require('mysql');
var pool = mysql.createPool(config);
module.exports.pool = pool;
