/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://127.0.0.1:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("db_prova");
  var myquery = { name: "adria.alcaraz" };
  var newvalues = { $set: {name: "adria.alcaraz", password: "oyeloco97" } };
  dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
    if (err) throw err;
    console.log("Password changed successfully!");
    db.close();
  });
});

