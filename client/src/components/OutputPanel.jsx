import React from 'react';

export default function OutputPanel({ result }) {
  if (!result) return <div className="text-gray-500 italic">No output yet. Run your code to see results.</div>;

  return (
    <div className="flex flex-col h-full font-mono text-sm">
      <div className="flex justify-between border-b border-gray-700 pb-2 mb-2">
        <span className="font-bold text-gray-300">Execution Result</span>
        {result.exitCode !== null && (
          <span className={`px-2 py-1 rounded text-xs font-bold ${result.exitCode === 0 ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
            Exit Code: {result.exitCode}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {result.stdout && (
          <div>
            <h4 className="text-gray-400 font-semibold mb-1 uppercase text-xs">Stdout</h4>
            <pre className="text-green-400 whitespace-pre-wrap">{result.stdout}</pre>
          </div>
        )}

        {result.stderr && (
          <div>
            <h4 className="text-gray-400 font-semibold mb-1 uppercase text-xs">Stderr / Errors</h4>
            <pre className="text-red-400 whitespace-pre-wrap">{result.stderr}</pre>
          </div>
        )}

        {!result.stdout && !result.stderr && (
          <div className="text-gray-500 italic">Program exited with no output.</div>
        )}
      </div>
    </div>
  );
}
