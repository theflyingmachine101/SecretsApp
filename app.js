//jshint esversion:6

//requirements
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
var request = require("request");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');

//salting
const bcrypt = require('bcrypt');
const saltRounds = 10;


//Listening Port
app.listen("3000", function() {
  console.log(" Server started on port 3000");
});


//connection
mongoose.connect("mongodb://127.0.0.1:27017/UsersDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});


//Schema
var userSchema = new mongoose.Schema({
  email: String,
  password: String
});
var userModel = mongoose.model("users", userSchema);




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

//Post requests

app.post("/register", function(req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    if (!err) {
      var obj = new userModel({
        email: req.body.username,
        password: hash
      });
      obj.save(function(err) {
        if (!err)
          res.render("secrets");
        else
          res.send("uh oh!Something went wrong");
      });
    } else
      res.send("Ohh oh! Something Went wrong.");
  });
});



app.post("/login", function(req, res) {
  userModel.findOne({
    email: req.body.username
  }, function(err, user) {

    bcrypt.compare(req.body.password, user.password, function(err, result) {
      if (result)
        res.render("secrets");
      else
        res.send("uh oh!Something went wrong");
    });
  });
});
