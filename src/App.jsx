import React, { useState } from 'react';
import JoinRoom from './components/JoinRoom';
import Room from './components/Room';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userData, setUserData] = useState(null);

  const handleJoinRoom = (name, roomId, isHost) => {
    setUserData({ name, isHost });
    setCurrentRoom(roomId);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setUserData(null);
  };

  return (
    <div className="App">
      {!currentRoom ? (
        <JoinRoom onJoinRoom={handleJoinRoom} />
      ) : (
        <Room
          roomId={currentRoom}
          userName={userData.name}
          isHost={userData.isHost}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;
