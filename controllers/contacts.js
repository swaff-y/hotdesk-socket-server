require('dotenv').config();
const express = require('express');
const router = express.Router();
const Contact = require("../models/contact");
const jwt = require("./jwt");
const logger = require("./../logger").Logger;
// logger.info("Test Message");
// logger.debug("Test Message");
// logger.error("Test Message");

module.exports = router;

//Get All
//curl -X GET http://localhost:3005/contact/
router.get("/", jwt.authenticateToken, async (req,res) => {
  try{
    //this will get all the different contacts
    const contacts = await Contact.find();
    logger.info("Contacts found", {
      contextCode: "Suc-contact001",
      query: contacts
    });
    res.status(200).json(contacts);
  } catch (err) {
    logger.error("500 Server Error (contacts)", err,
    {
      contextCode: "Err-contact001"
    });
    res.status(500).json({ message: err.message });
  }
});

//Get One
//curl -X GET http://localhost:3005/contact/6167f42172f1a407b2bcbeef
//The "getContact" middleware will get the contact with the id
router.get("/:id", jwt.authenticateToken, getContact, (req,res) => {
  logger.info("Contact found", {
    contextCode: "Suc-contact002",
    query: res.contact
  });
  res.status(200).json(res.contact);
});

//Create one
//curl -X POST -H "Content-Type: application/json" -d '{"firstName":"Kyle","lastName":"Swaffield"}' http://localhost:3005/contact/
router.post("/",jwt.authenticateToken, async (req,res) => {
  //get contact details from the json body

  const contact = new Contact(req.body);
  try{
    const newContact = await contact.save();
    logger.info("Contact saved", {
      contextCode: "Suc-contact003",
      query: contact
    });
    res.status(201).json(newContact);
  } catch (err) {
    //when user give bad data send 400 because there is something wrong with the request.
    logger.error("400 Bad data by user", err,
    {
      contextCode: "Err-contact002",
      query: req.body
    });
    res.status(400).json({ message: err.message });
  };
});

//Update One
//put updates all. Patch only updates the info passed
//curl -X PATCH -H "Content-Type: application/json" -d '{"name":"Chase"}' http://localhost:3005/contact/616a105a06b836c0c411b00a
router.patch("/:id", jwt.authenticateToken, getContact, async (req,res) => {

  const bodyKeys = Object.keys(req.body);
  const obj = res.contact;
  for(let i = 0; i < bodyKeys.length; i++){
    const key = bodyKeys[i];
    if(req.body[key] !== null){
      console.log("Here", req.body[key], typeof key);
      // obj[key] = req.body[key];
      res.contact[key] = req.body[key];
    }
  }
  try{
    console.log("aqw:", res.contact);
    const updatedContact = await res.contact.save();
    logger.info("Contact updated", {
      contextCode: "Suc-contact004",
      query: updatedContact
    });
    res.status(201).json(updatedContact)
  } catch(err) {
    logger.error("400 bad data", err,
    {
      contextCode: "Err-contact003",
      query: req.body
    });
    res.status(400).json({ message: "test" + err.message })
  }
});

//Delete One
//curl -X DELETE http://localhost:3005/contact/6167f42172f1a407b2bcbeef
router.delete("/:id", jwt.authenticateToken, getContact, async (req,res) => {
  try{
    //try remove the contact
    await res.contact.remove();
    logger.info("Contact deleted", {
      contextCode: "Suc-contact005",
      query: res.contact
    });
    res.status(201).json({ message: "Deleted contact " + res.contact.firstName});
  } catch (err) {
    //else catch the error
    logger.error("500 Server Error (contacts)", err,
    {
      contextCode: "Err-contact003"
    });
    res.status(500).json({ message: err.message });
  }
});

//middleware function to get contact
async function getContact(req, res, next){
  let contact;
  try{
    if(req.params.id.length > 12){
      contact = await Contact.findById(req.params.id);
      if(contact === null){
        logger.error("404 Could not find contact", err,
        {
          contextCode: "Err-contact004",
          query: req.params.id
        });
        return res.status(404).json({ message: "Could not find contact with id " + req.params.id})
      }
    } else {
      contact = await Contact.findOne({dnid:req.params.id});
      if(contact === null){
        //404 status means you could not find something
        logger.error("404 Could not find contact", err,
        {
          contextCode: "Err-contact005",
          query: req.params.id
        });
        return res.status(404).json({ message: "Could not find contact with id " + req.params.id})
      }
    }

  } catch(err) {
    console.log("getContact",err.message);
    logger.error("500 Server Error", err,
    {
      contextCode: "Err-contact006",
      query: req.params.id
    });
    return res.status(500).json({ message: err.message });
  }

  //set response to be equal to contact
  res.contact = contact;
  next();
};
