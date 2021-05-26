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
const roomClass = require("./class/room.class");
const gameClass = require("./class/game.class");
const { checkUser, removeUser } = require("./utils/users.utils");
const { getPublicGames } = require("./utils/rooms.utils");

app.use(cors());

// Store users and rooms in memory
let rooms = new Map();
let usersList = [];

// Retrieve data
app.get("/api/users", (req, res) => {
  res.send({ usersList });
});

app.get("/api/games", (req, res) => {
  const publicGames = getPublicGames(rooms);
  res.send({ games: publicGames });
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
    io.emit("userOnline", { id, username: user });
  });

  // Create game
  socket.on("createNewGame", (status) => {
    const uuid = v4();
    const gameRoom = new roomClass(
      uuid,
      status,
      { id, username: socket.username },
      [{ id, username: socket.username }]
    );
    socket.room = uuid;
    socket.join(uuid);
    rooms.set(uuid, gameRoom);
    socket.emit("createNewGameConfirmation", gameRoom);
    if (status === "public") {
      io.emit("newGameCreate", gameRoom);
    }
  });

  // User leave game
  socket.on("userLeaveRoom", (roomId) => {
    const gameRoom = rooms.get(roomId);
    if (gameRoom) {
      const isOwner = gameRoom.checkIsOwner(id);
      if (isOwner) {
        // If user is room owner, all users leave room and delete room
        io.to(roomId).emit("ownerLeaveRoom");
        gameRoom.deleteAllUsers(usersList);
        rooms.delete(roomId);
        io.emit("deleteRoom", roomId);
      } else {
        // Else, remove user from room
        delete socket.room;
        socket.leave(roomId);
        gameRoom.deleteUser(id);
        io.to(roomId).emit("userLeaveCurrentGame", id);
        io.emit("userLeaveGame", gameRoom);
      }
    }
  });

  // Join game
  socket.on("joinGame", (roomId) => {
    if (socket.room) {
      return socket.emit("socketError", "User already in game");
    }
    const gameRoom = rooms.get(roomId);
    if (!gameRoom) {
      return socket.emit("socketError", "Game not found");
    }
    if (gameRoom.users.length >= 2) {
      return socket.emit("socketError", "Game is full");
    }
    const newUser = { id, username: socket.username };
    socket.room = roomId;
    socket.join(roomId);
    gameRoom.addUser(newUser);
    socket.emit("joinGameConfirmation", gameRoom);
    io.to(roomId).emit("userJoinCurrentGame", newUser);
    io.emit("userJoinGame", gameRoom);

    const game = new gameClass();
    gameRoom.initGame(game);
    io.to(roomId).emit("startGame", game);
  });

  // Play
  socket.on("userPlay", ({ index, symbol }) => {
    const { room } = socket;
    const game = rooms.get(room).game;
    game.setMoove(index, symbol);
    const isWin = game.checkWin(symbol);
    if (isWin) {
      game.setEndGame(symbol);
      io.to(room).emit("endGame", game);
    } else {
      const isEnd = game.checkEnd();
      if (isEnd) {
        game.setEndGame(null);
        io.to(room).emit("endGame", game);
      } else {
        game.switchPlayer(symbol);
        io.to(room).emit("updateGame", game);
      }
    }
  });

  // Play again
  socket.on("playAgain", () => {
    const { room } = socket;
    const game = rooms.get(room).game;
    game.reset();
    io.to(room).emit("resetGame", game);
  });

  // User logoutuserJoinGame
  socket.on("disconnect", () => {
    io.emit("userLogout", id);
    if (socket.room) {
      const gameRoom = rooms.get(socket.room);
      gameRoom.deleteUser(id);
    }
    usersList = removeUser(id, usersList);
    console.log("Socket disconnected : " + id);
  });
});

server.listen(PORT, () => {
  console.log("App running on port " + PORT);
});
