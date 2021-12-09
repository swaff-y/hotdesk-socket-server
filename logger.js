require('dotenv').config();
const logging = process.env.LOGGING;
const fs = require("fs");
const Logger = (exports.Logger = {});
const infoStream = fs.createWriteStream("logs/info.log");
const errorStream = fs.createWriteStream("logs/error.log");
const debugStream = fs.createWriteStream("logs/debug.log");

function jsonToString(jsonData){
  let json = undefined;
  json = JSON.stringify(jsonData) || "No JSON";
  return json;
}

Logger.info = function(msg, jsonData) {
  const message = new Date().toISOString() + " : " + msg + " -> " + jsonToString(jsonData) + "\n";
  infoStream.write(message);
  if(logging){
    console.log("[INFO]", message);
  }
};

Logger.debug = function(msg, jsonData) {
  const message = new Date().toISOString() + " : " + msg + " -> " + jsonToString(jsonData) + "\n";
  debugStream.write(message);
  if(logging){
    console.log("[DEBUG]", message );
  }
};

Logger.error = function(msg, err, jsonData) {
  const message = new Date().toISOString() + " : " + msg + " -> " + jsonToString(jsonData) + "\n";
  errorStream.write(message);
  if(logging){
    console.error("[ERROR]:", message, err);
  }
};
