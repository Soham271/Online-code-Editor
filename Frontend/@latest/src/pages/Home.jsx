import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import logo from "../assets/code-sync.png";

const Home = () => {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("Created a new room");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("ROOM ID & username is required");
      return;
    }

    // Redirect to Editor Page
    navigate(`/editor/${roomId}`, {
      state: {
        username,
      },
    });
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="homePageWrapper">
      {/* Background Animation */}
      <div className="animatedBackground"></div>

      <div className="formWrapper">
        <img className="homePageLogo" src={logo} alt="code-sync-logo" />
        <h4 className="mainLabel">Paste invitation ROOM ID</h4>

        <div className="inputGroup">
          <input
            type="text"
            className="inputBox"
            placeholder="ROOM ID"
            onChange={(e) => setRoomId(e.target.value)}
            value={roomId}
            onKeyUp={handleInputEnter}
          />

          <input
            type="text"
            className="inputBox"
            placeholder="USERNAME"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            onKeyUp={handleInputEnter}
          />

          <button className="btn joinBtn" onClick={joinRoom}>
            Join
          </button>

          <div className="createInfo">
            If you don't have an invite then create &nbsp;
            <a onClick={createNewRoom} href="#" className="createNewBtn">
              new room
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <h4>
          Built with 💛 &nbsp; by &nbsp;
          <a
            href="https://github.com/Soham271"
            target="_blank"
            rel="noreferrer"
          >
            Soham N Patil
          </a>
        </h4>
      </footer>
    </div>
  );
};

export default Home;
