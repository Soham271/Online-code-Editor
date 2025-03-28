import React, { useState } from "react";
import logo from "../assets/code-sync.png";
import Client from "../component/Client";
import Editor from "../component/Editor";

const EditorPage = () => {
  const [clients, setClients] = useState([
    {
      socketId: "1",
      username: "John Doe",
    },
    {
      socketId: "2",
      username: "Jane Doe",
    },
    {
      socketId: "3",
      username: "Jack Doe",
    },
    {
      socketId: "4",
      username: "Jill Doe",
    },
  ]);

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img src={logo} alt="code-sync-logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn">Copy ROOM ID</button>
        <button className="btn leaveBtn">Leave</button>
      </div>

      <div className="editorWrap">
        <Editor />
      </div>
    </div>
  );
};

export default EditorPage;
