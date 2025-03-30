import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";
import Client from "../component/Client";
import Editor from "../component/Editor";
import { initSocket } from "../Socket";
import logo from "../assets/code-sync.png";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";

const EditorPage = () => {
  const socketRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState("javascript");
  const [codes, setCodes] = useState({}); // { language: code }
  const [activeLanguages, setActiveLanguages] = useState(["javascript"]);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", (err) => {
        console.error("Socket error:", err);
        toast.error("Socket connection failed");
        reactNavigator("/");
      });

      socketRef.current.on("connect_failed", (err) => {
        console.error("Socket connection failed:", err);
        toast.error("Socket connection failed");
        reactNavigator("/");
      });

      if (!location.state?.username) {
        reactNavigator("/");
        return;
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state.username,
        language,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state.username) {
            toast.success(`${username} joined the room`);
          }
          setClients(clients);

          if (socketId !== socketRef.current.id) {
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
              socketId,
              language,
            });
          }
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) =>
          prev.filter((client) => client.socketId !== socketId)
        );
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, []);

  const handleCodeChange = (language) => (code) => {
    setCodes((prev) => ({ ...prev, [language]: code }));
  };

  const handleLanguageChange = (newLanguage) => {
    if (!activeLanguages.includes(newLanguage)) {
      setActiveLanguages((prev) => [...prev, newLanguage]);
    }
    setLanguage(newLanguage);
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard");
    } catch (err) {
      toast.error("Could not copy Room ID");
    }
  };

  const leaveRoom = () => {
    reactNavigator("/");
  };

  if (!location.state) return <Navigate to="/" />;

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src={logo} alt="logo" />
          </div>

          <div className="languageSelector">
            <label>Language: </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="languageDropdown"
            >
              <option value="javascript">JavaScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="python">Python</option>
              <option value="xml">XML</option>
              <option value="c">C</option>
              <option value="C++">C++</option>
              <option value="java">Java</option>
            </select>
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
        {activeLanguages.map((lang) => (
          <div
            key={lang}
            style={{ display: lang === language ? "block" : "none" }}
          >
            <Editor
              socketRef={socketRef}
              roomId={roomId}
              language={lang}
              onCodeChange={handleCodeChange(lang)}
              initialCode={codes[lang] || ""}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditorPage;
