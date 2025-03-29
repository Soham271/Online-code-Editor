import { io } from "socket.io-client";


export const initSocket = async () => {
  const options = {
    "force new connection": true,
    reconnectionAttempts: "Infinity",
    timeout: 10000,
    transports: ["websocket"],
  };

  
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  console.log("Connecting to:", backendURL);

  if (!backendURL) {
    console.error(
      "❌ VITE_BACKEND_URL is undefined! Check your .env file and restart the server."
    );
    return null;
  }


  const socket = io(backendURL, options);

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Connection failed:", err.message);
  });

  return socket;
};
