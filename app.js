//jshint esversion:6
//the commented coded means older level of authentication!
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const bcrypt = require('bcrypt');

// const md5 = require("md5");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();
//salting round number dont increase it too much, as time increases exponentially.
// const saltRounds = 10;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Dhoom Machale",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Einates have captured mongoose");
});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String,
  secret:String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields: ["password"]});


const User = new mongoose.model("User", userSchema);


passport.use(User.createStrategy()); //create a local login strategy
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(User, done) {
  done(null, User);
});

passport.deserializeUser(function(User, done) {
  done(null, User);
});





passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));




app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});



app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));
//above line means we only want profile info.

  app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
      //we are authenticating user by google Strategy

    });

app.get("/secrets", function(req, res) {
  // if (req.isAuthenticated()) {
  //   res.render("secrets");
  // } else {
  //   res.redirect("/login");
  // }
  //checking whether secret field is not null or null
  User.find({secret:{$ne:null}},function(err,userFound){
    if(err){console.log(err);}
    else{
      if(userFound){
        res.render("secrets",{userWithSecrets:userFound});
      }
    }

  });
});


app.post("/register", function(req, res) {

  //we will be using passport-local-mongoose for this functionality
  //register method comes from passport-local mongoose
  //this saves us from creating new User, savig it to mongodb and so on
  User.register({
    username: req.body.username   //here you have to write username, not email as in schema
  }, req.body.password, function(err, user) {

    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }




  })
  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //     // Store hash in your password DB.
  //     const newUser = new User({
  //       email:req.body.username,
  //       password:hash
  //     });
  //     newUser.save(function(err){
  //       if(!err){
  //         res.render("secrets");
  //       } else {console.log(err);}
  //     });
  // });

});


app.post("/login", function(req, res) {


const newUser = new User({
  username:req.body.username,
  password:req.body.password
});

req.login(newUser,function(err){
  if(err){console.log(err)}
  else{
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    });
  }
});



  // User.findOne({email:req.body.username},function(err,userFound){
  //   if(!err){
  //     if(userFound){
  //       bcrypt.compare(req.body.password, userFound.password, function(err, result) {
  //   // result == true
  //   if(!err){
  //     if(result){res.render("secrets");}else{res.send("Incorrect password");}
  //   }
  //         });
  //     }else{res.send("User not found");}
  //   }else{res.send(err);}
  // })
});


app.get("/submit",function(req,res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});


app.post("/submit",function(req,res){

//req.user will give you the information about current user whose session is going on

  console.log(req.user._id);
  User.updateOne({_id:req.user._id},{secret:req.body.secret},function(err){
    if(!err){
console.log("Update done");
      res.redirect("/secrets");}
  });

});



app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.listen(3000, function() {
  console.log("Einates at your service master!");
})
