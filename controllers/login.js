const express = require('express');
const router = express.Router();
const Login = require("../models/login");
const jwt = require("./jwt");

//curl -X POST -H "Content-Type: application/json" -d '{"email":"kyle@swaff.id.au", "password":"xxx"}' http://localhost:3002/login/
router.post('/', async (req,res)=>{
  //Authenticate user
  const user = await Login.find(req.body.email, req.body.password)

  //take payload and seralize
  if(user)
    res.json({ accessToken: jwt.generateToken(user) });
  else
    res.status(404).json({ message: "User not found"})
})

module.exports = router
