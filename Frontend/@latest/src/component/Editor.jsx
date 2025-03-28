import React, { useEffect } from "react";
import Codemirror from "codemirror/lib/codemirror.js";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/edit/matchbrackets.js";
import "codemirror/addon/edit/closetag.js";
import "codemirror/theme/shadowfox.css";

const Editor = () => {
  useEffect(() => {
    async function init() {
      Codemirror.fromTextArea(document.getElementById("realtimeEditor"), {
        mode: { name: "javascript", json: true },
        theme: "shadowfox",
        autoCloseTags: true,
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
      });
    }
    init(); // Call the init function
  }, []);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
