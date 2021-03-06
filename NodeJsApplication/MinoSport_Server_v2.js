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
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var path = require('path');
var xoauth2 = require('xoauth2');
var firebase = require('firebase-admin');

//FIREBASE LOGIN AND AUTHORIZATION
var serviceAccount = require("./minosport-936f0-firebase-adminsdk-2vq7d-e5e5f6bd1c.json");

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://minosport-936f0.firebaseio.com/"
});

var firebasedb = firebase.database();
var ref = firebasedb.ref("server");

//SERVER INITIALIZATION
var app = express();

//FORGOT PASSWORD LOGIN PARAMETERS
var auth = {
    type: 'oauth2',
    user: 'minosport.resetpass@gmail.com',
    clientId: '699701933302-h68q6lepajmdvvkm91qng6ldviikn5dl.apps.googleusercontent.com',
    clientSecret: 'tWjhPNWLil_6u7OVyYxmFP7K',
    refreshToken: '1/NwnEEEhxupYytVfhfgcSz_CGJKUh-Ql4T816NhTbvuY',
    accessToken: 'ya29.Glv1BmZjHKrWrFVX35O5cuMJds6iiagH-udvoJdcpqUnCFhBhYQF_iefARu8Use62RAA0T9vtgKEKkSfIdcO6EHi7WwSj1NXJVe8S__BPy5-c69rgyucihipFJdn'
};

//SERVER PARAMETERS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//MONGO DB URL TO CONNECT
var url = 'mongodb://localhost:27017';

