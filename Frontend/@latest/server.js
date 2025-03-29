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

const userSocketMap = {}; // Maps socketId -> username
const usernameSocketMap = {}; // Maps username -> socketId

// Get all connected clients in the room - FIXED to filter out undefined usernames
function getAllConnectedClients(roomId) {
  // Get all socket IDs in the room
  const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

  // Map to objects with socketId and username, filtering out any undefined usernames
  return clientsInRoom
    .map((socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    }))
    .filter((client) => client.username !== undefined); // Filter out sockets with no username
}

// Handle socket connections
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    console.log(`👤 "${username}" is trying to join room ${roomId}`);

    // Check if username is already in a room
    const existingSocketId = usernameSocketMap[username];
    if (existingSocketId) {
      console.log(`🔄 "${username}" is reconnecting with new socket ID`);

      // Remove the old socket association
      delete userSocketMap[existingSocketId];

      // Notify room that the user with old socket ID has disconnected
      socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: existingSocketId,
        username: username,
      });
    }

    // Update both maps with new socket information
    userSocketMap[socket.id] = username;
    usernameSocketMap[username] = socket.id;

    // Join the room
    socket.join(roomId);

    // Get updated list of clients and notify everyone
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // Handle code change event
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // Handle code sync event
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // Handle disconnection
  socket.on("disconnecting", () => {
    const username = userSocketMap[socket.id];

    // Clean up only if this is the current socket for this username
    if (username && usernameSocketMap[username] === socket.id) {
      delete usernameSocketMap[username];
    }

    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        // Skip the default room
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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
