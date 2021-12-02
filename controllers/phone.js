require('dotenv').config();
const express = require('express');
const router = express.Router();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const simulation = process.env.SIMULATION;
// const simulation = false;
const ngrokBase = process.env.NGROK_BASE;
const client = require('twilio')(accountSid, authToken);
const fetch = require('node-fetch');
const Contact = require("../models/contact");
const Interaction = require("../models/interaction");
const bcrypt = require("bcrypt");

module.exports = router;

let SID_SIMS = "";

//outbound
//curl http://localhost:3003/phone/outbound?PhoneNumber=61450503662&UserId=
router.get('/outbound', async (req,res) => {
  if(!req?.query?.PhoneNumber){
    return res.status(400).json({message: "Please include phone number"})
  }

  try{
    SID_SIMS = await bcrypt.hash(String(new Date()),10);
    //get user here with await and then pass to outbound request
    outboundRequest(req,res);
  } catch(err) {
    console.error("Unsuccessful request: ", err);
    res.status(500).json({ message: err.message });
  }
});

//inbound
//curl http://localhost:3003/phone/inbound?From=61450493936
router.get('/inbound', async (req, res) => {
  console.log("Inbound: ",req?.query?.CallSid);
  const io = req.app.get('socketio');
  io.emit("established", {CallType:"inbound", PhoneNumber: req?.query?.From, TimeStamp: Date.now()});

  try {
    SID_SIMS = await bcrypt.hash(String(new Date()),10);
    //Get User from "From" and pass to handleInbound
    if(simulation){
      simulationDurations(req, res, "inbound");
    }else{
      handleInbound(req, res);
    }
  } catch(err) {
    console.error("Unsuccessful request: ", err);
    res.status(500).json({ message: err.message });
  }

});

//events
router.get('/events', async (req, res) => {
  console.log(`Event_${req?.query.CallSid} ->`)
  let contactFrom;
  let contactTo;
  let interaction;
  try {
    contactFrom = await Contact.findOneAndUpdate(
      { dnid: req?.query?.From },
      { dnid: req?.query?.From },
      { upsert: true },
      function(err, doc) {
        if (err) console.error("Could not upsert Contact");
      }
    ).clone();
    contactTo = await Contact.findOneAndUpdate(
      { dnid: req.query.To },
      { dnid: req.query.To },
      { upsert: true },
      function(err, doc) {
        if (err) console.error("Could not upsert Contact");
      }
    ).clone();

    const upsertInteraction = async (type) => {
      let obj = {};
      if((req?.query?.CallStatus === "initiated") && req?.query?.CalledVia){
        obj = {
          direction: "inbound",
          timeStamp: Date.now(),
          from:contactFrom,
          to: contactTo,
          type: "voice",
          [type]: req.query
        };
        //Get OwnerId from contactTo "routeNumber"
      } else if((req?.query?.CallStatus === "initiated") && !req?.query?.CalledVia ) {
        obj = {
          direction: "outbound",
          timeStamp: Date.now(),
          from:contactFrom,
          to: contactTo,
          type: "voice",
          [type]: req.query
        };
        //Get OwnerId from contactFrom "routeNumber"
      } else {
        obj = {
          from:contactFrom,
          to: contactTo,
          type: "voice",
          [type]: req.query
        };
      }
      const interaction = await Interaction.findOneAndUpdate(
        { callSid: req?.query?.CallSid },
        obj,
        { upsert: true },
        function(err, doc) {
          if (err) console.error("Could not upsert Interaction", req?.query?.CallSid, req.query);
        }).clone();
      return interaction;
    }

    switch(req?.query?.CallStatus){
      case "initiated":
        interaction = await upsertInteraction("initiated");
      break;
      case "ringing":
        interaction = await upsertInteraction("ringing");
      break;
      case "in-progress":
        interaction = await upsertInteraction("answered");
      break;
      case "completed":
        interaction = await upsertInteraction("completed");
      break;
      default:
        console.warn("Nothing to update interaction");
    }
    req.query.Interaction = interaction;

    handleEvents(req,res)
  } catch (err) {
    console.error(err, `<- Event_${req?.query?.CallSid})_UnsuccessfulRequest`);
    res.status(500).json({ message: err.message });
  }
});

