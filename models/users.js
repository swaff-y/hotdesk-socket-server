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
