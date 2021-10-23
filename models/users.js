//need to require mongoose
//allow us to interact with the database
const mongoose = require('mongoose');

//we will need a schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  }
})

//this model allows us to interact with the database
module.exports = mongoose.model('User', userSchema);

// const Users = function(){
//   const data = require("../data");
//   const ctx = {};
//
//   ctx.all = data;
//   ctx.find = function(id){
//     return [{theId: id}];
//   }
//
//   ctx.new = function(user){
//     console.log(user);
//
//     let flag = 0;
//     for(let i = 0; i < data.length; i++){
//       const record = data[i];
//
//       if(user.email === record.email) flag++;
//     }
//
//     if(flag == 0){
//       data.push(user);
//       return user
//     }
//
//     return false;
//   }
//
//   return ctx;
// }
//
// module.exports = Users()
