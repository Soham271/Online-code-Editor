import express from "express";
import http from "http";
import { Server } from "socket.io";
import ACTIONS from "./src/Actions.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {}; 
const usernameSocketMap = {}; 
const roomCodeMap = {};

function getAllConnectedClients(roomId) {
  const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
  return clientsInRoom
    .map((socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    }))
    .filter((client) => client.username !== undefined);
}

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username, language }) => {
    console.log(`👤 "${username}" is trying to join room ${roomId}`);

    const existingSocketId = usernameSocketMap[username];
    if (existingSocketId) {
      console.log(`🔄 "${username}" is reconnecting with new socket ID`);
      delete userSocketMap[existingSocketId];
      socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: existingSocketId,
        username: username,
      });
    }

    userSocketMap[socket.id] = username;
    usernameSocketMap[username] = socket.id;
    socket.join(roomId);

    if (!roomCodeMap[roomId]) {
      roomCodeMap[roomId] = {}; // Initialize code map for the room
    }

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code, language }) => {
    if (!roomCodeMap[roomId]) roomCodeMap[roomId] = {};
    roomCodeMap[roomId][language] = code; // Store code for this language
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code, language });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, language }) => {
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id);
    const code = roomCodeMap[roomId]?.[language] || "";
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code, language });
  });

  socket.on("disconnecting", () => {
    const username = userSocketMap[socket.id];
    if (username && usernameSocketMap[username] === socket.id) {
      delete usernameSocketMap[username];
    }

    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: username,
        });
      }
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
