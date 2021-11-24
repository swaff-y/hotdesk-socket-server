//need to require mongoose
//allow us to interact with the database
const mongoose = require('mongoose');

//we will need a schema
const phoneSchema = new mongoose.Schema({
  dnid: {
    type: Number,
    required: true,
    unique: true
  },
  firstName:{
    type: String,
    required: false
  },
  lastName:{
    type: String,
    required: false
  }
})

//this model allows us to interact with the database
module.exports = mongoose.model('Phone', phoneSchema);
