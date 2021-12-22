require('dotenv').config();
const express = require('express');
const router = express.Router();
const logger = require("./../logger").Logger;
// logger.info("Test Message");
// logger.debug("Test Message");
// logger.error("Test Message");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const simulation = process.env.SIMULATION;
// const simulation = false;
const ngrokBase = process.env.NGROK_BASE;
const client = require('twilio')(accountSid, authToken);
const fetch = require('node-fetch');
const Contact = require("../models/contact");
const Interaction = require("../models/interaction");
const User = require("../models/users");
const bcrypt = require("bcrypt");

module.exports = router;

let SID_SIMS = "";

ctx = {fromNum:0,toNum:0};

//outbound
//curl -X GET "http://localhost:3003/phone/outbound?PhoneNumber=61450503662&UserId=6173e1c42a990e18eccafbdb"
router.get('/outbound', async (req,res) => {
  if(!req?.query?.PhoneNumber){
    //contextCode: Err-phone001
    logger.error("Phone Number not included", "Please include phone number",
    {
      contextCode: "Err-phone001",
      query: req?.query
    });
    return res.status(400).json({message: "Please include phone number"})
  }

  if(simulation) ctx.toNum = req?.query?.PhoneNumber.trim();

  try{
    SID_SIMS = await bcrypt.hash(String(new Date()),10);
    //get user here with await and then pass to outbound request
    const owner = await User.findById(req?.query?.UserId,(err)=>{
      if(err) throw new Error(err);
    }).clone();

    if(owner){
      outboundRequest(req,res,owner);
    }else{
      throw new Error('Could not assign an owner')
    }

  } catch(err) {
    //contextCode: Err-phone002
    logger.error("Outbound phone api failed", err,
    {
      contextCode: "Err-phone002",
      query: req?.query
    });
    res.status(500).json({ error: true, message: err.message });
  }
});

//inbound
//curl -X GET "http://localhost:3003/phone/inbound?From=61450503662&ForwardedFrom=12673994326"
router.get('/inbound', async (req, res) => {
  logger.debug("Inbound: ", req?.query);

  if(simulation) ctx.fromNum = req?.query?.From?.trim();

  const io = req.app.get('socketio');
  io.emit("established", {CallType:"inbound", PhoneNumber: req?.query?.From?.trim(), TimeStamp: Date.now()});

  try {
    SID_SIMS = await bcrypt.hash(String(new Date()),10);
    //Get User from "From" and pass to handleInbound
    const owner = await User.findOne({dn: req?.query?.ForwardedFrom?.trim()},(err)=>{
      if(err) throw new Error(err);
    }).clone();

    if(owner){
      if(simulation){
        simulationDurations(req, res, "inbound", );
      }else{
        handleInbound(req, res, owner);
      }
    } else {
      throw new Error("Could not assign owner");
    }

  } catch(err) {
    //contextCode: Err=phone003
    logger.error("Inbound phone api failed", err,
    {
      contextCode: "Err-phone003",
      query: req?.query
    });
    res.status(500).json({ error: true, message: err.message });
  }

});