//functions
function handleEvents(req,res){
  const io = req.app.get('socketio');
  io.emit("events", req?.query);

  console.log(JSON.stringify(req?.query), `<- Event_${req?.query?.CallSid}`);
  res.setHeader('content-type', 'text/plain');
  res.status(200).send(`${req?.query?.CallStatus}`);
}

function outboundRequest(req,res){
  if(simulation){
    console.log("Outbound: ",req?.query?.PhoneNumber, req?.query?.UserId);
    const io = req.app.get('socketio');
    io.emit("established", {CallType:"outbound", PhoneNumber: req?.query?.PhoneNumber, TimeStamp: Date.now()});

    simulationDurations(req, res, "outbound");
  } else {
    const url = `${ngrokBase}/phone/events`;
    handleOutbound(client,url,req,res);
  }
}

function handleOutbound(client,url,req,res)
{
  console.log("The base:", ngrokBase);
  client.calls
  .create({
    statusCallback: url,
    statusCallbackMethod: 'GET',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    twiml: `<Response><Dial callerId="+61450493936"><Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${ngrokBase}/phone/events" statusCallbackMethod="GET">+61450503662</Number></Dial><Say voice="alice">Goodbye</Say></Response>`, //callerId from userlookup - <number/> from query
    // twiml: twiml,
    to: '+61450493936', //from userlookup *add plus*
    from: '+19595006980' //test this if changed - from userProfile
  })
  .then(call => {
    console.log("Outbound: ", call.sid);

    const io = req.app.get('socketio');
    io.emit("established", {CallType:"outbound", CallSid: call.sid, TimeStamp: Date.now()});

    res.status(200).json({
      message: "Success"
    });
  })
  .catch(error => {
    console.error(error);
    res.status(500).json({
      message: "Error"
    });
  });
}

function handleInbound(req, res){
  const twiml = `<Response><Dial callerId="${req?.query?.From}"><Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${ngrokBase}/phone/events" statusCallbackMethod="GET">+61450493936</Number></Dial><Say voice="alice">Goodbye</Say></Response>`; //number from user profile
  res.type('text/xml');
  res.send(twiml);
}

function simulationDurations(req, res, type){
  let events = [];
  if(type === "inbound"){
    events = ['initiated', 'ringing', 'answered', 'completed'];
  } else {
    events = ['initiated', 'ringing', 'answered', 'initiatedB', 'ringingB', 'answeredB', 'completedB', 'completed'];
  }

  for(let i = 0; i < events.length; i++){
    const action = events[i];
    let data = {}
    if(type === "inbound"){
      data = require(`../simulations/inbound/${action}.json`);
    } else {
      data = require(`../simulations/outbound/${action}.json`);
    }

    let eventDuration = 1000;
    switch(action){
      case "initiated":
        eventDuration = eventDuration - 999;
      break;
      case "initiatedB":
        eventDuration = eventDuration * 3.01;
      break;
      case "ringing":
        eventDuration = eventDuration * 1;
      break;
      case "ringingB":
        eventDuration = eventDuration * 4;
      break;
      case "answered":
        eventDuration = eventDuration * 3;
      break;
      case "answeredB":
        eventDuration = eventDuration * 5;
      break;
      case "completed":
        eventDuration = eventDuration * 20;
      break;
      case "completedB":
        eventDuration = eventDuration * 21;
      break;
      default:
        eventDuration = eventDuration * 1;
    }

    data.CallSid = SID_SIMS;

    const dataArr = Object.keys(data);
    const strArr = [];
    for( let i = 0; i < dataArr.length; i++ ){
      const param = dataArr[i];

      strArr.push(`${param}=${data[param]}`);
    }

    let str = strArr.join("&")

    setTimeout(()=>{
      fetch(`http://localhost:3003/phone/events?${str}`)
      .then(result => {
      })
      .then(result=>{
        res.send("Success");
      })
      .catch(err=>{
      })
    },eventDuration);
  }
}
