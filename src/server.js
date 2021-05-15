const dotenv = require("dotenv");
dotenv.config();
const { v4 } = require("uuid");
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
const { checkUser, removeUser } = require("./users.utils");
const {
  checkRoom,
  checkIsOwner,
  getPublicGames,
  removeAllUsersFromRoom,
  removeOnUserFromRoom,
  addUserToRoom,
  deleteRoom,
} = require("./rooms.utils");

app.use(cors());

// Store users and games in memory
let usersList = [];
let roomsList = [];

// Retrieve data
app.get("/api/users", (req, res) => {
  res.send({ usersList });
});

app.get("/api/games", (req, res) => {
  const publicGames = getPublicGames(roomsList);
  res.send({ games: publicGames });
});

app.get("/api/game/:id", (req, res) => {
  const { id } = req.params;
  const game = checkRoom(id, roomsList);
  if (game) res.status(404).send({ message: "Game not found" });
  if (game.users.length >= 2) res.status(401).send({ message: "Game is full" });
  res.send({ game });
});

// Init socket
io.on("connection", (socket) => {
  const { id } = socket;
  console.log("Socket connected : " + id);

  // User login
  socket.on("userLogin", (user) => {
    const isExist = checkUser(user, usersList);
    if (isExist) {
      return socket.emit("socketError", "User already exist");
    }
    socket.username = user;
    usersList = [socket, ...usersList];
    io.emit("userOnline", user);
  });

  // Create game
  socket.on("createNewGame", (status) => {
    const uuid = v4();
    const game = {
      id: uuid,
      status,
      owner: id,
      users: [id],
    };
    socket.room = uuid;
    socket.join(uuid);
    roomsList.push(game);
    socket.emit("userCreateNewGame", game);
    if (status === "public") {
      io.emit("newGameCreate", game);
    }
  });

  // User leave game
  socket.on("userLeaveRoom", (roomId) => {
    const game = checkRoom(roomId, roomsList);
    if (game) {
      const isOwner = checkIsOwner(id, roomId, roomsList);
      if (isOwner) {
        removeAllUsersFromRoom(roomId, roomsList, usersList);
        roomsList = deleteRoom(roomId, roomsList);
        io.to(roomId).emit("ownerLeaveRoom");
        io.emit("deleteRoom", roomId);
      } else {
        delete socket.room;
        socket.leave(roomId);
        roomsList = removeOnUserFromRoom(id, roomId, roomsList);
        io.to(roomId).emit("userLeaveCurrentGame", id);
        io.emit("userLeaveGame", game);
      }
    }
  });

  // Join game
  socket.on("joinGame", (roomId) => {
    if (socket.room) {
      return socket.emit("socketError", "User already in game");
    }
    const game = checkRoom(roomId, roomsList);
    if (!game) {
      return socket.emit("socketError", "Game not found");
    }
    if (game.users.length >= 2) {
      return socket.emit("socketError", "Game is full");
    }
    socket.room = roomId;
    socket.join(roomId);
    addUserToRoom(id, roomId, roomsList);
    socket.emit("joinGameSuccess", game);
    io.to(roomId).emit("userJoinCurrentGame", id);
    io.emit("userJoinGame", game);
  });

  // User logoutuserJoinGame
  socket.on("disconnect", () => {
    io.emit("userLogout", id);
    if (socket.room) {
      roomsList = removeOnUserFromRoom(id, socket.room, roomsList);
    }
    usersList = removeUser(id, usersList);
    console.log("Socket disconnected : " + id);
  });
});

server.listen(PORT, () => {
  console.log("App running on port " + PORT);
});
