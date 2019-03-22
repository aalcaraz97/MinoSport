/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var MongoDB = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = MongoDB.ObjectID;
var express = require('express');
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
            var password2 = post_data.password2; //get password2 from client
            var email = post_data.email; //get password from client
            var username = post_data.username; //get user from client
            
            if(username.includes(",")) 
            {
                response.json('This username contains a ",". Please, try another username'); //if username already exists, its not added into DB
                console.log('This username contains a ",". Please, try another username');
            }
            else {
            
            if(password != password2) {
                response.json('The passwords introduced do not match'); //if username already exists, its not added into DB
                console.log('The passwords introduced do not match');
            }
            else {
            var insertJson = { //JSON Object to instert into DB
                'username': username,
                'email': email,
                'password': password,
                'friends_id': "", //friends field (to be filled in later)
                'friends_requests': ""
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
            }
        }
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
        
        app.post('/add_friend',(request,response,next)=>{ //SEND A REQUEST TO A USER TO BECOME FRIENDS
            
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
                        else { //add friend request in DB
                            db.collection("users").findOne({'username': new_friend}, function(err, res2) {
                            var req = res2.friends_requests;
                            if(req.includes(username)) { //check if a request has been already sent
                                response.json("You have already sent a request to " + new_friend);
                                console.log("You have already sent a request to " + new_friend); 
                                response.end();
                            }
                            else {
                            if(req.length === 0) req += username; //if the user has no requests, add the friend name
                            else req = req + "," + username; //if the user has one or more requests, add a "," and then the name
                            var newfriend = { $set: {'friends_requests': req } };
                            var my_query = { 'username': new_friend };
                            db.collection("users").updateOne(my_query, newfriend, function(err2, res2) { //update the list of friends requests
                                response.json("A request has been sent to " + new_friend);
                                console.log("A request has been sent to " + new_friend); //friendship requested!
                                response.end();
                                });
                                }
                            });
                        }
                    }
                        });
                    });
                });
        
        app.post('/accept_friend',(request,response,next)=>{ //ACCEPT A FRIEND REQUEST IN THE APP
            
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
                        else { //see if the friend's name is in the pending requests list
                            var req = res.friends_requests;
                            if(!req.includes(new_friend)) {
                                response.json("You don't have a request"); //if not, do not add
                                console.log("You don't have a request"); 
                                response.end();
                            }
                            else { 
                            var byefriend = req.replace(new_friend, ""); //delete friend's name
                            if(byefriend.startsWith(",")) byefriend = byefriend.replace(",", ""); //if it's the first one in the list, delete the ","
                            else if (byefriend.endsWith(",")) { //if it's the last one of the list, delete the ","
                                byefriend = byefriend.slice(0,byefriend.length-1);
                            }
                            else if(byefriend.includes(",,")) byefriend = byefriend.replace(",,", ","); //if it's in the middle, delete the "," remaining
                            var newfriend = { $set: {'friends_requests': byefriend } };
                            var my_query = { 'username': username };
                            db.collection("users").updateOne(my_query, newfriend, function(err2, res2) {}); //update the list of requests in the user
                            
                            if(friends.length === 0) friends += new_friend; //if the user has no friends, add the friend name
                            else friends = friends + "," + new_friend; //if the user has friends, add a "," and then the name
                            var newfriend2 = { $set: {'friends_id': friends } };
                            var my_query2 = { 'username': username };
                            db.collection("users").updateOne(my_query2, newfriend2, function(err2, res2) {}); //update the list of friends from the user
                            
                            db.collection("users").findOne({'username': new_friend},function(err, res3) { //now add username as a friend to new_friend
                                var friends2 = res3.friends_id;
                                if(friends2.includes(username)) {
                                    response.json(username + " and you are already friends!");
                                    console.log(username + " and you are already friends!"); 
                                    response.end();
                                }
                                else {
                                    if(friends2.length == 0) friends2 += username;
                                    else friends2 = friends2 + "," + username;
                                    var newfriend3 = { $set: {'friends_id': friends2 } };
                                    var my_query3 = { 'username': new_friend };
                                    db.collection("users").updateOne(my_query3, newfriend3, function(err2, res4) { //add friend completed!
                                        response.json(new_friend + " is now your friend!");
                                        console.log(new_friend + " is now your friend!"); //friend added!
                                        response.end();
                                    });
                                }
                            });
                                }
                            }
                        }
                        });
                    });
                });
                
                app.post('/decline_friend',(request,response,next)=>{ //DECLINE A FRIEND REQUEST
            
                    var post_data = request.body;

                    var new_friend = post_data.friend; //get the friend's username we want to decline
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
                            else { //the username to decline is found
                                var friends = res.friends_id; //get list of the user's friends
                                if(friends.includes(new_friend)) { //check if the friend is already in the user's list of friends
                                        response.json(new_friend + " and you are already friends!");
                                        console.log(new_friend + " and you are already friends!"); 
                                        response.end();
                                    }
                                else { //see if the friend's name is in the pending requests list
                                    var req = res.friends_requests;
                                    if(!req.includes(new_friend)) {
                                        response.json("You don't have a request"); //if not, do not decline
                                        console.log("You don't have a request"); 
                                        response.end();
                                    }
                                    else { 
                                    var byefriend = req.replace(new_friend, ""); //delete friend's name
                                    if(byefriend.startsWith(",")) byefriend = byefriend.replace(",", ""); //if it's the first one in the list, delete the ","
                                    else if (byefriend.endsWith(",")) { //if it's the last one of the list, delete the ","
                                        byefriend = byefriend.slice(0,byefriend.length-1);
                                    }
                                    else if(byefriend.includes(",,")) byefriend = byefriend.replace(",,", ","); //if it's in the middle, delete the "," remaining
                                    var newfriend = { $set: {'friends_requests': byefriend } };
                                    var my_query = { 'username': username };
                                    db.collection("users").updateOne(my_query, newfriend, function(err2, res2) {
                                        response.json("The request from " + new_friend + " has been declined"); //update the list of requests in the user to delete the name
                                        console.log("The request from " + new_friend + " has been declined"); 
                                        response.end();
                                    }); 
                                        }
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
    
        app.post('/list_friends', (request,response,next)=> {
            var post_data = request.body;
            
            var username = post_data.username; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            //connection to our collection and making a query to search the user
            db.collection("users").find({'username': username}, {projection: {_id: 0, friends_id: 1} }).toArray(function(err, res) {
                    if(res[0].friends_id == "") {
                        response.json("You have no friends. Don't worry, you can still practise some sport :)"); //if the username has no friends, it finishes
                        console.log("You have no friends. Don't worry, you can still practise some sport :)");
                        response.end();
                    }
                    else {
                        var friends = res[0].friends_id; //doing some splits to present it beautiful xd
                        var list = friends.split(",");
                        var listFriends = {
                            friends: list
                        };
                        response.json(listFriends); //list friends!
                        console.log(listFriends);
                        response.end();    
                        }

                });
        });
        
        app.post('/list_friend_requests', (request,response,next)=> {
            var post_data = request.body;
            
            var username = post_data.username; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            //connection to our collection and making a query to search the user
            db.collection("users").find({'username': username}, {projection: {_id: 0, friends_requests: 1} }).toArray(function(err, res) {
                    if(res[0].friends_requests == "") {
                        response.json("You have no friend requests right now. Try to search for new people :)"); //if the username has no friends, it finishes
                        console.log("You have no friend requests right now. Try to search for new people :)");
                        response.end();
                    }
                    else {
                        var friends_req = res[0].friends_requests; //doing some splits to present it beautiful xd
                        var list = friends_req.split(",");
                        var listFriendReq = {
                            friends_requests: list
                        };
                        response.json(listFriendReq); //list friend requests!
                        console.log(listFriendReq);
                        response.end();    
                        }

                });
        });
        
        
        
        //ACTIVITIES W/ ROUTES
        
        app.post('/add_activity',(request,response,next)=>{ //ADD A NEW ACTIVITY
            
            var post_data = request.body;
            
            var totaltime = post_data.totaltime; //get totaltime from client
            var avgspeed = post_data.avgspeed; //get avgspeed from client
            var kms = post_data.kms; //get kms from client
            var sport = post_data.sport; //get sport from client
            var kcal = post_data.kcal; //get kcal from client
            var username = post_data.username; //get user from client
            var date = post_data.date; //get date from client
            var finishhour = post_data.finishhour; //get finishhour from client
            var starthour = post_data.starthour; //get starthour from client
            
            
            var insertJson = { //JSON Object to instert into DB
                'username': username,
                'sport': sport,
                'totaltime': totaltime,
                'avgspeed': avgspeed,
                'kms': kms,
                'kcal': kcal,
                'date': date,
                'finishhour': finishhour,
                'starthour': starthour
            };
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            //connection to our collection and making a query to find if the username provided does not exists
            db.collection('users').find({'username': username}).count(function(err, number){ 
                if(number == 0)
                {
                    response.json('This username does not exist'); //if username does not exists, its not added into DB
                    console.log('This username does not exist');
                    response.end();
                }
                else //if username exists, insert JSON object into DB
                {
                    db.collection('activities').insertOne(insertJson,function(err,res){
                        response.json('Activity added!');
                        console.log('Activity added!');
                        response.end();
                        
                    });
                }
            });

        });
        
        
        app.post('/list_activity_by_date', (request,response,next)=> {
            var post_data = request.body;
            
            var sport = post_data.sport; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            var mysort = {date: -1};
            //connection to our collection and making a query to search the user
            db.collection("activities").find({'sport': sport}, {projection: {_id: 0, username: 0} }).sort(mysort).toArray(function(err, res) {
                    if(res.length == 0) {
                        response.json("You do not have any " + sport + " activities. Come on and give it a try!"); //if the username has no friends, it finishes
                        console.log("You do not have any " + sport + " activities. Come on and give it a try!");
                        response.end();
                    }
                    else {
                        response.json(res); //list friends!
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


 