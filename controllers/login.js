const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require("../models/users");
const jwt = require("./jwt");
const getUser = require("./getUser");
const logger = require("./../logger").Logger;

//curl -X POST -H "Content-Type: application/json" -d '{"email":"kyle@swaff.id.au", "password":"xxx"}' http://localhost:3002/login/
router.post('/', async (req,res)=>{
  //Authenticate user
  const user = await User.findOne({ email: req.body.email });
  console.log("User Request on http://localhost:3002/login/");

  //take payload and seralize
  if(user)
    if( await bcrypt.compare(req.body.password, user.password) ) {

      logger.info("User Login - Success",
      {
        contextCode: "Suc-user001",
        query: req?.query,
        result: user
      });

      res.json({ accessToken: jwt.generateToken(user), user: user.id });
    }else{
      throw new Error("Unsuccessful request: Passwords do not match")
    }
  else {
    logger.error("Unsuccessful request:", err,
    {
      contextCode: "Err-login001",
      query: req?.query
    });
    res.status(404).json({ message: "Unsuccessful request:" + err})
  }
})

module.exports = router
