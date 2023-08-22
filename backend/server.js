const { Pool, Client } = require("pg");

// Constants
const PORT = process.env.PORT;
const HOST = process.env.DOMAIN;

// Express jobs
const express = require("express");
const cors = require("cors");

const app = express();

//app.use(express.json()) //For JSON requests
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.static("public"));


// Socket.io jobs
const http_server = require("http").Server(app);
const io = require("socket.io")(http_server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("update", () => {
    io.emit("update");
  });
});

// Cron jobs
const cron = require("node-cron");
cron.schedule("* * * * *", () => {
  console.log("Run task every minute");
  io.emit("update");
});

// Postgres jobs
const client = new Client({
  password: "root",
  user: "root",
  host: "postgres",
});
client.connect();

const moment = require("moment");
const axios = require("axios");
const jwt = require("jsonwebtoken");

require("./banphaeo.js")(app, client);
require("./machine.js")(app, client, io);
require("./debug.js")(app, client);
require("./web.js")(app, client, io, moment, axios, jwt, http_server);

(async () => {
  http_server.listen(PORT, () => {
    console.log(`App with Socket.io listening at http://${HOST}:${PORT}`);
  });
})();
// app.listen(PORT, HOST);
// console.log(`Running on http://${HOST}:${PORT}`);
