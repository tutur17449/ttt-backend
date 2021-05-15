const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT;

app.use(cors());

let usersList = [];

io.on("connection", (socket) => {
  const { id } = socket;
  console.log("Socket connected : " + id);

  // User logout
  socket.on("disconnect", () => {
    io.emit("userLogout", id);
    console.log("Socket disconnected : " + id);
  });
});

server.listen(PORT, () => {
  console.log("App running on port " + PORT);
});
