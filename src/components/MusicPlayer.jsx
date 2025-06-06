import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, Link, Music, RefreshCw, Wifi, WifiOff, Smartphone } from 'lucide-react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import YouTube from 'react-youtube';

const MusicPlayer = ({ roomId, isHost, userName }) => {
  const playerRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerState, setPlayerState] = useState(-1);
  const [lastSyncTime, setLastSyncTime] = useState(0);
  const [syncStatus, setSyncStatus] = useState('connected');
  const [isMobile, setIsMobile] = useState(false);
  const [backgroundPlayEnabled, setBackgroundPlayEnabled] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

  // Enable background play for mobile
  const enableBackgroundPlay = () => {
    if (isMobile && playerRef.current) {
      try {
        // Request audio context unlock (required for mobile)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        
        // Set up Wake Lock API if available
        if ('wakeLock' in navigator) {
          navigator.wakeLock.request('screen').catch(err => {
            console.log('Wake lock failed:', err);
          });
        }
        
        setBackgroundPlayEnabled(true);
        console.log('Background play enabled');
      } catch (error) {
        console.log('Background play setup failed:', error);
      }
    }
  };

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
        setSyncStatus('connected');
        
        // Update video if different
        if (data.videoId && data.videoId !== videoId) {
          console.log('Setting new video:', data.videoId);
          setVideoId(data.videoId);
          setVideoTitle(data.videoTitle || 'YouTube Video');
        }
        
        // Improved sync for non-hosts
        if (!isHost && playerRef.current) {
          const playerReady = playerRef.current.getPlayerState && playerRef.current.getPlayerState() !== -1;
          
          if (playerReady) {
            // Sync play/pause state
            if (data.isPlaying !== isPlaying) {
              console.log('Syncing play state:', data.isPlaying);
              setIsPlaying(data.isPlaying);
              
              if (data.isPlaying) {
                // First seek to correct time, then play
                if (data.currentTime) {
                  playerRef.current.seekTo(data.currentTime, true);
                }
                setTimeout(() => {
                  playerRef.current.playVideo();
                }, 100);
              } else {
                playerRef.current.pauseVideo();
              }
            }
            
            // More aggressive time sync for smooth playback
            if (data.currentTime && isPlaying) {
              const timeDiff = Math.abs(data.currentTime - currentTime);
              if (timeDiff > 2) { // Sync if more than 2 seconds off
                console.log(`Syncing time: ${currentTime} -> ${data.currentTime} (diff: ${timeDiff}s)`);
                playerRef.current.seekTo(data.currentTime, true);
                setCurrentTime(data.currentTime);
              }
            }
          }
        }
        
        setLastSyncTime(Date.now());
      }
    }, (error) => {
      console.error('Music sync error:', error);
      setSyncStatus('error');
    });

    return () => unsubscribe();
  }, [roomId, isHost, videoId, isPlaying, currentTime]);

  // Improved sync function with better timing
  const syncMusicState = useCallback((vId = videoId, vTitle = videoTitle, forceSync = false) => {
    if (isHost && roomId && playerRef.current) {
      setSyncStatus('syncing');
      const musicRef = ref(database, `rooms/${roomId}/music`);
      const currentTimeValue = playerRef.current.getCurrentTime() || 0;
      const currentPlayerState = playerRef.current.getPlayerState();
      
      const musicData = {
        isPlaying: currentPlayerState === 1, // More accurate play state
        currentTime: currentTimeValue,
        videoId: vId,
        videoTitle: vTitle,
        lastUpdated: Date.now(),
        updatedBy: userName,
        forceSync: forceSync,
        playerState: currentPlayerState
      };
      
      console.log('Syncing music state:', musicData);
      
      set(musicRef, musicData)
        .then(() => {
          setSyncStatus('connected');
          setLastSyncTime(Date.now());
        })
        .catch(error => {
          console.error('Error syncing music state:', error);
          setSyncStatus('error');
        });
    }
  }, [isHost, roomId, videoId, videoTitle, userName]);

  // Continuous sync for host (every 2 seconds when playing)
  useEffect(() => {
    if (isHost && isPlaying && playerRef.current) {
      syncIntervalRef.current = setInterval(() => {
        const currentState = playerRef.current.getPlayerState();
        if (currentState === 1) { // Only sync when actually playing
          syncMusicState();
        }
      }, 2000); // Every 2 seconds for smoother sync
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isHost, isPlaying, syncMusicState]);

  // Manual sync function for host
  const handleManualSync = () => {
    if (isHost && playerRef.current) {
      console.log('Manual sync triggered');
      const currentState = playerRef.current.getPlayerState();
      setCurrentTime(playerRef.current.getCurrentTime());
      setIsPlaying(currentState === 1);
      syncMusicState(videoId, videoTitle, true);
    }
  };

  const togglePlay = () => {
    if (isHost && playerRef.current) {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      
      if (newIsPlaying) {
        playerRef.current.playVideo();
        // Enable background play on first play (mobile)
        if (isMobile && !backgroundPlayEnabled) {
          enableBackgroundPlay();
        }
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
        setIsBuffering(true);
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
    setIsBuffering(false);
    
    // Mobile optimization
    if (isMobile) {
      // Set quality to auto for better performance
      event.target.setPlaybackQuality('default');
    }
    
    // If host, sync the current state
    if (isHost) {
      setTimeout(() => syncMusicState(), 1000);
    }
  };

  const onStateChange = (event) => {
    const state = event.data;
    setPlayerState(state);
    
    // Handle buffering states
    if (state === 3) { // buffering
      setIsBuffering(true);
    } else {
      setIsBuffering(false);
    }
    
    if (isHost) {
      const newIsPlaying = state === 1; // 1 = playing
      
      console.log('Player state changed:', state, 'isPlaying:', newIsPlaying);
      
      if (newIsPlaying !== isPlaying && state !== 3) { // Don't sync while buffering
        setIsPlaying(newIsPlaying);
        setTimeout(() => syncMusicState(), 200); // Faster sync for state changes
      }
    }
    
    // Handle mobile background play
    if (isMobile && state === 1) { // Playing
      enableBackgroundPlay();
    }
  };

  const onPlayerError = (event) => {
    console.log('YouTube Player Error:', event.data);
    setIsBuffering(false);
    setSyncStatus('error');
    
    // Handle different error types
    switch (event.data) {
      case 2:
        alert('Invalid video ID - please try another video');
        break;
      case 5:
        alert('HTML5 player error - please refresh and try again');
        break;
      case 100:
        alert('Video not found - please check the URL');
        break;
      case 101:
      case 150:
        alert('Video cannot be played in embedded players - try another video');
        break;
      default:
        alert('Unknown player error - please refresh and try again');
    }
  };

  const updateTime = useCallback(() => {
    if (playerRef.current && !isBuffering) {
      const time = playerRef.current.getCurrentTime();
      setCurrentTime(time);
    }
  }, [isBuffering]);

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
          {/* Sync Status Indicator */}
          <div className="flex items-center space-x-1 text-xs">
            {syncStatus === 'connected' && <Wifi className="w-3 h-3 text-green-400" />}
            {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" />}
            {syncStatus === 'error' && <WifiOff className="w-3 h-3 text-red-400" />}
            {isMobile && <Smartphone className="w-3 h-3 text-blue-400" />}
          </div>
        </h3>
        {isHost && (
          <div className="flex items-center justify-center space-x-4">
            <p className="text-sm text-purple-300">You're the host - control the music!</p>
            <button
              onClick={handleManualSync}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs btn-3d transition-all flex items-center space-x-1"
              title="Manual Sync - Force sync current state to all users"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sync</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Background Play Info */}
      {isMobile && !backgroundPlayEnabled && (
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm">
              📱 Mobile detected - music will continue in background after first play!
            </span>
          </div>
        </div>
      )}

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
                disabled={!youtubeLink.trim() || isBuffering}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl btn-3d transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Link className="w-4 h-4" />
                <span>Play</span>
              </button>
            </form>
          </div>
          
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-3">
            <p className="text-sm text-blue-300">
              💡 <strong>How to use:</strong> Go to YouTube, find your song, copy the URL and paste it here. Use the Sync button if users get out of sync!
            </p>
          </div>
        </div>
      )}

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
            <span className="text-yellow-300 text-sm">Loading video...</span>
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
                height: isMobile ? '200' : '240',
                playerVars: {
                  autoplay: 0,
                  controls: isHost ? 1 : 0,
                  disablekb: !isHost ? 1 : 0,
                  fs: 0,
                  rel: 0,
                  showinfo: 0,
                  iv_load_policy: 3,
                  modestbranding: 1,
                  origin: window.location.origin,
                  enablejsapi: 1,
                  playsinline: 1,
                  // Mobile optimizations
                  html5: 1,
                  wmode: 'transparent'
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
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-medium truncate flex-1">
                {videoTitle}
              </p>
              {/* Player state indicator */}
              <div className="text-xs text-gray-400">
                {isBuffering && <span className="text-yellow-400">Buffering...</span>}
                {playerState === 1 && !isBuffering && <span className="text-green-400">Playing</span>}
                {playerState === 2 && !isBuffering && <span className="text-gray-400">Paused</span>}
                {playerState === 5 && <span className="text-blue-400">Ready</span>}
                {isMobile && backgroundPlayEnabled && <span className="text-blue-400 ml-2">📱BG</span>}
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                onClick={togglePlay}
                disabled={!isHost || isBuffering}
                className={`p-3 rounded-full transition-all ${
                  isHost && !isBuffering
                    ? 'bg-purple-600 hover:bg-purple-700 text-white btn-3d' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isBuffering ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
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

            {/* Sync Status */}
            <div className="mt-3 text-xs text-center">
              <span className={`${
                syncStatus === 'connected' ? 'text-green-400' :
                syncStatus === 'syncing' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {syncStatus === 'connected' && `Last sync: ${Math.floor((Date.now() - lastSyncTime) / 1000)}s ago`}
                {syncStatus === 'syncing' && 'Syncing...'}
                {syncStatus === 'error' && 'Sync error - check connection'}
              </span>
              {isMobile && (
                <div className="text-blue-400 mt-1">
                  📱 Mobile mode {backgroundPlayEnabled ? '(Background enabled)' : '(Tap play to enable background)'}
                </div>
              )}
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
