if(process.env.NODE_ENV !== 'production'){
	   require('dotenv').config();
}
const urlencoded = require('body-parser').urlencoded;

const express = require("express");
const app = express();
const port = process.env.PHONE_PORT || 3003;

app.listen(port, () => {
	console.log(`Phone Server is running on port ${port}...`);
});

app.use(express.json());
app.use(urlencoded({ extended: false }));

app.use("/phone", require("./controllers/phone"));
