import express from "express";
import http from "http";
import { Server } from "socket.io";
import ACTIONS from "./src/Actions.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development; restrict in production
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {}; // Maps socketId -> username
const usernameSocketMap = {}; // Maps username -> socketId
const roomCodeMap = {}; // Maps roomId -> { language: code }

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
    console.log(`👤 "${username}" joined room ${roomId}`);

    const existingSocketId = usernameSocketMap[username];
    if (existingSocketId) {
      console.log(`🔄 "${username}" reconnected with new socket ID`);
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
      roomCodeMap[roomId] = {};
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
    roomCodeMap[roomId][language] = code;
    socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code, language });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, language }) => {
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id) || "";
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
        socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: username,
        });
      }
    });

    delete userSocketMap[socket.id];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
