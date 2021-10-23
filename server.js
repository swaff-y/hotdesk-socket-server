require('dotenv').config()
const express = require('express');
const app = express();

//tell server we are using ejs
app.set('view-engine', 'ejs')

//Set the port
app.listen(3002);

//express to use json
app.use(express.json());

//controllers
app.use('/login', require("./controllers/login"));
app.use('/users', require("./controllers/users"));
