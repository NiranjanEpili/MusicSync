import React, { useState } from 'react';
import { Music, Users, ArrowRight, Plus, Hash } from 'lucide-react';

const JoinRoom = ({ onJoinRoom }) => {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState('join'); // 'create' or 'join'

  // Generate unique 6-digit room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (name.trim()) {
      const newRoomId = generateRoomCode();
      onJoinRoom(name.trim(), newRoomId, true); // isHost = true
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (name.trim() && roomId.trim()) {
      onJoinRoom(name.trim(), roomId.trim().toUpperCase(), false); // isHost = false
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="glass-effect rounded-3xl p-8 w-full max-w-md shadow-3d animate-float">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full shadow-glow">
              <Music className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MusicSync</h1>
          <p className="text-gray-300">Sync music in real-time with friends</p>
        </div>

        {/* Mode Selection */}
        <div className="flex bg-gray-800/30 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
              mode === 'create'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Room</span>
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
              mode === 'join'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>Join Room</span>
          </button>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Enter your name"
            required
          />
        </div>

        {/* Create Room Form */}
        {mode === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-6">
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Create New Room</span>
              </div>
              <p className="text-xs text-gray-400">
                A unique room code will be generated automatically. Share it with friends to let them join!
              </p>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold btn-3d hover:shadow-glow transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          </form>
        )}

        {/* Join Room Form */}
        {mode === 'join' && (
          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all uppercase"
                placeholder="Enter room code (e.g., ABC123)"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !roomId.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold btn-3d hover:shadow-glow transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Join Room</span>
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            {mode === 'create' 
              ? 'Create a room and become the host to control music playback'
              : 'Ask your friend for the room code to join their music session'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