//events
router.get('/events', async (req, res) => {
  logger.debug(`Event_${req?.query.CallSid} ->`);

  let contactFrom;
  let contactTo;
  let interaction;
  try {
    contactFrom = await Contact.findOneAndUpdate(
      { dnid: req?.query?.From?.trim() },
      { dnid: req?.query?.From?.trim() },
      { upsert: true },
      function(err, doc) {
        if (err){
          logger.error("Could not upsert Contact", err,
          {
            contextCode: "Err-phone007",
            query: req?.query
          });
          throw new Error("Could not upsert Contact");
        }
      }
    ).clone();
    contactTo = await Contact.findOneAndUpdate(
      { dnid: req?.query?.To?.trim() },
      { dnid: req?.query?.To?.trim() },
      { upsert: true },
      function(err, doc) {
        if (err){
          logger.error("Could not upsert Contact", err,
          {
            contextCode: "Err-phone008",
            query: req?.query
          });
          throw new Error("Could not upsert Contact");
        }
      }
    ).clone();

    const upsertInteraction = async (type) => {
      let obj = {};
      if((req?.query?.CallStatus === "initiated") && req?.query?.CalledVia){
        //Get OwnerId from contactTo "routeNumber"
        const owner = await User.findOne({dn: req?.query?.ForwardedFrom?.trim()},(err)=>{
          if(err) {
            logger.error("Could not get owner", err,
            {
              contextCode: "Err-phone009",
              query: req?.query
            });
            throw new Error(err);
          }
        }).clone()

        if(owner){
          obj = {
            direction: "inbound",
            timeStamp: Date.now(),
            owner: owner,
            from:contactFrom,
            to: contactTo,
            type: "voice",
            [type]: req.query
          };
        } else {
          logger.error("Could not assign owner " + req?.query?.ForwardedFrom?.trim(), null,
          {
            contextCode: "Err-phone010",
            query: req?.query
          });
          throw new Error("Could not assign owner " + req?.query?.ForwardedFrom?.trim());
        }

      } else if((req?.query?.CallStatus === "initiated") && !req?.query?.CalledVia ) {
        //Get OwnerId from contactFrom "routeNumber"
        if(req.query.Direction === "outbound-api"){
          const owner = await User.findOne({dn: req?.query?.From?.trim()},(err)=>{
            if(err){
              logger.error("Could not get owner", err,
              {
                contextCode: "Err-phone011",
                query: req?.query
              });
              throw new Error(err);
            }
          }).clone();

          if(owner){
            obj.owner = owner
          } else {
            logger.error("Could not get owner", null,
            {
              contextCode: "Err-phone012",
              query: req?.query
            });
            throw new Error("Could not assign owner")
          }
        }

        obj.direction = "outbound";
        obj.timeStamp = Date.now();
        obj.from = contactFrom;
        obj.to = contactTo;
        obj.type = "voice";
        obj[type] = req.query;

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
        )
        .populate("from")
        .populate("to")

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
    //contextCode: Err-phone004
    logger.error("Events phone api failed", err,
    {
      contextCode: "Err-phone004",
      query: req?.query
    });
    res.status(500).json({ error: true, message: err.message });
  }
});

//functions
function handleEvents(req,res){
  const io = req.app.get('socketio');
  io.emit("events", req?.query);

  logger.debug(`${JSON.stringify(req?.query)}<- Event_${req?.query?.CallSid}`);
  // res.setHeader('content-type', 'text/plain');

  //contextCode: Suc-phone001
  logger.info("Events phone api sent",
  {
    contextCode: "Suc-phone001",
    query: req?.query
  });
  res.status(200).json({ message: "Success", callStatus: `${req?.query?.CallStatus}`});
}

function outboundRequest(req,res,owner){
  if(simulation){
    logger.debug(`Outbound (Simulation): ${req?.query?.PhoneNumber} ${req?.query?.UserId}`);

    const io = req.app.get('socketio');
    io.emit("established", {CallType:"outbound", PhoneNumber: req?.query?.PhoneNumber, TimeStamp: Date.now()});

    simulationDurations(req, res, "outbound");
  } else {
    logger.debug(`Outbound: ${req?.query?.PhoneNumber} ${req?.query?.UserId}`);

    const url = `${ngrokBase}/phone/events`;
    handleOutbound(client,url,req,res,owner);
  }
}

function handleOutbound(client,url,req,res,owner)
{
  logger.debug(`The base: ${ngrokBase}`);

  client.calls
  .create({
    statusCallback: url,
    statusCallbackMethod: 'GET',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    twiml: `<Response><Dial callerId="+${owner.routeNumber}"><Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${ngrokBase}/phone/events" statusCallbackMethod="GET">+${req.query.PhoneNumber}</Number></Dial><Say voice="alice">Goodbye</Say></Response>`, //callerId from userlookup - <number/> from query
    // twiml: twiml,
    to: `+${owner.routeNumber}`, //from userlookup *add plus*
    from: `+${owner.dn}` //test this if changed - from userProfile
  })
  .then(call => {
    logger.debug(`Outbound: ${call.sid}`);

    const io = req.app.get('socketio');
    io.emit("established", {CallType:"outbound", CallSid: call.sid, TimeStamp: Date.now()});

    //contextCode: Suc-phone002
    logger.info("Handle outbound success",
    {
      contextCode: "Suc-phone002",
      query: req?.query
    });
    res.status(200).json({
      message: "Success"
    });
  })
  .catch(error => {
    //contextCode: Err-phone005
    logger.error("Handle outbound failed", err,
    {
      contextCode: "Err-phone005",
      query: req?.query
    });

    res.status(500).json({
      error: true,
      message: error
    });
  });
}

function handleInbound(req, res, owner){
  const twiml = `<Response><Dial callerId="${req?.query?.From?.trim()}"><Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${ngrokBase}/phone/events" statusCallbackMethod="GET">+${owner.routeNumber}</Number></Dial><Say voice="alice">Goodbye</Say></Response>`; //number from user profile

  //contextCode: Suc-phone004
  logger.info("Handle inbound success",
  {
    contextCode: "Suc-phone004",
    query: req?.query
  });

  res.type('text/xml');
  res.send(twiml);
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
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
      data.Timestamp = new Date();
      data.From = ctx.fromNum;
      data.Caller = ctx.fromNum;
    } else {
      data = require(`../simulations/outbound/${action}.json`);
      data.Timestamp = new Date();
      data.To = ctx.toNum;
      data.Called = ctx.toNum;
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
      // .then(result => {
      // })
      .then(result=>{
        //contextCode: Suc-phone003
        logger.info("Handle outbound / inbound success (simulation)",
        {
          contextCode: "Suc-phone003",
          query: req?.query
        });
        res.status(200).json({
          message: "Success"
        });
      })
      .catch(err=>{
        //contextCode: Err-phone006
        logger.error("Fetch events failed: " + str, err,
        {
          contextCode: "Err-phone006",
          query: req?.query
        });
      })
    },eventDuration);
  }
}
