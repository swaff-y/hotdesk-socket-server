require('dotenv').config();
const express = require('express');
const router = express.Router();
const Interaction = require("../models/interaction");
const logger = require("./../logger").Logger;

module.exports = router;

//Get All
//curl -X GET http://localhost:3006/interaction/
router.get("/", async (req,res) => {
  try{
    //this will get all the different interactions
    const interactions = await Interaction.find();
    logger.info("Get Interaction - Success",
    {
      contextCode: "Suc-interaction002",
      query: req?.params
    });
    res.status(200).json(interactions);
  } catch (err) {
    logger.error("Server Error", err,
    {
      contextCode: "Err-interaction004",
      query: req?.params
    });
    res.status(500).json({ message: err.message });
  }
});
//Get All for user
//curl -X GET http://localhost:3006/interactions/:id
router.get("/:id", getInteractions, async (req,res) => {
  try{
    logger.info("Get Interactions for user - Success",
    {
      contextCode: "Suc-interaction001",
      query: req.params,
      result: res.interactions
    });
    res.status(200).json(res.interactions);
  } catch (err) {
    logger.error("Server Error", err,
    {
      contextCode: "Err-interaction003",
      query: req?.params
    });
    res.status(500).json({ message: err.message });
  }
});

//Get One
//curl -X GET http://localhost:3006/interaction/6167f42172f1a407b2bcbeef
//The "getInteraction" middleware will get the interaction with the id
router.get("/:id", getInteraction, (req,res) => {
  res.status(200).json(res.interaction);
});

//Create one
//curl -X POST -H "Content-Type: application/json" -d '{**data**}' http://localhost:3006/interaction/
router.post("/", async (req,res) => {
  //get interaction details from the json body

  const interaction = new Interaction(req.body);
  try{
    const newInteraction = await interaction.save();
    //201 succesfully created an object
    //if left out a 200 is sent - which means succesfull
    // 201 is more specific - object created
    res.status(201).json(newInteraction);
  } catch (err) {
    //when user give bad data send 400 because there is something wrong with the request.
    res.status(400).json({ message: err.message });
  };
});

//Update One
//put updates all. Patch only updates the info passed
//curl -X PATCH -H "Content-Type: application/json" -d '{**data**}' http://localhost:3006/interaction/616a105a06b836c0c411b00a
router.patch("/:id", getInteraction, async (req,res) => {
  const bodyKeys = Object.keys(req.body);
  const obj = res.interaction;
  for(let i = 0; i < bodyKeys.length; i++){
    const key = bodyKeys[i];
    if(req.body[key] !== null){
      obj[key] = req.body[key];
    }
  }

  try{
    const updatedInteraction = await res.interaction.save();
    res.status(201).json(updatedInteraction)
  } catch(err) {
    res.status(400).json({ message: err.message })
  }
});

//Delete One
//curl -X DELETE http://localhost:3006/interaction/6167f42172f1a407b2bcbeef
router.delete("/:id", getInteraction, async (req,res) => {
  try{
    //try remove the interaction
    await res.interaction.remove();
    res.status(201).json({ message: "Deleted interaction " + res.interaction.id});
  } catch (err) {
    //else catch the error
    res.status(500).json({ message: err.message });
  }
});

//middleware function to get interaction
async function getInteraction(req, res, next){
  let interaction;
  try{
    interaction = await Interaction.findById(req.params.id);
    if(interaction === null){
      //404 status means you could not find something
      return res.status(404).json({ message: "Could not find interaction with id " + req.params.id})
    }
  } catch(err) {
    return res.status(500).json({ message: err.message });
  }

  //set response to be equal to interaction
  res.interaction = interaction;
  next();
};
//middleware function to get interactions for user
async function getInteractions(req, res, next){
  logger.debug("The Request(params)", req?.params);
  logger.debug("The Request(query)", req?.query);
  let interactions;
  try{
    //ToDo: this will show up as a 500 server error. Not correct
    if(!req?.query?.direction) new Error("Please include a direction to query");
    if(!req?.query?.limit) new Error("Please include a limit to query");
    if(!req?.query?.page) new Error("Please include a page to query");
    if(!req?.params?.id) new Error("Please include an \"id\" to parameters");

    const perPage = parseInt(req?.query?.limit);
    const page = Math.max(0, parseInt(req.query.page));

    interactions = await Interaction
    .find({ "owner._id": req.params.id })
    .sort({"timeStamp": req?.query?.direction})
    .limit(perPage)
    .skip(perPage * (page - 1))
    .exec(
      async function(err, data){
        await Interaction.count().exec(function(err, count) {

          var interactions = {
            data,
            page: page,
            pages: Math.round(count / perPage)
          }
          res.interactions = interactions;
          next();
        })
    });

    if(interactions === null){
      //404 status means you could not find something
      logger.error("Could not find interactions for user",
      "Could not find interactions for user",
      {
        contextCode: "Err-interaction001",
        query: req?.params
      });
      return res.status(404).json({ message: "Could not find interactions for user with id " + req.params.id})
    }
  } catch(err) {
    logger.error("Server Error", err,
    {
      contextCode: "Err-interaction002",
      query: req?.params
    });
    return res.status(500).json({ message: err.message });
  }

  //set response to be equal to interaction
  // res.interactions = interactions;
  // next();
};
