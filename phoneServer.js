if(process.env.NODE_ENV !== 'production'){
	   require('dotenv').config();
}
const urlencoded = require('body-parser').urlencoded;

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
