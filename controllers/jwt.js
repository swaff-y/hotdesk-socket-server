const jwt = require("jsonwebtoken");

const ctx = {};

ctx.authenticateToken = function(req, res, next) {

  const authHeader = req?.headers?.authorization;
  let token = authHeader?.split(" ")?.[1] || "";
  if(!token){
    //Unauthorised
    return res.status(401).json([{message: "No token sent"}]);;
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    //Token invalid
    if(err){
      res.status(403).json([{message: err}]);
      return;
    }
    next();
  });
}

ctx.generateToken = function(user){
  return jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, { "expiresIn":"1 day"});
  // return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
}

module.exports = ctx;
