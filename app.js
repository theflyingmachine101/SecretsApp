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
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
  password: String,
  googleId: String,
  secret: String
});

//plugins

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


//Strategies

var userModel = mongoose.model("users", userSchema);

passport.use(userModel.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  userModel.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    userModel.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return done(err, user);
    });
  }
));


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


app.get("/secrets", function(req, res) {
  userModel.find({
    "secret": {
      $ne: null
    }
  }, function(err, users) {
    if (!err)
      res.render("secrets", {
        allSecrets: users
      });
    else
      res.redirect("/login");
  });
});


app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});



app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  }));



app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/submit", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else
    res.redirect("/login");
});


//Post requests

app.post("/register", function(req, res) {
  userModel.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (!err) {
      passport.authenticate("local")(req, res, function() {
        res.redirect("secrets");
      });
    } else {
      res.redirect("/register");
      console.log(err);
    }
  });
});



app.post("/login", function(req, res) {
  const obj = new userModel({
    username: req.body.username,
    password: req.body.password
  });
  req.login(obj, function(err) {
    if (err)
      res.send("something went wrong");
    else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("secrets");
      });
    }
  });
});



app.post("/submit", function(req, res) {
  userModel.findById(req.user.id, function(err, users) {
    if (users) {
      users.secret = req.body.secret;
      users.save(function() {
        res.redirect("/secrets");
      });
    }
  });
});
