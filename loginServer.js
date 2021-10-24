require('dotenv').config()
const express = require('express');
const app = express();

//tell server we are using ejs
app.set('view-engine', 'ejs')

//Set the port
app.listen(3002);

//Require mongoose to connect to our mongodb database
const mongoose = require('mongoose');

//connect to our database
//need to pull databse url out into an env variable
mongoose.connect(process.env.DATABASE_URL,{ useNewUrlParser: true});
//A variable to store mongo connection
const db = mongoose.connection;
//See if there is an error connecting to our database
db.on('error', (error) => console.error(error));
//message to see that we have connected to the database
db.once('open', () => console.log('connected to database'));

//express to use json
app.use(express.json());

//CORS
const cors = require('cors');
app.use(cors({
    origin: '*'
}));

//controllers
app.use('/login', require("./controllers/login"));
app.use('/users', require("./controllers/users"));
