require('dotenv').config();
const express = require('express');
const router = express.Router();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// const simulation = process.env.SIMULATION;
const simulation = false;
const ngrokBase = process.env.NGROK_BASE;
const client = require('twilio')(accountSid, authToken);
const fetch = require('node-fetch');

module.exports = router;

//outbound
router.get('/outbound', (req,res) => {

  if(simulation){
    const events = ['initiated', 'ringing', 'answered', 'completed']
    for(let i = 0; i < 5; i++){
      // res.redirect(`/events?${testParams(i)}`);
      setTimeout(()=>{
        fetch(`${ngrokBase}/phone/events?${testParams(i)}`)
        .then(result => {
        })
        .then(result=>{
          res.send("Success");
        })
        .catch(err=>{
        })
      },i * 1000);
    }
  } else {
    const url = `${ngrokBase}/phone/events`;
    handleOutbound(client,url,req,res);
  }
});

//inbound
router.get('/', (req, res) => {
  console.log(req?.query?.CallSid);
  const twiml = `<Response><Dial callerId="${req?.query?.From}"><Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${ngrokBase}/events" statusCallbackMethod="GET">+61450503662</Number></Dial><Say voice="alice">Goodbye</Say></Response>`;
  res.type('text/xml');
  res.send(twiml);
});

//events
router.get('/', (req, res) => {
  // console.log("The body:", req.body);
  console.log(`The params (${req?.query?.CallSid}):`, req?.query?.To, req?.query?.CallStatus, req?.query);
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
    console.log(call.sid);
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

function testParams(i){
  const events = ['initiated', 'ringing', 'answered', 'completed']
  const forward = {
    "AccountSid": "AC4a75cab35277ba56632a6cffa4c0297c",
    "ApiVersion": "2010-04-01",
    "CallSid": "CA177a1dd0565651e5b5fc3cc44bfdef88",
    "CallStatus": "in-progress",
    "Called": "+61450493936",
    "CalledCity": "",
    "CalledCountry": "AU",
    "CalledState": "",
    "CalledZip": "",
    "Caller": "+12673994326",
    "CallerCity": "YARDLEY",
    "CallerCountry": "US",
    "CallerState": "PA",
    "CallerZip": "19067",
    "DialCallDuration": "3",
    "DialCallSid": "CA37b899f415fe427612e7a08b645c6918",
    "DialCallStatus": "completed",
    "Direction": "outbound-api",
    "From": "+12673994326",
    "FromCity": "YARDLEY",
    "FromCountry": "US",
    "FromState": "PA",
    "FromZip": "19067",
    "To": "+61450493936",
    "ToCity": "",
    "ToCountry": "AU",
    "ToState": "",
    "ToZip": ""
  };
  const back = {
    "Called": "+61450493936",
    "ToState": "",
    "CallerCountry": "US",
    "Direction": "outbound-api",
    "Timestamp": "Tue, 09 Nov 2021 08:32:46 +0000",
    "CallbackSource": "call-progress-events",
    "CallerState": "PA",
    "ToZip": "",
    "SequenceNumber": "0",
    "CallSid": "CA177a1dd0565651e5b5fc3cc44bfdef88",
    "To": "+61450493936",
    "CallerZip": "19067",
    "ToCountry": "AU",
    "CalledZip": "",
    "ApiVersion": "2010-04-01",
    "CalledCity": "",
    "From": "+12673994326",
    "AccountSid": "AC4a75cab35277ba56632a6cffa4c0297c",
    "CalledCountry": "AU",
    "CallerCity": "YARDLEY",
    "ToCity": "",
    "FromCountry": "US",
    "Caller": "+12673994326",
    "FromCity": "YARDLEY",
    "CalledState": "",
    "FromZip": "19067",
    "FromState": "PA"
  };
  if(i === 4){
    back.CallStatus = events[i - 1];
  }else{
    back.CallStatus = events[i];
  }
  const forwardArr = Object.keys(forward);
  const forArr = [];
  for(let i = 0; i < forwardArr.length; i++){
    forArr.push(`${forwardArr[i]}=${forward[forwardArr[i]]}`);
  };
  const backArr = Object.keys(back);
  const baArr = [];
  for(let i = 0; i < backArr.length; i++){
    baArr.push(`${backArr[i]}=${back[backArr[i]]}`);
  };
  if(i === 3)
    return forArr.join("&");
  else
    return baArr.join("&");
}
