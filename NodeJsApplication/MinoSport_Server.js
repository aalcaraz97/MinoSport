/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var MongoDB = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = MongoDB.ObjectID;
var express = require('express');
var crypto = require('crypto');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var url = 'mongodb://localhost:27017';

MongoClient.connect(url,{useNewUrlParser: true}, function(err,client){
    if(err)
        console.log('Unable to connect. Error', err);
    else {
        app.post('/register',(request,response,next)=>{ //REGISTER AN USER
            
            var post_data = request.body;
            
            var password = post_data.password; //get password from client
            var username = post_data.username; //get user from client
            
            var insertJson = { //JSON Object to instert into DB
                'username': username,
                'password': password,
                'friends_id': "" //friends field (to be filled in later)
            };
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            //connection to our collection and making a query to find if the username provided already exists
            db.collection('users').find({'username': username}).count(function(err, number){ 
                if(number != 0)
                {
                    response.json('This username does already exist'); //if username already exists, its not added into DB
                    console.log('This username does already exist');
                    response.end();
                }
                else //if username doesn't exist, insert JSON object into DB
                {
                    db.collection('users').insertOne(insertJson,function(err,res){
                        response.json('Registration complete!');
                        console.log('Registration complete!');
                        response.end();
                        
                    });
                }
            });
        });
        
        app.post('/login',(request,response,next)=>{ //LOGIN INTO THE APP
            
            var post_data = request.body;
            
            var password = post_data.password; //get password from client
            var username = post_data.username; //get username from client
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            //
            //connection to our collection and making a query to find if the username provided is registered in the DB
            db.collection('users').find({'username': username}).count(function(err, number){
                if(number == 0)
                {
                    response.json('This username does not exist'); //if the username doesn't exist, the login is not successful
                    console.log('This username does not exist');
                    response.end();
                }
                else //if username exists, we make a query to get the username's password
                {
                    db.collection('users').findOne({'username': username},function(err,user){
                        
                        var user_password = user.password;
                        if(user_password == password) { 
                           response.json('Login successful!'); //if the password introduced is the same, the login in successful
                           console.log('Login successful!'); 
                           response.end();
                        }
                        else { //if the password is incorrect, the login is incorrect
                            response.json('Login incorrect! Please, try again');
                           console.log('Login incorrect! Please, try again'); 
                           response.end();
                        }
                        
                    });
                }
            });
        });
        
        app.post('/add_friend',(request,response,next)=>{ //ADD A FRIEND IN THE APP (WITHOUT SENDING REQUEST!)
            
            var post_data = request.body;
            
            var new_friend = post_data.friend; //get the friend's username we want to add
            var username = post_data.username; //get the user's username 
            
            var db = client.db('first_attempt'); //connection to MongoDB database
                    
            //connection to our collection and making a query to get the user's object(to get its friends list)       
            db.collection("users").findOne({'username': username},function(err, res) {
                //connection to our collection and making a query to find if the friend's username provided exists
                db.collection("users").find({'username': new_friend}).count(function(err, number) {
                    if(number == 0) {
                        response.json("This username does not exist"); //if the username is not found, it finishes
                        console.log("This username does not exist");
                        response.end();
                    }
                    else { //the username to add is found
                        var friends = res.friends_id; //get list of the user's friends
                        if(friends.includes(new_friend)) { //check if the friend is already in the user's list of friends
                                response.json(new_friend + " and you are already friends!");
                                console.log(new_friend + " and you are already friends!"); 
                                response.end();
                            }
                        else { //add friend
                            if(friends.length === 0) friends += new_friend; //if the user has no friends, add the friend name
                            else friends = friends + "," + new_friend; //if the user has friends, add a "," and then the name
                            var newfriend = { $set: {'friends_id': friends } };
                            var my_query = { 'username': username };
                            db.collection("users").updateOne(my_query, newfriend, function(err2, res2) { //update the list of friends
                                response.json(new_friend + " is now your friend!");
                                console.log(new_friend + " is now your friend!"); //friend added!
                                response.end();
                                });
                                }
                            }
                        });
                    });
                });
        
        app.post('/search_user',(request,response,next)=>{
            
            var post_data = request.body;
            
            var friend = post_data.username; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            //connection to our collection and making a query to search the user
            db.collection("users").find({'username': {'$regex': friend}}, {projection: {_id: 0, username: 1} }).toArray(function(err, res) {
                    if(res.length == 0) {
                        response.json("This username does not exist"); //if the username is not found, it finishes
                        console.log("This username does not exist");
                        response.end();
                    }
                    else {
                         response.json(res); //if the username is not found, it finishes and lists the results
                        console.log(res);
                        response.end();
                     }
            
        });
    });
        
        app.listen(8080, ()=> { //start web service
            console.log('Connected. Service running in port 8080');
        });
    }
});


 