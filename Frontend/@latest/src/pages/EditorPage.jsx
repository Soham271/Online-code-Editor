import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../Actions.js";
import Client from "../component/Client.jsx";
import Editor from "../component/Editor.jsx";
import { initSocket } from "../Socket.js";
import logo from "../assets/code-sync.png";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(""); // ✅ Holds the latest code
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (socketRef.current) return; // ✅ Prevent duplicate socket connections
      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("❌ Socket error:", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      if (!location.state?.username) {
        toast.error("Username not found! Redirecting...");
        reactNavigator("/");
        return;
      }

      const username = location.state.username;

      console.log(`🚀 Joining room: ${roomId} as "${username}"`);

      // ✅ Emit JOIN only once
      socketRef.current.emit(ACTIONS.JOIN, { roomId, username });

      // ✅ Handle JOINED event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          console.log(`👤 ${username} joined with socket ID: ${socketId}`);
          if (username !== location.state.username) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);

          // ✅ Send latest code to newly joined client
          if (socketId !== socketRef.current.id) {
            console.log("📝 Sending latest code to new client...");
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
              code: codeRef.current,
              socketId,
            });
          }
        }
      );

      // ✅ Handle disconnection
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        console.log(`❌ ${username} disconnected`);
        toast.success(`${username} left the room.`);
        setClients((prev) =>
          prev.filter((client) => client.socketId !== socketId)
        );
      });
    };

    init();

    // ✅ Clean up on unmount
    return () => {
      if (socketRef.current) {
        console.log("🔴 Disconnecting socket...");
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current = null;
      }
    };
  }, []);

  async function copyRoomId() {
    console.log("copy room id", roomId);
    if (!roomId) {
      toast.error("Room ID is undefined.");
      return;
    }
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied!");
    } catch (err) {
      toast.error("Could not copy Room ID.");
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) return <Navigate to="/" />;

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src={logo} alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy ROOM ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
      </div>
      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code; // ✅ Keep track of the latest code
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;
