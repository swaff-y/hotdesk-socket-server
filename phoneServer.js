if(process.env.NODE_ENV !== 'production'){
	   require('dotenv').config();
}
const urlencoded = require('body-parser').urlencoded;
const mongoose = require('mongoose');
//connect to our database
//need to pull databse url out into an env variable
mongoose.connect(process.env.DATABASE_URL,{ useNewUrlParser: true});
//A variable to store mongo connection
const db = mongoose.connection;
//See if there is an error connecting to our database
db.on('error', (error) => console.error(error));
//message to see that we have connected to the database
db.once('open', () => console.log('connected to phone database'));

const { Server } = require("socket.io");
const io = new Server(process.env.PHONE_SOCKET_PORT || 3004, {
    cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let sockId = "";
io.on("connection", (socket) => {
  console.log("Socket ID:",socket.id);
});

const express = require("express");
const app = express();
const port = process.env.PHONE_PORT || 3003;

app.listen(port, () => {
	console.log(`Phone Server is running on port ${port}...`);
});

app.use(express.json());
app.use(urlencoded({ extended: false }));
app.set('socketio', io);

app.use("/phone", require("./controllers/phone"));
