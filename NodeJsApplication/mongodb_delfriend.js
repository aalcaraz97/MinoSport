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
  var myquery = { name: "omar.alshaeb" };
  dbo.collection("users").find(myquery).toArray(function(err, res) {
    if (err) throw err;
    var friends = res[0].friends_id;
    var friend2delete = "adria.alcaraz";
    if(friends.length > 0) {
        var lbef = friends.length;
        var friendsdef = friends.replace("," + friend2delete, "");
        if(lbef === friendsdef.length) friendsdef = friends.replace(friend2delete, "");
        var newfriend = { $set: {friends_id: friendsdef } };
        dbo.collection("users").updateOne(myquery, newfriend, function(err2,res2) {
        if (err2) throw err2;
        console.log(newfriend.$set.friends_id + " is now your friend!");
        db.close();
        });
    }
});
});

