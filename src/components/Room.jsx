import React, { useState, useEffect } from 'react';
import { LogOut, Users, Crown, Copy, Check } from 'lucide-react';
import { ref, set, onValue, remove, onDisconnect } from 'firebase/database';
import { database } from '../config/firebase';
import MusicPlayer from './MusicPlayer';
import Chat from './Chat';

const Room = ({ roomId, userName, isHost, onLeaveRoom }) => {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Copy room code to clipboard
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const userRef = ref(database, `rooms/${roomId}/users/${userName}`);
    const usersRef = ref(database, `rooms/${roomId}/users`);
    const roomRef = ref(database, `rooms/${roomId}`);

    // Add user to room
    const userData = {
      name: userName,
      isHost,
      joinedAt: Date.now()
    };
    
    console.log('Adding user to room:', userData);
    
    set(userRef, userData)
      .then(() => {
        console.log('User added successfully');
        setConnectionStatus('connected');
      })
      .catch(error => {
        console.error('Error adding user:', error);
        setConnectionStatus('error');
      });

    // Set up automatic cleanup when user disconnects
    onDisconnect(userRef).remove();

    // Listen for connected users
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Users data received:', data);
      
      if (data) {
        const usersList = Object.values(data);
        setConnectedUsers(usersList);
        setConnectionStatus('connected');
      } else {
        setConnectedUsers([]);
        console.log(`Room ${roomId} is empty, deleting...`);
        setTimeout(() => {
          remove(roomRef).catch(err => {
            console.log('Room deletion error (normal):', err.message);
          });
        }, 1000);
      }
    }, (error) => {
      console.error('Users sync error:', error);
      setConnectionStatus('error');
    });

    return () => {
      unsubscribe();
      remove(userRef).catch(err => {
        console.log('User removal error:', err.message);
      });
    };
  }, [roomId, userName, isHost]);

  // Handle manual leave with simplified cleanup
  const handleLeaveRoom = () => {
    const userRef = ref(database, `rooms/${roomId}/users/${userName}`);
    
    console.log(`${userName} is leaving room ${roomId}`);
    
    remove(userRef).then(() => {
      console.log(`User ${userName} removed from room`);
      onLeaveRoom();
    }).catch(err => {
      console.log('Leave room error:', err.message);
      onLeaveRoom(); // Still leave the UI
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-6 mb-6 shadow-3d">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-white">Room</h1>
                <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-1 rounded-lg">
                  <span className="text-xl font-mono text-purple-300">{roomId}</span>
                  <button
                    onClick={copyRoomCode}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    title="Copy room code"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-gray-300">
                {/* Connection Status */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-400' : 
                    connectionStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                  }`}></div>
                  <span className="text-sm">
                    {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{connectedUsers.length} connected</span>
                </div>
                {isHost && (
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <Crown className="w-4 h-4" />
                    <span>Host</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={handleLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl btn-3d transition-all flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave</span>
            </button>
          </div>

          {/* Room Code Sharing */}
          {isHost && (
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium mb-1">Share Room Code</h3>
                  <p className="text-sm text-gray-300">Ask friends to join using: <span className="font-mono text-purple-300">{roomId}</span></p>
                </div>
                <button
                  onClick={copyRoomCode}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg btn-3d transition-all flex items-center space-x-2 text-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Auto-cleanup info */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-300">
              🗑️ Room automatically cleans up when empty
            </p>
          </div>

          {/* Connected Users */}
          <div className="flex flex-wrap gap-2">
            {connectedUsers.map((user, index) => (
              <div
                key={index}
                className="bg-gray-800/50 px-3 py-1 rounded-full text-sm text-gray-300 flex items-center space-x-1"
              >
                {user.isHost && <Crown className="w-3 h-3 text-yellow-400" />}
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          <MusicPlayer 
            roomId={roomId} 
            isHost={isHost} 
            userName={userName} 
          />
          <Chat 
            roomId={roomId} 
            userName={userName} 
          />
        </div>
      </div>
    </div>
  );
};

export default Room;
