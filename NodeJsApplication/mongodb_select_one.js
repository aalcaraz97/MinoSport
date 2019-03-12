/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("db_prova");
  dbo.collection("users").findOne({}, function(err, result) {
    if (err) throw err;
    console.log("Selecting the first document from my MongoDB database!\n" + "username: " + result.name + "\npassword: " + result.password + "\nmarks: " + result.marks);
    db.close();
  });
});

