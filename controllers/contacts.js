require('dotenv').config();
const express = require('express');
const router = express.Router();
const Contact = require("../models/contact");

module.exports = router;

//Get All
//curl -X GET http://localhost:3005/contact/
router.get("/", async (req,res) => {
  try{
    //this will get all the different contacts
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Get One
//curl -X GET http://localhost:3005/contact/6167f42172f1a407b2bcbeef
//The "getContact" middleware will get the contact with the id
router.get("/:id", getContact, (req,res) => {
  res.status(200).json(res.contact);
});

//Create one
//curl -X POST -H "Content-Type: application/json" -d '{"firstName":"Kyle","lastName":"Swaffield"}' http://localhost:3005/contact/
router.post("/", async (req,res) => {
  //get contact details from the json body
  const contact = new Contact(req.body);
  try{
    const newContact = await contact.save();
    //201 succesfully created an object
    //if left out a 200 is sent - which means succesfull
    // 201 is more specific - object created
    res.status(201).json(newContact);
  } catch (err) {
    //when user give bad data send 400 because there is something wrong with the request.
    res.status(400).json({ message: err.message });
  };
});

//Update One
//put updates all. Patch only updates the info passed
//curl -X PATCH -H "Content-Type: application/json" -d '{"name":"Chase"}' http://localhost:3005/contact/616a105a06b836c0c411b00a
router.patch("/:id", getContact, async (req,res) => {

  const bodyKeys = Object.keys(req.body);
  const obj = res.contact;
  for(let i = 0; i < bodyKeys.length; i++){
    const key = bodyKeys[i];
    if(req.body[key] !== null){
      obj[key] = req.body[key];
    }
  }
  try{
    const updatedContact = await res.contact.save();
    res.status(201).json(updatedContact)
  } catch(err) {
    res.status(400).json({ message: err.message })
  }
});

//Delete One
//curl -X DELETE http://localhost:3005/contact/6167f42172f1a407b2bcbeef
router.delete("/:id", getContact, async (req,res) => {
  try{
    //try remove the contact
    await res.contact.remove();
    res.status(201).json({ message: "Deleted contact " + res.contact.firstName});
  } catch (err) {
    //else catch the error
    res.status(500).json({ message: err.message });
  }
});

//middleware function to get contact
async function getContact(req, res, next){
  let contact;
  try{
    contact = await Contact.findById(req.params.id);
    if(contact === null){
      //404 status means you could not find something
      return res.status(404).json({ message: "Could not find contact with id " + req.params.id})
    }
  } catch(err) {
    return res.status(500).json({ message: err.message });
  }

  //set response to be equal to contact
  res.contact = contact;
  next();
};
