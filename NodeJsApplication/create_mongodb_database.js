/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/first_attempt";

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
        console.log("Database created!");
        db.close();
    });

