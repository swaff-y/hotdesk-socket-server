//need to require mongoose
//allow us to interact with the database
const mongoose = require('mongoose');
const User = require("../models/users");
const Contact = require("../models/contact");

const interactionSchema = new mongoose.Schema({
  callSid: {
    type: String,
    required: true,
    unique: true
  },
  direction:{
    type: String,
    required: true
  },
  owner: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    email: String,
    dn: String,
    routeNumber: String
  },
  // owner:{
  //   type: Object,
  //   required: true
  // },
  timeStamp:{
    type: Number,
    required: true
  },
  from:{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact"
    },
    firstName: String,
    lastName: String,
    dnid: String,
    email: String,
    company: String
  },
  to:{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact"
    },
    firstName: String,
    lastName: String,
    dnid: String,
    email: String,
    company: String
  },
  type: {
    type: String,
    required: true
  },
  initiated:{
    type: Object,
    required: false
  },
  ringing:{
    type: Object,
    required: false
  },
  answered:{
    type: Object,
    required: false
  },
  completed:{
    type: Object,
    required: false
  }
})


//this model allows us to interact with the database
module.exports = mongoose.model('Interaction', interactionSchema);
