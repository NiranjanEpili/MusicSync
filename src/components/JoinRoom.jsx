import React, { useState, useEffect } from 'react';
import { Music, Users, ArrowRight, Plus, Hash, Download, X } from 'lucide-react';

const JoinRoom = ({ onJoinRoom }) => {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState('join');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile and PWA install is available
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    
    // Check for PWA install prompt
    const handleInstallPrompt = () => {
      if (window.deferredPrompt) {
        setShowInstallPrompt(true);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  // Generate unique 6-digit room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Handle PWA install
  const handleInstall = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      window.deferredPrompt = null;
    }
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (name.trim()) {
      const newRoomId = generateRoomCode();
      onJoinRoom(name.trim(), newRoomId, true);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (name.trim() && roomId.trim()) {
      onJoinRoom(name.trim(), roomId.trim().toUpperCase(), false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center safe-area-inset">
      <div className="container">
        <div className="flex justify-center">
          <div className="glass-effect rounded-3xl p-6 sm:p-8 w-full max-w-md mx-4 shadow-3d">
            
            {/* PWA Install Banner */}
            {showInstallPrompt && isMobile && (
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-3 mb-6 relative">
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Install MusicSync</p>
                    <p className="text-xs text-gray-300">Add to home screen for better experience</p>
                  </div>
                  <button
                    onClick={handleInstall}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs btn-3d transition-all"
                  >
                    Install
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 sm:p-4 rounded-full shadow-glow">
                  <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">MusicSync</h1>
              <p className="text-sm sm:text-base text-gray-300 px-4">
                Sync music in real-time with friends across all devices
              </p>
            </div>

            {/* Mode Selection */}
            <div className="flex bg-gray-800/30 rounded-xl p-1 mb-6">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 text-sm sm:text-base ${
                  mode === 'create'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">Create Room</span>
                <span className="xs:hidden">Create</span>
              </button>
              <button
                onClick={() => setMode('join')}
                className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 text-sm sm:text-base ${
                  mode === 'join'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span className="hidden xs:inline">Join Room</span>
                <span className="xs:hidden">Join</span>
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
                maxLength={20}
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
                    A unique room code will be generated automatically. Share it with friends!
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 sm:py-4 px-6 rounded-xl font-semibold btn-3d hover:shadow-glow transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
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
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all uppercase font-mono tracking-wider text-center sm:text-left"
                    placeholder="ABC123"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1 text-center sm:text-left">
                    Enter the 6-character room code
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!name.trim() || !roomId.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-6 rounded-xl font-semibold btn-3d hover:shadow-glow transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Join Room</span>
                </button>
              </form>
            )}

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 leading-relaxed">
                {mode === 'create' 
                  ? 'Create a room and become the host to control music playback'
                  : 'Ask your friend for the room code to join their music session'
                }
              </p>
            </div>

            {/* Device Support Info */}
            {isMobile && (
              <div className="mt-4 bg-blue-600/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs text-blue-300 text-center">
                  📱 Optimized for mobile • Works on iOS, Android & Desktop
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
