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
  var myobj = [
      { name: "adria.alcaraz", password: "chuf", marks: "10 obviously" },
      { name: "aleix.costa", password: "cusetes1719", marks: "tot copiat" }
  ];
  dbo.collection("users").insertMany(myobj, function(err, res) {
    if (err) throw err;
    console.log("New users inserted!");
    db.close();
  });
});

