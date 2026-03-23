import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';

export default function CodeEditor({ code, language, onChange }) {
  const [internalCode, setInternalCode] = useState(code);

  useEffect(() => {
    setInternalCode(code);
  }, [code]);

  const handleChange = (value) => {
    setInternalCode(value);
    onChange(value);
  };

  const extensions = [
    language === 'python' ? python() : javascript({ jsx: true }),
    EditorView.lineWrapping
  ];

  return (
    <div className="h-full w-full">
      <CodeMirror
        value={internalCode}
        height="100%"
        extensions={extensions}
        onChange={handleChange}
        theme="light"
        className="h-full border-r border-gray-200"
      />
    </div>
  );
}
