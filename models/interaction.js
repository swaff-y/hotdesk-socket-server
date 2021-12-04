//need to require mongoose
//allow us to interact with the database
const mongoose = require('mongoose');

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
  owner:{
    type: Object,
    required: true
  },
  timeStamp:{
    type: Number,
    required: true
  },
  from:{
    type: Object,
    required: false
  },
  to:{
    type: Object,
    required: false
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
