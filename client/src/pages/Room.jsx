import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { initiateSocketConnection, disconnectSocket, getSocket } from '../socket';
import CodeEditor from '../components/CodeEditor';
import VideoPanel from '../components/VideoPanel';
import QuestionPanel from '../components/QuestionPanel';
import OutputPanel from '../components/OutputPanel';

export default function Room() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [guestName, setGuestName] = useState('');

  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [roomEnded, setRoomEnded] = useState(false);

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [runResult, setRunResult] = useState(null);
  const [notes, setNotes] = useState('');

  // 1. Check Auth / Guest Login
  useEffect(() => {
    if (!token) {
      // Guest mode
    } else {
      checkRoomStatus();
    }
  }, [token, slug]);

  const checkRoomStatus = async () => {
    try {
      const res = await axios.get(`/api/rooms/${slug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'ended') {
        setRoomEnded(true);
      } else {
        setRoomData(res.data);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setToken(null);
      }
    }
  };

  const handleGuestJoin = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    try {
      const { data } = await axios.post('/api/auth/guest', { name: guestName, slug });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      setToken(data.token);
      setRole(data.role);
    } catch (err) {
      alert('Failed to join as guest');
    }
  };

  // 2. Socket Connection
  useEffect(() => {
    if (!token || roomEnded) return;

    const socket = initiateSocketConnection(token);

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', { slug });
    });

    socket.on('room_joined', (data) => {
      setCode(data.code);
      setLanguage(data.language);
      setParticipants(data.participants);
    });

    socket.on('participant_join', (id) => {
      setParticipants((prev) => [...new Set([...prev, id])]);
    });

    socket.on('participant_leave', (id) => {
      setParticipants((prev) => prev.filter(p => p !== id));
    });

    socket.on('code_update', (newCode) => {
      setCode(newCode);
    });

    socket.on('language_update', (newLang) => {
      setLanguage(newLang);
    });

    socket.on('run_result', (result) => {
      setRunResult(result);
    });

    socket.on('room_ended', () => {
      setRoomEnded(true);
      disconnectSocket();
    });

    socket.on('error', (msg) => {
      alert(msg);
      if (msg === 'Room not found') {
        navigate('/dashboard');
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [token, slug, roomEnded]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    const socket = getSocket();
    if (socket) {
      socket.emit('code_change', { code: newCode });
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const socket = getSocket();
    if (socket) {
      socket.emit('language_change', { language: newLang });
    }
  };

  const runCode = () => {
    setRunResult({ stdout: 'Running...', stderr: '', exitCode: null });
    const socket = getSocket();
    if (socket) {
      socket.emit('run_code');
    }
  };

  const endSession = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('end_session', { notes });
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 shadow-md rounded-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Join Room</h2>
          <form onSubmit={handleGuestJoin}>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full border p-2 mb-4 rounded"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              Join as Candidate
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (roomEnded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-center">
        <div className="bg-white p-8 shadow-md rounded-md">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">This session has ended</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Connecting to room...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Left Column: Video & Questions */}
      <div className="w-1/3 flex flex-col border-r border-gray-300">
        <div className="h-1/2 p-2 bg-black border-b border-gray-300">
           <VideoPanel participants={participants} role={role} />
        </div>
        <div className="flex-1 p-4 overflow-y-auto bg-white flex flex-col">
           <QuestionPanel role={role} token={token} />

           {role === 'interviewer' && (
             <div className="mt-4 flex flex-col flex-1">
               <h3 className="font-semibold mb-2">Private Notes</h3>
               <textarea
                 className="w-full border p-2 flex-1 rounded resize-none mb-4"
                 placeholder="Type notes here..."
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
               ></textarea>
               <button
                 onClick={endSession}
                 className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold"
               >
                 End Session
               </button>
             </div>
           )}
        </div>
      </div>

      {/* Right Column: Code Editor & Output */}
      <div className="w-2/3 flex flex-col">
        {/* Editor Toolbar */}
        <div className="h-12 bg-white border-b border-gray-300 flex items-center px-4 justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-semibold">Language:</span>
            <select
              value={language}
              onChange={handleLanguageChange}
              className="border border-gray-300 rounded p-1"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
             <span className="text-sm text-gray-500">
               {participants.length} Participant(s)
             </span>
             <button
               onClick={runCode}
               className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 font-semibold"
             >
               Run Code
             </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <CodeEditor code={code} language={language} onChange={handleCodeChange} />
        </div>

        {/* Output Panel */}
        <div className="h-48 bg-gray-900 text-white p-4 border-t border-gray-700 overflow-y-auto font-mono">
          <OutputPanel result={runResult} />
        </div>
      </div>
    </div>
  );
}