MongoClient.connect(url,{useNewUrlParser: true}, function(err,client){
    if(err)
        console.log('Unable to connect. Error', err);
    else {
        
        // "/", it only says MinoSport
        app.get('/', (request,response,next)=>{
            response.json("MinoSport");
            console.log("MinoSport");
            response.end();
        });
        
        app.post('/register',(request,response,next)=>{ //REGISTER AN USER
            
            var post_data = request.body;
            
            var password = post_data.password; //get password from client
            var password2 = post_data.password2; //get password2 from client
            var email = post_data.email; //get password from client
            var username = post_data.username; //get user from client
            
            if(password !== password2) {
                response.json('The passwords introduced do not match'); //if username already exists, its not added into DB
                console.log('The passwords introduced do not match');
            }
            else {
            var insertJson = { //JSON Object to instert into DB
                'username': username,
                'email': email,
                'password': password,
                'friends_id': [], //friends field (to be filled in later)
                'friends_requests': [],
                'resetPasswordToken': "",
                'resetPasswordExpires': ""
            };
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            //connection to our collection and making a query to find if the username provided already exists
            db.collection('users').find({'username': username}).count(function(err, number){ 
                if(number !== 0)
                {
                    response.json("This username does already exist"); //if username already exists, its not added into DB
                    console.log("This username does already exist");
                    response.end();
                }
                else //if username doesn't exist, insert JSON object into DB
                {
                    db.collection('users').find({'email': email}).count(function(err, number2){
                        if(number2 !== 0) {
                            response.json("This email is already registered. Please try another one"); //if username already exists, its not added into DB
                            console.log("This email is already registered. Please try another one");
                            response.end();
                        }
                    else {
                    db.collection('users').insertOne(insertJson,function(err,res){
                        response.json("Registration complete!");
                        console.log("Registration complete!");
                        response.end();
                        
                    });
                    //firebase db user addition
                    var usersRef = ref.child("users");
                    usersRef.push().set({
                        username: username,
                        friends_id: ""
                    });
                    }
                    });
                }
            });
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
                if(number === 0)
                {
                    response.json("This username does not exist"); //if the username doesn't exist, the login is not successful
                    console.log("This username does not exist");
                    response.end();
                }
                else //if username exists, we make a query to get the username's password
                {
                    db.collection('users').findOne({'username': username},function(err,user){
                        
                        var user_password = user.password;
                        if(user_password === password) { 
                           response.json("Login successful!"); //if the password introduced is the same, the login in successful
                           console.log("Login successful!"); 
                           response.end();
                        }
                        else { //if the password is incorrect, the login is incorrect
                            response.json("Login incorrect! Please, try again");
                           console.log("Login incorrect! Please, try again"); 
                           response.end();
                        }
                        
                    });
                }
            });
        });
        
            app.post('/forgot_password', function(request, response, next) {
                        var post_data = request.body;
                        var em = post_data.email;
                        var db = client.db('first_attempt'); //connection to MongoDB database
                        var token = crypto.randomBytes(64).toString('hex');  
                        db.collection('users').findOne({ email: em }, function(err, user) {
                                if (!user) {
                                  response.json("This mail doesn't exist");
                                    console.log("This mail doesn't exist"); 
                                   response.end();
                                }
                                else {
                                var resetToken = token;
                                var resetPassExpires = Date.now() + 3600000; // 1 hour
                                var new_field1 = { $set: {'resetPasswordToken': resetToken } };
                                var new_field2 = { $set: {'resetPasswordExpires': resetPassExpires } };
                                var my_query = { 'username': user.username };
                                db.collection("users").updateOne(my_query, new_field1, function(err2, res2) {
                                });
                                db.collection("users").updateOne(my_query, new_field2, function(err2, res2) {
                                });
                                
                              var transporter = nodemailer.createTransport({
                                host: 'smtp.gmail.com',
                                port: 465,
                                secure: true,
                                auth: auth
                            });
                              var mailOptions = {
                                to: em,
                                from: 'minosportresetpass@gmail.com',
                                subject: 'MinoSport: Password Reset',
                                text: 'You are receiving this because you have requested the reset of the password for your MinoSport account.\n\n' +
                                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                                  'http://localhost:8080/reset/' + token + '\n\n' +
                                  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                              };
                              transporter.sendMail(mailOptions, (err, res) => {
                                if (err) {
                                    return console.log(err);
                                } else {
                                    response.json("An e-mail has been sent to " + em + " with further instructions");
                                     console.log("An e-mail has been sent to " + em + " with further instructions");
                                }
                            });
                                }
                              });
                            
                       
                        });
                        
         app.get('/reset/:token', function(request, response) {
                       
                 var db = client.db('first_attempt'); //connection to MongoDB database
                db.collection("users").findOne({ resetPasswordToken: request.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                  if (!user) {
                      response.json("Password reset token is invalid or has expired.");
                      console.log("Password reset token is invalid or has expired."); 
                      response.end();
                  }
                  else {
                      response.render("reset_password", {username: user.username});
                  }
                });
              });
              
              app.post('/reset_password', function(request, response) {
                        var post_data = request.body;
                        var username = post_data.username;
                        var db = client.db('first_attempt'); //connection to MongoDB database
                  
                            db.collection("users").findOne({username: username}, function(err,user) {
                            db.collection("users").findOne({ resetPasswordToken: user.resetPasswordToken, resetPasswordExpires: { $gt: Date.now() } }, function(err, user2) {
                              if (!user2) {
                                   response.json("Password reset token is invalid or has expired");
                                  console.log("Password reset token is invalid or has expired");
                              }
                              else {
                              var password1 = post_data.password1;
                              var password2 = post_data.password2;
                              if(password1 !== password2){
                                  response.writeHeader(200, {"Content-Type": "text/html"});
                                  response.write("The introduced passwords don't match. Retry it " + "<html><body><a href='http://localhost:8080/reset_password'>here</a></body></html>");
                                  console.log("The introduced passwords don't match");
                                  response.end();
                                  
                              }
                              else {
                              var resetToken = "";
                              var resetPassExpires = "";

                              var new_field1 = { $set: {'resetPasswordToken': resetToken } };
                              var new_field2 = { $set: {'resetPasswordExpires': resetPassExpires } };
                              var new_field3 = { $set: {'password': password1 } };
                              var my_query = { 'username': user2.username };
                              db.collection("users").updateOne(my_query, new_field1, function(err2, res2) {
                              });
                              db.collection("users").updateOne(my_query, new_field2, function(err2, res2) {
                              });
                              db.collection("users").updateOne(my_query, new_field3, function(err2, res2) {
                              });
                          
                            
                            var smtpTransport = nodemailer.createTransport({
                              host: 'smtp.gmail.com',
                              port: 465,
                              secure: true,
                              auth: auth
                              
                            });
                            var mailOptions = {
                              to: user.email,
                              from: 'minosportresetpass@gmail.com',
                              subject: 'Your password has been changed',
                              text: 'Hello,\n\n' +
                                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                            };
                            smtpTransport.sendMail(mailOptions, function(err) {
                                if(err) {
                                      response.json("An error has ocurred");
                                      console.log("An error has ocurred");
                                      response.end();
                                  }
                                  else {
                                      response.json("Success! Your password has been changed.");
                                      console.log("Success! Your password has been changed.");
                                      response.end();
                                    }
                            });
                            }
                              }
                            });
                            });
                          

                      });
                      
        app.post('/change_password',(request,response,next)=>{ //CHANGE A USER'S PASSWORD 
            
            var post_data = request.body;

            var passwordnew = post_data.passwordnew; //get password from client
            var passwordnew2 = post_data.passwordnew2; //get username from client
            var oldpassword = post_data.oldpassword; //get username from client
            var username = post_data.username; //get username from client
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            //
            //connection to our collection and making a query to find if the username provided is registered in the DB
            db.collection('users').find({'username': username}).count(function(err, number){
                if(number === 0)
                {
                    response.json("This username does not exist"); //if the username doesn't exist, the change is not successful
                    console.log("This username does not exist");
                    response.end();
                }
                else //if username exists, we make a query to get the username's password
                {
                    db.collection('users').findOne({'username': username},function(err,user){
                        
                        var user_password = user.password;
                        if(user_password !== oldpassword) { 
                           response.json("The old password introduced is incorrect"); //if the old password introduced is different, the change is not successful
                           console.log("The old password introduced is incorrect"); 
                           response.end();
                        }
                        else { //if the old password are the same, check if the two new password are equal
                           if(passwordnew !== passwordnew2) { 
                           response.json("The passwords introduced do not match");
                           console.log("The passwords introduced do not match"); 
                           response.end();
                            }
                            else { //the passwords are equal
                                var newfriend = { $set: {'password': passwordnew } };
                                var my_query = { 'username': username };
                                db.collection("users").updateOne(my_query, newfriend, function(err2, res2) {
                                    response.json("Password changed successfully!");
                                    console.log("Password changed successfully!"); 
                                    response.end();
                                }); //update the new password in the user
                                
                            }
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
                    if(number === 0) {
                        response.json("This username does not exist"); //if the username is not found, it finishes
                        console.log("This username does not exist");
                        response.end();
                    }
                    else { //the username to add is found
                        var friends = res.friends_id; //get list of the user's friends
                        var requ = res.friends_requests; //get list of the user's friend requests
                        if(friends.includes(new_friend)) { //check if the friend is already in the user's list of friends
                                response.json(new_friend + " and you are already friends!");
                                console.log(new_friend + " and you are already friends!"); 
                                response.end();
                            }
                        else { 
                            if(requ.includes(new_friend)) { //check if the friend is already in the user's list of requests
                                response.json(new_friend + " has already sent you a friend invite. Go check your pending inbox!");
                                console.log(new_friend + " has already sent you a friend invite. Go check your pending inbox!"); 
                                response.end();
                            }
                        else { //add friend request in DB
                            db.collection("users").findOne({'username': new_friend}, function(err, res2) {
                            var req = res2.friends_requests;
                            var fri = res2.friends_id;
                            if(req.includes(username)) { //check if a request has been already sent
                                response.json("You have already sent a request to " + new_friend);
                                console.log("You have already sent a request to " + new_friend); 
                                response.end();
                            }
                            else {
                                if(fri.includes(username)) { //check if a username is already a new_friend's friend
                                response.json(new_friend + " and you are already friends!");
                                console.log(new_friend + " and you are already friends!"); 
                                response.end();
                            }
                            else {
                            req.push(username); //add friend request
                            var newfriend = { $set: {'friends_requests': req } };
                            var my_query = { 'username': new_friend };
                            db.collection("users").updateOne(my_query, newfriend, function(err2, res2) { //update the list of friends requests
                                response.json("A request has been sent to " + new_friend);
                                console.log("A request has been sent to " + new_friend); //friendship requested!
                                response.end();
                                });
                                }
                            }
                            });
                        }
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
                    if(number === 0) {
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
                            req.pop(new_friend);
                            var newfriend = { $set: {'friends_requests': req } };
                            var my_query = { 'username': username };
                            db.collection("users").updateOne(my_query, newfriend, function(err2, res2) {}); //update the list of requests in the user
                            friends.push(new_friend);
                            var newfriend2 = { $set: {'friends_id': friends } };
                            var my_query2 = { 'username': username };
                            db.collection("users").updateOne(my_query2, newfriend2, function(err2, res2) {}); //update the list of friends from the user
                            
                            //firebase db friend addition
                            var b = 0;
                            ref.child("users").once('value', function(snapshot) {
                                var list = snapshot.val();
                                var keys = Object.keys(list);
                                var user_name;
                                for (var i = 0; i < keys.length && b === 0; i++) {
                                    var k = keys[i];
                                    user_name = list[k].username;
                                    if(user_name === username) b = 1;
                                }
                                var u = ref.child("users").child(keys[i-1]);
                                u.update({
                                    "friends_id": friends
                                });
                            });
                            
                            db.collection("users").findOne({'username': new_friend},function(err, res3) { //now add username as a friend to new_friend
                                var friends2 = res3.friends_id;
                                if(friends2.includes(username)) {
                                    response.json(username + " and you are already friends!");
                                    console.log(username + " and you are already friends!"); 
                                    response.end();
                                }
                                else {
                                    friends2.push(username);
                                    var newfriend3 = { $set: {'friends_id': friends2 } };
                                    var my_query3 = { 'username': new_friend };
                                    db.collection("users").updateOne(my_query3, newfriend3, function(err2, res4) { //add friend completed!
                                        response.json(new_friend + " is now your friend!");
                                        console.log(new_friend + " is now your friend!"); //friend added!
                                        response.end();
                                    });
                                    
                                    //firebase db friend addition
                                    b = 0;
                                    ref.child("users").once('value', function(snapshot) {
                                        var list = snapshot.val();
                                        var keys = Object.keys(list);
                                        var user_name;
                                        for (var i = 0; i < keys.length && b === 0; i++) {
                                            var k = keys[i];
                                            user_name = list[k].username;
                                            if(user_name === new_friend) b = 1;
                                        }
                                        var u = ref.child("users").child(keys[i-1]);
                                        u.update({
                                            "friends_id": friends2
                                        });
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
                            if(number === 0) {
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
                                    req.pop(new_friend);
                                    var newfriend = { $set: {'friends_requests': req } };
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
                     
                     
             app.post('/delete_friend',(request,response,next)=>{ //DELETE A EXISITING FRIEND
            
                    var post_data = request.body;

                    var new_friend = post_data.friend; //get the friend's username we want to delete
                    var username = post_data.username; //get the user's username 

                    var db = client.db('first_attempt'); //connection to MongoDB database

                    //connection to our collection and making a query to get the user's object(to get its friends list)       
                    db.collection("users").findOne({'username': username},function(err, res) {
                        //connection to our collection and making a query to find if the friend's username provided exists
                        db.collection("users").find({'username': new_friend}).count(function(err, number) {
                            if(number === 0) {
                                response.json("This username does not exist"); //if the username is not found, it finishes
                                console.log("This username does not exist");
                                response.end();
                            }
                            else { //the username to delete is found
                                var friends = res.friends_id; //get list of the user's friends
                                if(!friends.includes(new_friend)) { //check if the friend is not in the user's list of friends
                                        response.json(new_friend + " is not your friend!");
                                        console.log(new_friend + " is not your friend!"); 
                                        response.end();
                                    }
                                else { //check if the username is in the friend's list of friends
                                    db.collection("users").findOne({'username': new_friend},function(err, res2) {
                                    var fri2 = res2.friends_id;
                                    if(!fri2.includes(username)) {
                                        response.json(new_friend + " is not your friend!"); 
                                        console.log(new_friend + " is not your friend!"); 
                                        response.end();
                                    }
                                    else { //if the 2 users are friends, delete both of them
                                    friends.pop(new_friend);
                                    fri2.pop(username);
                                    var newfriend = { $set: {'friends_id': friends } };
                                    var my_query = { 'username': username };
                                    db.collection("users").updateOne(my_query, newfriend, function(err2, res2) {}); //update friends list from username
                                    
                                    //firebase db friend deletion
                                    var b = 0;
                                    ref.child("users").once('value', function(snapshot) {
                                        var list = snapshot.val();
                                        var keys = Object.keys(list);
                                        var user_name;
                                        console.log(keys);
                                        for (var i = 0; i < keys.length && b === 0; i++) {
                                            var k = keys[i];
                                            console.log(list[k]);
                                            user_name = list[k].username;
                                            console.log(user_name, username);
                                            if(user_name === username) b = 1;
                                        }
                                        var u = ref.child("users").child(keys[i-1]);
                                        u.update({
                                            "friends_id": friends
                                        });
                                    });
                                                                                                            
                                    var newfriend2 = { $set: {'friends_id': fri2 } };
                                    var my_query2 = { 'username': new_friend };
                                    db.collection("users").updateOne(my_query2, newfriend2, function(err2, res2) {
                                            response.json(new_friend + " is no longer your friend"); //update friends list from new_friend
                                            console.log(new_friend + " is no longer your friend"); 
                                            response.end();
                                    });
                                    
                                    //firebase db friend deletion
                                    b = 0;
                                    ref.child("users").once('value', function(snapshot) {
                                        var list = snapshot.val();
                                        var keys = Object.keys(list);
                                        var user_name;
                                        console.log(keys);
                                        for (var i = 0; i < keys.length && b === 0; i++) {
                                            var k = keys[i];
                                            console.log(list[k]);
                                            user_name = list[k].username;
                                            console.log(user_name, new_friend);
                                            if(user_name === new_friend) b = 1;
                                        }
                                        console.log(user_name);
                                        var u = ref.child("users").child(keys[i-1]);
                                        u.update({
                                            "friends_id": fri2
                                        });
                                    });
                                        }
                                    });
                                    }
                                
                                }
                            });
                            });
                     });        
        
        app.get('/search_user',(request,response,next)=>{ //SEARCH A USER IN THE DB
            
            var post_data = request.query;
            
            var friend = post_data.username; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            //connection to our collection and making a query to search the user
            db.collection("users").find({'username': {'$regex': friend}}, {projection: {_id: 0, username: 1} }).toArray(function(err, res) {
                    if(res.length === 0) {
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
    
        app.get('/list_friends', (request,response,next)=> { //LIST THE FRIENDS OF A GIVEN USER
            var post_data = request.query;
            
            var username = post_data.username; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            //connection to our collection and making a query to search the user
            db.collection("users").find({'username': username}, {projection: {_id: 0, friends_id: 1} }).toArray(function(err, res) {
                    if(res[0].friends_id.length === 0) {
                        response.json("You have no friends. Don't worry, you can still practise some sport :)"); //if the username has no friends, it finishes
                        console.log("You have no friends. Don't worry, you can still practise some sport :)");
                        response.end();
                    }
                    else {
                        var friends = res[0].friends_id; //get friends array
                        response.json(friends); //list friends!
                        console.log(friends);
                        response.end();    
                        }

                });
        });
        
        app.get('/list_friend_requests', (request,response,next)=> { //LIST THE FRIEND REQUESTS OF A GIVEN USER
            var post_data = request.query;
            
            var username = post_data.username; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            //connection to our collection and making a query to search the user
            db.collection("users").find({'username': username}, {projection: {_id: 0, friends_requests: 1} }).toArray(function(err, res) {
                    if(res[0].friends_requests.length === 0) {
                        response.json("You have no friend requests right now. Try to search for new people :)"); //if the username has no friends, it finishes
                        console.log("You have no friend requests right now. Try to search for new people :)");
                        response.end();
                    }
                    else {
                        var friends_req = res[0].friends_requests; //get friend requests array
                        response.json(friends_req); //list friend requests!
                        console.log(friends_req);
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
                if(number === 0)
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
        
        
        app.post('/list_activity_by_date', (request,response,next)=> { //FILTER ALL THE ACTIVITIES FROM A USER BY DATE (THE NEWER THE FIRST)
            var post_data = request.body;
            
            var sport = post_data.sport; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            var mysort = {date: -1};
            //connection to our collection and making a query to search the user
            db.collection("activities").find({'sport': sport}, {projection: {_id: 0, username: 0} }).sort(mysort).toArray(function(err, res) {
                    if(res.length === 0) {
                        response.json("You do not have any " + sport + " activities. Come on and give it a try!"); //if the username has no activities, it finishes
                        console.log("You do not have any " + sport + " activities. Come on and give it a try!");
                        response.end();
                    }
                    else {
                        response.json(res); //list activities!
                        console.log(res);
                        response.end();    
                        }

                });
        });
        
        app.post('/list_activity_by_time', (request,response,next)=> { //FILTER ALL THE ACTIVITIES FROM A USER BY TIME (THE LONGER THE FIRST)
            var post_data = request.body;
            
            var sport = post_data.sport; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            var mysort = {totaltime: -1};
            //connection to our collection and making a query to search the user
            db.collection("activities").find({'sport': sport}, {projection: {_id: 0, username: 0} }).sort(mysort).toArray(function(err, res) {
                    if(res.length === 0) {
                        response.json("You do not have any " + sport + " activities. Come on and give it a try!"); //if the username has no activities, it finishes
                        console.log("You do not have any " + sport + " activities. Come on and give it a try!");
                        response.end();
                    }
                    else {
                        response.json(res); //list activities!
                        console.log(res);
                        response.end();    
                        }

                });
        });
        
        app.post('/list_activity_by_kcal', (request,response,next)=> { //FILTER ALL THE ACTIVITIES FROM A USER BY KCAL (THE GREATER THE FIRST)
            var post_data = request.body;
            
            var sport = post_data.sport; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            var mysort = {kcal: -1};
            //connection to our collection and making a query to search the user
            db.collection("activities").find({'sport': sport}, {projection: {_id: 0, username: 0} }).sort(mysort).toArray(function(err, res) {
                    if(res.length === 0) {
                        response.json("You do not have any " + sport + " activities. Come on and give it a try!"); //if the username has no activities, it finishes
                        console.log("You do not have any " + sport + " activities. Come on and give it a try!");
                        response.end();
                    }
                    else {
                        response.json(res); //list activities!
                        console.log(res);
                        response.end();    
                        }

                });
        });
        
        app.post('/list_activity_by_kms', (request,response,next)=> { //FILTER ALL THE ACTIVITIES FROM A USER BY KMS (THE GREATER THE FIRST)
            var post_data = request.body;
            
            var sport = post_data.sport; //get the friend's username we want to search
            
            var db = client.db('first_attempt'); //connection to MongoDB database
            
            var mysort = {kms: -1};
            //connection to our collection and making a query to search the user
            db.collection("activities").find({'sport': sport}, {projection: {_id: 0, username: 0} }).sort(mysort).toArray(function(err, res) {
                    if(res.length === 0) {
                        response.json("You do not have any " + sport + " activities. Come on and give it a try!"); //if the username has no activities, it finishes
                        console.log("You do not have any " + sport + " activities. Come on and give it a try!");
                        response.end();
                    }
                    else {
                        response.json(res); //list activities!
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


 

