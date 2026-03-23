import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [candidateLink, setCandidateLink] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (role === 'candidate') {
      // Decode JWT roughly to check if there's a slug
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.slug) {
          navigate(`/room/${payload.slug}`);
          return;
        }
      } catch (e) {
        // Ignore
      }
    } else {
      fetchRooms();
    }
  }, [token, role, navigate]);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get('/api/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(data);
    } catch (err) {
      setError('Failed to fetch rooms');
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  const createRoom = async () => {
    try {
      const { data } = await axios.post('/api/rooms', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/room/${data.slug}`);
    } catch (err) {
      setError('Failed to create room');
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (candidateLink) {
      let slug = candidateLink;
      if (candidateLink.includes('/room/')) {
        slug = candidateLink.split('/room/')[1];
      }
      navigate(`/room/${slug}`);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (role === 'candidate') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 shadow-md rounded-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Join Interview</h2>
          <form onSubmit={handleJoin}>
            <input
              type="text"
              placeholder="Enter room link or slug"
              className="w-full border p-2 mb-4 rounded"
              value={candidateLink}
              onChange={(e) => setCandidateLink(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              Go to Room
            </button>
          </form>
          <button onClick={logout} className="mt-4 text-sm text-gray-500 hover:text-gray-800 w-full text-center">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Interviewer Dashboard</h1>
        <button onClick={logout} className="text-gray-600 hover:text-gray-900">Logout</button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}

      <button
        onClick={createRoom}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 mb-8"
      >
        Create New Room
      </button>

      <h2 className="text-xl font-semibold mb-4">Your Rooms</h2>
      {rooms.length === 0 ? (
        <p className="text-gray-500">No rooms created yet.</p>
      ) : (
        <div className="space-y-4">
          {rooms.map(room => (
            <div key={room.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <p className="font-medium">Room: {room.slug}</p>
                <p className="text-sm text-gray-500">Status: {room.status}</p>
                <p className="text-xs text-gray-400">Created: {new Date(room.created_at).toLocaleString()}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/room/${room.slug}`);
                    alert('Link copied!');
                  }}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => navigate(`/room/${room.slug}`)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
