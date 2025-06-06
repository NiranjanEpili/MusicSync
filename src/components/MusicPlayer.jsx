import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, Link, Music } from 'lucide-react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import YouTube from 'react-youtube';

const MusicPlayer = ({ roomId, isHost, userName }) => {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');

  // Extract video ID from YouTube URL
  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    const musicRef = ref(database, `rooms/${roomId}/music`);
    
    const unsubscribe = onValue(musicRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('Music data received:', data);
        
        // Update video if different
        if (data.videoId && data.videoId !== videoId) {
          console.log('Setting new video:', data.videoId);
          setVideoId(data.videoId);
          setVideoTitle(data.videoTitle || 'YouTube Video');
        }
        
        // Sync playback state for non-hosts
        if (!isHost && playerRef.current) {
          if (data.isPlaying !== isPlaying) {
            console.log('Syncing play state:', data.isPlaying);
            setIsPlaying(data.isPlaying);
            
            if (data.isPlaying) {
              playerRef.current.playVideo();
              if (data.currentTime) {
                playerRef.current.seekTo(data.currentTime, true);
              }
            } else {
              playerRef.current.pauseVideo();
            }
          }
          
          // Sync time if there's a significant difference
          if (data.currentTime && Math.abs(data.currentTime - currentTime) > 2) {
            console.log('Syncing time:', data.currentTime);
            playerRef.current.seekTo(data.currentTime, true);
            setCurrentTime(data.currentTime);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, isHost, videoId, isPlaying, currentTime]);

  const syncMusicState = useCallback((vId = videoId, vTitle = videoTitle) => {
    if (isHost && roomId) {
      const musicRef = ref(database, `rooms/${roomId}/music`);
      const currentTimeValue = playerRef.current ? playerRef.current.getCurrentTime() : 0;
      
      const musicData = {
        isPlaying,
        currentTime: currentTimeValue,
        videoId: vId,
        videoTitle: vTitle,
        lastUpdated: Date.now(),
        updatedBy: userName
      };
      
      console.log('Syncing music state:', musicData);
      
      set(musicRef, musicData).catch(error => {
        console.error('Error syncing music state:', error);
      });
    }
  }, [isHost, roomId, isPlaying, videoId, videoTitle, userName]);

  const togglePlay = () => {
    if (isHost && playerRef.current) {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      
      if (newIsPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
      
      setTimeout(() => syncMusicState(), 100);
    }
  };

  const handleYouTubeLink = (e) => {
    e.preventDefault();
    if (youtubeLink.trim() && isHost) {
      const vId = extractVideoId(youtubeLink.trim());
      if (vId) {
        console.log('Loading new video:', vId);
        setVideoId(vId);
        setVideoTitle('YouTube Video');
        setYoutubeLink('');
        setIsPlaying(false);
        setTimeout(() => syncMusicState(vId, 'YouTube Video'), 1000);
      } else {
        alert('Please enter a valid YouTube URL');
      }
    }
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    event.target.setVolume(volume);
    
    // If host, sync the current state
    if (isHost) {
      setTimeout(() => syncMusicState(), 1000);
    }
  };

  const onStateChange = (event) => {
    if (isHost) {
      const playerState = event.data;
      const newIsPlaying = playerState === 1; // 1 = playing
      
      console.log('Player state changed:', playerState, 'isPlaying:', newIsPlaying);
      
      if (newIsPlaying !== isPlaying) {
        setIsPlaying(newIsPlaying);
        setTimeout(() => syncMusicState(), 500);
      }
    }
  };

  const onPlayerError = (event) => {
    console.log('YouTube Player Error:', event.data);
    // Handle different error types
    switch (event.data) {
      case 2:
        console.log('Invalid video ID');
        break;
      case 5:
        console.log('HTML5 player error');
        break;
      case 100:
        console.log('Video not found');
        break;
      case 101:
      case 150:
        console.log('Video not available in embedded players');
        break;
      default:
        console.log('Unknown player error');
    }
  };

  const updateTime = useCallback(() => {
    if (playerRef.current && isHost) {
      const time = playerRef.current.getCurrentTime();
      setCurrentTime(time);
      
      // Sync every 5 seconds
      if (Math.floor(time) % 5 === 0) {
        syncMusicState();
      }
    }
  }, [isHost, syncMusicState]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [updateTime]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
  };

  return (
    <div className="glass-effect rounded-2xl p-6 shadow-3d">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center space-x-2">
          <Music className="w-5 h-5" />
          <span>YouTube Music Player</span>
        </h3>
        {isHost && (
          <p className="text-sm text-purple-300">You're the host - control the music!</p>
        )}
      </div>

      {isHost && (
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Link className="w-4 h-4 inline mr-2" />
              Paste YouTube Link
            </label>
            <form onSubmit={handleYouTubeLink} className="flex space-x-2">
              <input
                type="url"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="Paste YouTube URL here (e.g., https://www.youtube.com/watch?v=...)"
                className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!youtubeLink.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl btn-3d transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Link className="w-4 h-4" />
                <span>Play</span>
              </button>
            </form>
          </div>
          
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-3">
            <p className="text-sm text-blue-300">
              💡 <strong>How to use:</strong> Go to YouTube, find your song, copy the URL and paste it here. The video will sync for everyone in the room!
            </p>
          </div>
        </div>
      )}

      {videoId && (
        <div className="space-y-4">
          {/* YouTube Player */}
          <div className="bg-black rounded-xl overflow-hidden">
            <YouTube
              videoId={videoId}
              opts={{
                width: '100%',
                height: '240',
                playerVars: {
                  autoplay: 0,
                  controls: isHost ? 1 : 0,
                  disablekb: !isHost ? 1 : 0,
                  fs: 0,
                  rel: 0,
                  showinfo: 0,
                  iv_load_policy: 3,
                  modestbranding: 1,
                  origin: window.location.origin, // Fix origin mismatch
                  enablejsapi: 1,
                  playsinline: 1
                }
              }}
              onReady={onPlayerReady}
              onStateChange={onStateChange}
              onError={onPlayerError}
              loading="lazy"
            />
          </div>

          {/* Video Info */}
          <div className="bg-gray-800/30 rounded-xl p-4">
            <p className="text-white font-medium text-center mb-3 truncate">
              {videoTitle}
            </p>
            
            {/* Controls */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                onClick={togglePlay}
                disabled={!isHost}
                className={`p-3 rounded-full transition-all ${
                  isHost 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white btn-3d' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2 mt-4">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-400 w-8">{volume}%</span>
            </div>
          </div>
        </div>
      )}

      {!videoId && (
        <div className="text-center py-8 text-gray-400">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No music selected</p>
          {isHost && <p className="text-sm">Paste a YouTube link to get started</p>}
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
