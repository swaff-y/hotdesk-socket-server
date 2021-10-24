const express = require('express');
const router = express.Router();
const User = require("../models/users");
const jwt = require("./jwt");
const getUser = require("./getUser");
const bcrypt = require("bcrypt");

//get all users
//curl -X GET -H 'authorization: Bearer xxx' http://localhost:3002/users
router.get("/", jwt.authenticateToken, async (req,res) => {
  console.log("User Request on GET http://localhost:3002/users/");
  try{
    const users = await User.find();
    console.log("Successful request: ", users);
    res.status(200).json(users);
  } catch (err) {
    console.error("Unsuccessful request: ", err);
    res.status(500).json({ message: err.message });
  }
});

//Get One
//curl -X GET -H 'authorization: Bearer xxx' http://localhost:3002/users/xxx
//The "getSubscriber" middleware will get the subscriber with the id
router.get("/:id", jwt.authenticateToken, getUser.byId, (req,res) => {
  console.log("User Request on GET http://localhost:3002/users/xxx");
  try {
    console.log("Successful request: ", res.user);
    res.status(200).json(res.user);
  } catch(err) {
    console.error("Unsuccessful request: ", err);
    res.status(500).json({ message: err});
  }
});


//Create a user
//curl -X POST -H "Content-Type: application/json" -d '{"email":"kyle@swaff.id.au", "password":"xxx"}' http://localhost:3002/users/ | jq
router.post("/", async (req, res) => {
  console.log("User Request on POST http://localhost:3002/users/");
  try{
    //const salt = await bcrypt.genSalt();
    //add 10 by salt to auto generate salt
    //const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = { email: req.body.email, password: hashedPassword };
    if(Users.new(user))
    {
      console.log("Successful request: ", user);
      res.status(201).json(user);
    }else{
      console.error("Unsuccessful request: ", err);
      res.status(401).json({ message: "User already exists"});
    }
  } catch (err) {
    console.error("Unsuccessful request: ", err);
    res.status(500).json({ message: err});
  }
});

module.exports = router
