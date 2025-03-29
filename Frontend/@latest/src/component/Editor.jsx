import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror/lib/codemirror.js";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/edit/matchbrackets.js";
import "codemirror/addon/edit/closetag.js";
import "codemirror/theme/shadowfox.css";
import ACTIONS from "../Actions.js";

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null); // Holds CodeMirror instance
  const socketInstance = useRef(null); // To hold socket instance for cleanup

  useEffect(() => {
    async function init() {
      // ✅ Initialize CodeMirror
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "shadowfox",
          autoCloseTags: true,
          lineNumbers: true,
          lineWrapping: true,
          autoCloseBrackets: true,
          matchBrackets: true,
        }
      );

      // ✅ Listen for changes and emit code change
      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();

        // ✅ Emit only if not from 'setValue' (avoid infinite loops)
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
          onCodeChange(code);
        }
      });
    }

    init();

    // ✅ Clean up CodeMirror on component unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
      }
    };
  }, []); // ✅ Empty dependency to run once on mount

  // ✅ Handle incoming code changes
  useEffect(() => {
    if (socketRef.current) {
      socketInstance.current = socketRef.current;

      // ✅ Listen for incoming code changes from other users
      const handleCodeChange = ({ code }) => {
        if (code !== null && code !== editorRef.current.getValue()) {
          editorRef.current.setValue(code);
        }
      };

      socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

      // ✅ Clean up event listeners on unmount
      return () => {
        if (socketInstance.current) {
          socketInstance.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
        }
      };
    }
  }, [socketRef.current]); // ✅ Correct dependency to prevent stale closures

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
