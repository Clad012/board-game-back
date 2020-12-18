const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const { v4: uuidV4 } = require("uuid");
var cors = require("cors");

// app.use(
//   cors({
//     origin: (origin, cb) => cb(null, true),
//     credentials: true,
//     preflightContinue: true,
//     exposedHeaders: [
//       "Access-Control-Allow-Headers",
//       "Access-Control-Allow-Origin, Origin, X-Requested-With, Content-Type, Accept",
//       "X-Password-Expired",
//     ],
//     optionsSuccessStatus: 200,
//   })
// );
app.use(cors());
app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

// app.get('/:room', (req, res) => {
//   res.render('room', { roomId: req.params.room })
// })

var numClients = {};
io.on("connection", (socket) => {
  console.log("Connected");
  socket.on("join-room", (roomId, userId) => {
    console.log(numClients);
    if (numClients[roomId] == undefined) {
      numClients[roomId] = 1;
    } else {
      numClients[roomId]++;
    }
    if (numClients[roomId] < 3) {
      socket.join(roomId);
      socket.to(roomId).broadcast.emit("player-connected", userId);
    }
    socket.on("game-ready", (user, playerType, nbOfPlayers) => {
      socket
        .to(roomId)
        .broadcast.emit("game-ready", user, playerType, nbOfPlayers);
    });

    socket.on("turn-end", (nextTornadoCoordinates, tornadoDeciser) => {
      console.log("turn");
      socket
        .to(roomId)
        .emit("turn-end", nextTornadoCoordinates, tornadoDeciser);
    });

    socket.on("action-done", (grid, playerX, playerY) => {
      console.log("action done");
      socket.to(roomId).emit("action-done", grid, playerX, playerY);
    });

    socket.on("leave-room", () => {
      socket.to(roomId).broadcast.emit("player-disconnected", userId);
      if (numClients[roomId]) numClients[roomId]--;
    });
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("player-disconnected", userId);
      if (numClients[roomId]) numClients[roomId]--;
    });
  });
});

var server_port = process.env.YOUR_PORT || process.env.PORT || 5000;
server.listen(server_port, () => {
  console.log("Started on : " + server_port);
});
