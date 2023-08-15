require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const routes = require("./router");
const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use("/api", routes);

mongoose.connect(process.env.DB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const database = mongoose.connection;

database.on("error", (err) => console.log("err"));

database.on("connected", () => console.log("DATABASE CONNECTED SUCCESSFULLY"));

app.listen(5000, () => {
  console.log("SERVER STARTED ON PORT:5000");
});
