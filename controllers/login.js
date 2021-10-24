const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require("../models/users");
const jwt = require("./jwt");
const getUser = require("./getUser");

//curl -X POST -H "Content-Type: application/json" -d '{"email":"kyle@swaff.id.au", "password":"xxx"}' http://localhost:3002/login/
router.post('/', async (req,res)=>{
  //Authenticate user
  const user = await User.findOne({ email: req.body.email });
  console.log("User Request on http://localhost:3002/login/");

  //take payload and seralize
  if(user)
    if( await bcrypt.compare(req.body.password, user.password) ) {
      console.log("Successful request: [token sent]");
      res.json({ accessToken: jwt.generateToken(user) });
    }else{
      console.error("Unsuccessful request: Passwords do not match");
      res.status(401).json({ message: "Passwords do not match"})
    }
  else {
    console.error("Unsuccessful request: User not found");
    res.status(404).json({ message: "User not found"})
  }
})

module.exports = router
