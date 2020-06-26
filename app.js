//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Einates have captured mongoose");
});

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

const secret = "Hello darkness";
userSchema.plugin(encrypt,{secret:secret, encryptedFields: ["password"]});


const User = new mongoose.model("User",userSchema);


app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});


app.post("/register",function(req,res){

    const newUser = new User({
      email:req.body.username,
      password:req.body.password
    });

    newUser.save(function(err){
      if(!err){
        res.render("secrets");
      } else {console.log(err);}
    });

})


app.post("/login",function(req,res){
  User.findOne({email:req.body.username},function(err,userFound){
    if(!err){
      if(userFound){
        if(userFound.password===req.body.password){
          res.render("secrets");
        }else{res.send("Incorrect Password");}
      }else{res.send("User not found");}
    }else{res.send(err);}
  })
})






app.listen(3000,function(){
  console.log("Einates at your service master!");
})
