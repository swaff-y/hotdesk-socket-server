//middleware function to get subscriber
const User = require("../models/users");

const ctx = {}

ctx.byId = async function (req, res, next){
  let user;
  try{
    user = await User.findById(req.params.id);
    if(user === null){
      //404 status means you could not find something
      return res.status(404).json({ message: "Could not find user with id " + req.params.id})
    }
  } catch(err) {
    return res.status(500).json({ message: err.message });
  }

  //set response to be equal to subscriber
  res.user = user;
  // call next to move onto the next piece of middleware or on to the actual request itself
  next();
}

// ctx.byEmail = async function (req, res, next){
//   let user;
//   try{
//     user = await User.findOne({email:req.body.email});
//     if(user === null){
//       //404 status means you could not find something
//       return res.status(404).json({ message: "Could not find user with email " + req.body.email})
//     }
//   } catch(err) {
//     return res.status(500).json({ message: err.message });
//   }
//
//   //set response to be equal to subscriber
//   res.user = user;
//   // call next to move onto the next piece of middleware or on to the actual request itself
//   next();
// }

module.exports = ctx;
