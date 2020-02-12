//jshint esversion:6

//requirements
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
var request = require("request");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');



//Listening Port
app.listen("3000", function() {
  console.log(" Server started on port 3000");
});

//Encryption,Hashing,Salting and Authentication
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//connection
mongoose.connect("mongodb://127.0.0.1:27017/UsersDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});


//Schema
var userSchema = new mongoose.Schema({
  username: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

var userModel = mongoose.model("users", userSchema);

passport.use(userModel.createStrategy());

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());
//Get requests
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }
  else
  res.send("something went Wrong");
});


app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});
//Post requests

app.post("/register", function(req, res) {
  userModel.register({username:req.body.username},req.body.password,function(err,user){
    if (!err)
      {
        passport.authenticate("local")(req,res,function(){
          res.redirect("secrets");
        });
      }
    else
    {
      res.redirect("/register");
      console.log(err);
    }
  });
});



app.post("/login", function(req, res) {
    const obj= new userModel({username:req.body.username,password:req.body.password});
    req.login(obj,function(err){
      if(err)
      res.send("something went wrong");
      else
      {
        passport.authenticate("local")(req,res,function(){
          res.redirect("secrets");
        });
      }
    });
});
