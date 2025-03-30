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
        editorRef.current.markClean();
      }

      editorRef.current.on(
        "change",
        debounce((instance, changes) => {
          if (isCodeChangedFromSocket.current) {
            isCodeChangedFromSocket.current = false;
            return;
          }

          const code = instance.getValue();
          onCodeChange(code);

          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
            language,
          });
        }, 1000000)
      );
    };

    init();

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
      }
    };
  }, [language, initialCode]);

  useEffect(() => {
    if (socketRef.current) {
      const handleCodeChange = ({ code, lang }) => {
        if (lang !== language || !editorRef.current) return;

        const currentCode = editorRef.current.getValue();
        if (code === currentCode) return;

        isCodeChangedFromSocket.current = true;

       
        const cursor = editorRef.current.getCursor();
        const selections = editorRef.current.listSelections();

        editorRef.current.setValue(code);

        
        editorRef.current.setCursor(cursor);
        editorRef.current.setSelections(selections);
      };

      socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

      return () => {
        socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
      };
    }
  }, [socketRef.current, language]);

  return <textarea id={`realtimeEditor-${language}`} />;
};

export default Editor;
