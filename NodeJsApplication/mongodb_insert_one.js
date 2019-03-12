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
  var myobj = { name: "omar.alshaeb", password: "calvo", marks: "las horas que va a la uni por semana", friends_id: ""};
  dbo.collection("users").insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("New user inserted!");
    db.close();
  });
});

