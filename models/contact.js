//need to require mongoose
//allow us to interact with the database
const mongoose = require('mongoose');

//we will need a schema
const contactSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId
  },
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
  },
  email:{
    type: String,
    required: false
  },
  company:{
    type: String,
    required: false
  }
})

//this model allows us to interact with the database
module.exports = mongoose.model('Contact', contactSchema);
