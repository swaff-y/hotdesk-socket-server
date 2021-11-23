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

module.exports = router;

//outbound
//curl http://localhost:3003/phone/outbound?CallSid=ojIckSD2jqNzOqIrAGzL
router.get('/outbound', (req,res) => {
  if(simulation){
    console.log("Outbound: ",req?.query?.CallSid);
    const io = req.app.get('socketio');
    io.emit("established", {CallType:"outbound", CallSid: req?.query?.CallSid, TimeStamp: Date.now()});

    simulationDurations(req, res, "outbound");
  } else {
    const url = `${ngrokBase}/phone/events`;
    handleOutbound(client,url,req,res);
  }
});

//inbound
//curl http://localhost:3003/phone/inbound?CallSid=ojIckSD2jqNzOqIrAGzL
router.get('/inbound', (req, res) => {
  console.log("Inbound: ",req?.query?.CallSid);
  const io = req.app.get('socketio');
  io.emit("established", {CallType:"inbound", CallSid: req?.query?.CallSid, TimeStamp: Date.now()});

  if(simulation){
    simulationDurations(req, res, "inbound");
  }else{
    handleInbound(req, res);
  }
});

//events
router.get('/events', (req, res) => {
  const io = req.app.get('socketio');
  io.emit("events", req?.query);

  console.log(`Events: (${req?.query?.CallSid}):`, req?.query?.To, req?.query?.CallStatus, req?.query);
  res.setHeader('content-type', 'text/plain');
  res.status(200).send(`${req?.query?.CallStatus}`);
});

//functions
function handleOutbound(client,url,req,res)
{
  client.calls
  .create({
    statusCallback: url,
    statusCallbackMethod: 'GET',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    twiml: `<Response><Dial callerId="+61450493936"><Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${ngrokBase}/phone/events" statusCallbackMethod="GET">+61450503662</Number></Dial><Say voice="alice">Goodbye</Say></Response>`,
    // twiml: twiml,
    to: '+61450493936',
    from: '+12673994326'
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
  const twiml = `<Response><Dial callerId="${req?.query?.From}"><Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${ngrokBase}/events" statusCallbackMethod="GET">+61450503662</Number></Dial><Say voice="alice">Goodbye</Say></Response>`;
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
