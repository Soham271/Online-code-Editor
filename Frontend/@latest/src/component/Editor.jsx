import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror/lib/codemirror.js";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/mode/htmlmixed/htmlmixed.js";
import "codemirror/mode/css/css.js";
import "codemirror/mode/python/python.js";
import "codemirror/mode/xml/xml.js";
import "codemirror/mode/clike/clike.js";
import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/edit/matchbrackets.js";
import "codemirror/addon/edit/closetag.js";
import "codemirror/theme/shadowfox.css";
import { debounce } from "lodash";
import ACTIONS from "../Actions.js";

const Editor = ({ socketRef, roomId, language, onCodeChange, initialCode }) => {
  const editorRef = useRef(null);
  const isCodeChangedFromSocket = useRef(false);
  const lastCursor = useRef(null);


  const languageModes = {
    javascript: { name: "javascript", json: true },
    html: "htmlmixed",
    css: "css",
    python: "python",
    xml: "xml",
    c: "text/x-csrc",
    "C++": "text/x-c++src",
    java: "text/x-java",
  };


  useEffect(() => {
    const init = () => {
      if (!document.getElementById(`realtimeEditor-${language}`)) return;

      if (editorRef.current) {
        editorRef.current.toTextArea(); 
      }

      editorRef.current = Codemirror.fromTextArea(
        document.getElementById(`realtimeEditor-${language}`),
        {
          mode: languageModes[language] || "javascript",
          theme: "shadowfox",
          autoCloseTags: true,
          lineNumbers: true,
          lineWrapping: true,
          autoCloseBrackets: true,
          matchBrackets: true,
        }
      );

   
      if (initialCode) {
        editorRef.current.setValue(initialCode);
      }

   
      editorRef.current.on("beforeChange", (instance) => {
        lastCursor.current = instance.getCursor();
      });

      
      editorRef.current.on(
        "change",
        debounce((instance) => {
          if (isCodeChangedFromSocket.current) {
            isCodeChangedFromSocket.current = false;
            return;
          }

          const code = instance.getValue();
          onCodeChange(code);

          if (socketRef.current) {
            socketRef.current.emit(ACTIONS.CODE_CHANGE, {
              roomId,
              code,
              language,
            });
          }
        }, 50) 
      );
    };

    init();

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
      }
    };
  }, [language, initialCode, socketRef, roomId, onCodeChange]);

  // Listen for socket changes to update the editor
  useEffect(() => {
    if (!socketRef.current || !editorRef.current) return;

    const handleCodeChange = ({ code, lang }) => {
      if (lang !== language || !editorRef.current) return;

      const currentCode = editorRef.current.getValue();
      if (code === currentCode) return;

      isCodeChangedFromSocket.current = true;

      
      const cursor = editorRef.current.getCursor();
      const selections = editorRef.current.listSelections();
      const scrollInfo = editorRef.current.getScrollInfo();

     
      editorRef.current.setValue(code);

     
      editorRef.current.setCursor(cursor);
      editorRef.current.setSelections(selections);
      editorRef.current.scrollTo(scrollInfo.left, scrollInfo.top);
    };

    
    socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

 
    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
      }
    };
  }, [language, roomId]);

  return <textarea id={`realtimeEditor-${language}`} />;
};

export default Editor;
