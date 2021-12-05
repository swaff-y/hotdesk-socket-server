if(process.env.NODE_ENV !== 'production'){
	   require('dotenv').config();
}
const urlencoded = require('body-parser').urlencoded;
//database
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL,{ useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('connected to interaction database'));
//express
const express = require("express");
const app = express();
const port = process.env.INTERACTION_PORT || 3006;
//App
app.listen(port, () => {
	console.log(`Interaction Server is running on port ${port}...`);
});
app.use(express.json());
app.use(urlencoded({ extended: false }));
//CORS
const cors = require('cors');
app.use(cors({
    origin: '*'
}));
//controllers
app.use("/interaction", require("./controllers/interactions"));
app.use("/interactions", require("./controllers/interactions"));
