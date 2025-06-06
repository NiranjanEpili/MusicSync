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
  const [isAppInBackground, setIsAppInBackground] = useState(false);
  const [wasPlayingBeforeBackground, setWasPlayingBeforeBackground] = useState(false);
  const [mobilePlaybackMode, setMobilePlaybackMode] = useState('normal'); // 'normal', 'background'
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [previousVideoId, setPreviousVideoId] = useState('');

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      if (isMobileDevice) {
        // Enable background playback for mobile
        setBackgroundPlayEnabled(true);
        
        // Add mobile-specific event listeners
        const handleVisibilityChange = () => {
          if (document.hidden) {
            console.log('App went to background');
            setIsAppInBackground(true);
            setWasPlayingBeforeBackground(isPlaying);
            
            // Try to keep playing in background
            if (isPlaying && playerRef.current) {
              setTimeout(() => {
                const player = playerRef.current.internalPlayer;
                if (player && typeof player.playVideo === 'function') {
                  console.log('Attempting to resume playback in background');
                  player.playVideo();
                }
              }, 100);
            }
          } else {
            console.log('App came to foreground');
            setIsAppInBackground(false);
            
            // Resume playback if it was playing before background
            if (wasPlayingBeforeBackground && playerRef.current) {
              setTimeout(() => {
                const player = playerRef.current.internalPlayer;
                if (player && typeof player.playVideo === 'function') {
                  console.log('Resuming playback after foreground');
                  player.playVideo();
                }
              }, 500);
            }
          }
        };

        const handlePageHide = () => {
          console.log('Page hide - saving playback state');
          setWasPlayingBeforeBackground(isPlaying);
        };

        const handlePageShow = (event) => {
          console.log('Page show - restoring playback state');
          if (event.persisted && wasPlayingBeforeBackground && playerRef.current) {
            setTimeout(() => {
              const player = playerRef.current.internalPlayer;
              if (player && typeof player.playVideo === 'function') {
                player.playVideo();
              }
            }, 300);
          }
        };

        // iOS Safari specific handling
        const handleFocusIn = () => {
          if (wasPlayingBeforeBackground && playerRef.current) {
            setTimeout(() => {
              const player = playerRef.current.internalPlayer;
              if (player && typeof player.playVideo === 'function') {
                console.log('Focus restored - resuming playback');
                player.playVideo();
              }
            }, 200);
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);
        window.addEventListener('focus', handleFocusIn);

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('pagehide', handlePageHide);
          window.removeEventListener('pageshow', handlePageShow);
          window.removeEventListener('focus', handleFocusIn);
        };
      }
    };
    
    checkMobile();
  }, [isPlaying, wasPlayingBeforeBackground]);

  // Enhanced video switching effect
  useEffect(() => {
    if (videoId && videoId !== previousVideoId && playerRef.current) {
      console.log('Video ID changed from', previousVideoId, 'to', videoId);
      setIsVideoLoading(true);
      setPreviousVideoId(videoId);
      
      // Force YouTube player to load new video
      const player = playerRef.current.internalPlayer;
      if (player && typeof player.loadVideoById === 'function') {
        try {
          console.log('Loading new video:', videoId);
          player.loadVideoById(videoId, 0); // Load from beginning
          player.setVolume(volume);
          
          // Reset states for new video
          setCurrentTime(0);
          setDuration(0);
          setIsPlaying(false);
          setIsBuffering(false);
          
        } catch (error) {
          console.error('Error loading new video:', error);
        }
      }
    }
  }, [videoId, previousVideoId, volume]);

  // Extract YouTube video ID from URL
  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Sync music state to Firebase
  const syncMusicState = useCallback((state) => {
    if (!isHost) return;
    
    const musicRef = ref(database, `rooms/${roomId}/music`);
    const syncData = {
      ...state,
      lastUpdated: Date.now(),
      updatedBy: userName,
      backgroundPlayback: isAppInBackground
    };
    
    console.log('Syncing music state:', syncData);
    
    set(musicRef, syncData).catch(error => {
      console.error('Error syncing music state:', error);
      setSyncStatus('error');
    });
  }, [roomId, isHost, userName, isAppInBackground]);

  // Listen for music state changes from Firebase
  useEffect(() => {
    const musicRef = ref(database, `rooms/${roomId}/music`);
    
    const unsubscribe = onValue(musicRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Music state received:', data);
      
      if (data && data.updatedBy !== userName) {
        const newVideoId = data.videoId || '';
        const currentVideoId = videoId;
        
        // Check if video changed
        if (newVideoId !== currentVideoId) {
          console.log('Detected video change from Firebase:', currentVideoId, '->', newVideoId);
          setIsVideoLoading(true);
        }
        
        // Update local state from Firebase
        setVideoId(newVideoId);
        setVideoTitle(data.videoTitle || '');
        setIsPlaying(data.isPlaying || false);
        setCurrentTime(data.currentTime || 0);
        setVolume(data.volume || 50);
        setLastSyncTime(data.lastUpdated || 0);
        setSyncStatus('synced');
        
        // Enhanced sync for non-host with video switching
        if (!isHost && playerRef.current && newVideoId) {
          const player = playerRef.current.internalPlayer;
          if (player && typeof player.loadVideoById === 'function') {
            const syncPlayback = () => {
              try {
                // If video changed, load the new video
                if (newVideoId !== currentVideoId) {
                  console.log('Loading new video for guest:', newVideoId);
                  player.loadVideoById(newVideoId, data.currentTime || 0);
                } else {
                  // Same video, just sync position and state
                  if (data.isPlaying) {
                    player.seekTo(data.currentTime || 0);
                    player.playVideo();
                    
                    // Force playback even in background for mobile
                    if (isMobile && document.hidden) {
                      setTimeout(() => {
                        player.playVideo();
                      }, 100);
                    }
                  } else {
                    player.pauseVideo();
                    player.seekTo(data.currentTime || 0);
                  }
                }
                
                player.setVolume(data.volume || 50);
              } catch (error) {
                console.log('Sync playback error:', error);
              }
            };

            // Immediate sync
            syncPlayback();
            
            // Retry sync for mobile reliability
            if (isMobile && data.isPlaying) {
              setTimeout(syncPlayback, 200);
              setTimeout(syncPlayback, 500);
            }
          }
        }
      }
    }, (error) => {
      console.error('Music sync error:', error);
      setSyncStatus('error');
    });

    return () => unsubscribe();
  }, [roomId, userName, isHost, isMobile, videoId]);

  // YouTube player ready
  const onPlayerReady = (event) => {
    console.log('YouTube player ready');
    playerRef.current = event.target;
    
    // Get initial duration and set volume
    const initialDuration = event.target.getDuration();
    if (initialDuration > 0) {
      setDuration(initialDuration);
    }
    
    event.target.setVolume(volume);
    setSyncStatus('connected');
    setIsVideoLoading(false);

    // Mobile-specific optimizations
    if (isMobile) {
      const iframe = event.target.getIframe();
      if (iframe) {
        iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
        iframe.setAttribute('allowfullscreen', 'true');
      }
    }
  };

  // Enhanced state change handler with video loading detection
  const onPlayerStateChange = (event) => {
    const state = event.data;
    setPlayerState(state);
    
    console.log('Player state changed:', state, 'Background:', isAppInBackground);
    
    // Handle video loading completion
    if (state === 1 || state === 2) { // Playing or Paused
      setIsVideoLoading(false);
      
      // Update duration when video loads
      const newDuration = event.target.getDuration();
      if (newDuration > 0 && newDuration !== duration) {
        setDuration(newDuration);
      }
    }
    
    // Handle automatic pause prevention on mobile
    if (isMobile && state === 2 && isAppInBackground && wasPlayingBeforeBackground) {
      console.log('Preventing automatic pause in background');
      setTimeout(() => {
        if (playerRef.current) {
          try {
            playerRef.current.internalPlayer.playVideo();
          } catch (error) {
            console.log('Failed to resume background playback:', error);
          }
        }
      }, 100);
      return; // Don't sync this pause
    }
    
    if (state === 1) { // Playing
      setIsPlaying(true);
      setIsBuffering(false);
      if (isHost) {
        syncMusicState({
          videoId,
          videoTitle,
          isPlaying: true,
          currentTime: event.target.getCurrentTime(),
          volume,
          duration: event.target.getDuration()
        });
      }
    } else if (state === 2) { // Paused
      setIsPlaying(false);
      setIsBuffering(false);
      if (isHost && !isAppInBackground) {
        syncMusicState({
          videoId,
          videoTitle,
          isPlaying: false,
          currentTime: event.target.getCurrentTime(),
          volume,
          duration: event.target.getDuration()
        });
      }
    } else if (state === 3) { // Buffering
      setIsBuffering(true);
    } else if (state === 0) { // Ended
      setIsPlaying(false);
      if (isHost) {
        syncMusicState({
          videoId,
          videoTitle,
          isPlaying: false,
          currentTime: 0,
          volume,
          duration: event.target.getDuration()
        });
      }
    } else if (state === 5) { // Video cued (loaded but not started)
      setIsVideoLoading(false);
      setIsBuffering(false);
    }
  };

  // Enhanced YouTube link submission with proper cleanup
  const handleSubmitLink = (e) => {
    e.preventDefault();
    if (!isHost) return;
    
    const extractedVideoId = extractVideoId(youtubeLink);
    if (extractedVideoId) {
      console.log('Submitting new video:', extractedVideoId);
      
      // Clear previous video state
      setIsVideoLoading(true);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setIsBuffering(false);
      setPlayerState(-1);
      
      // Set new video data
      setVideoId(extractedVideoId);
      setVideoTitle('Loading...');
      setPreviousVideoId(videoId); // Store previous video ID
      
      // Sync new video to Firebase
      syncMusicState({
        videoId: extractedVideoId,
        videoTitle: 'Loading...',
        isPlaying: false,
        currentTime: 0,
        volume,
        duration: 0
      });
      
      setYoutubeLink('');
    } else {
      alert('Please enter a valid YouTube URL');
    }
  };

  // Enhanced play/pause with video loading check
  const togglePlayPause = () => {
    if (!playerRef.current || isVideoLoading) return;
    
    const player = playerRef.current.internalPlayer;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
      
      // Mobile: Ensure playback starts even if in background
      if (isMobile) {
        setTimeout(() => {
          player.playVideo();
        }, 100);
      }
    }
  };

  // Volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    
    if (playerRef.current) {
      playerRef.current.internalPlayer.setVolume(newVolume);
    }
    
    if (isHost) {
      syncMusicState({
        videoId,
        videoTitle,
        isPlaying,
        currentTime: playerRef.current ? playerRef.current.internalPlayer.getCurrentTime() : 0,
        volume: newVolume,
        duration
      });
    }
  };

  // Progress tracking for host
  useEffect(() => {
    if (isHost && isPlaying && playerRef.current && !isVideoLoading) {
      const interval = setInterval(() => {
        const player = playerRef.current.internalPlayer;
        if (player && typeof player.getCurrentTime === 'function') {
          try {
            const time = player.getCurrentTime();
            setCurrentTime(time);
            
            // Sync every 5 seconds when playing, more frequently in background
            const syncInterval = isAppInBackground ? 3000 : 5000;
            if (Date.now() - lastSyncTime > syncInterval) {
              syncMusicState({
                videoId,
                videoTitle,
                isPlaying: true,
                currentTime: time,
                volume,
                duration
              });
              setLastSyncTime(Date.now());
            }
          } catch (error) {
            console.log('Progress tracking error:', error);
          }
        }
      }, 1000);
      
      syncIntervalRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [isHost, isPlaying, videoId, videoTitle, volume, duration, lastSyncTime, syncMusicState, isAppInBackground, isVideoLoading]);

  // Enhanced player options with better video switching
  const playerOptions = {
    height: isMobile ? '200' : '300',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: isHost ? 1 : 0,
      disablekb: !isHost ? 1 : 0,
      fs: 1,
      rel: 0,
      showinfo: 0,
      modestbranding: 1,
      playsinline: 1,
      enablejsapi: 1,
      origin: window.location.origin,
      iv_load_policy: 3,
      cc_load_policy: 0
    }
  };

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-effect rounded-2xl p-4 sm:p-6 shadow-3d">
      {/* Header with loading indicator */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <Music className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg sm:text-xl font-bold text-white">Music Player</h3>
          {isVideoLoading && (
            <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg text-xs font-medium">
              Loading...
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Background playback indicator */}
          {isMobile && isAppInBackground && (
            <div className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-lg text-xs font-medium">
              Background
            </div>
          )}
          {/* Sync Status */}
          <div className="flex items-center space-x-1">
            {syncStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : syncStatus === 'error' ? (
              <WifiOff className="w-4 h-4 text-red-400" />
            ) : (
              <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
            )}
            <span className="text-xs text-gray-400 hidden sm:inline">
              {syncStatus === 'connected' ? 'Synced' : syncStatus === 'error' ? 'Error' : 'Syncing'}
            </span>
          </div>
          {/* Mobile indicator */}
          {isMobile && <Smartphone className="w-4 h-4 text-blue-400" />}
          {/* Host indicator */}
          {isHost && (
            <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg text-xs font-medium">
              Host
            </div>
          )}
        </div>
      </div>

      {/* Mobile background playback notice */}
      {isMobile && backgroundPlayEnabled && (
        <div className="bg-green-600/10 border border-green-500/20 rounded-xl p-3 mb-4">
          <p className="text-xs sm:text-sm text-green-300 text-center">
            📱 Background playback enabled - music will continue when you switch apps
          </p>
        </div>
      )}

      {/* Enhanced YouTube Link Input with loading state */}
      {isHost && (
        <form onSubmit={handleSubmitLink} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                type="url"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
                disabled={isVideoLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isVideoLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-3 rounded-xl btn-3d transition-all flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVideoLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Link className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {isVideoLoading ? 'Loading...' : 'Load'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Enhanced Video Player with loading overlay */}
      {videoId ? (
        <div className="mb-6 relative">
          <div className="youtube-container">
            <YouTube
              key={videoId} // Force re-render when video changes
              videoId={videoId}
              opts={playerOptions}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              onEnd={() => setIsPlaying(false)}
              onError={(error) => {
                console.error('YouTube player error:', error);
                setSyncStatus('error');
                setIsVideoLoading(false);
              }}
            />
            
            {/* Loading overlay */}
            {isVideoLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                <div className="text-white text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading new video...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Video Info */}
          {videoTitle && videoTitle !== 'Loading...' && !isVideoLoading && (
            <div className="mt-3 text-center">
              <p className="text-white font-medium text-sm sm:text-base truncate">
                {videoTitle}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 bg-gray-800/30 rounded-xl p-8 sm:p-12 text-center border-2 border-dashed border-gray-600">
          <Music className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-sm sm:text-base">
            {isHost ? 'Paste a YouTube URL above to start playing music' : 'Waiting for host to select music...'}
          </p>
        </div>
      )}

      {/* Enhanced Controls with loading state */}
      {videoId && (
        <div className="space-y-4">
          {/* Play/Pause Button */}
          {(isHost || playerState !== -1) && (
            <div className="flex items-center justify-center">
              <button
                onClick={togglePlayPause}
                disabled={!isHost || isVideoLoading}
                className={`p-3 sm:p-4 rounded-full btn-3d transition-all ${
                  isHost && !isVideoLoading
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isVideoLoading || isBuffering ? (
                  <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-8 sm:h-8" />
                ) : (
                  <Play className="w-6 h-6 sm:w-8 sm:h-8" />
                )}
              </button>
            </div>
          )}

          {/* Progress Bar - only show when video is properly loaded */}
          {duration > 0 && !isVideoLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span className="text-xs">{formatTime(currentTime)}</span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs">{formatTime(duration)}</span>
            </div>
          )}

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1"
              disabled={!isHost || isVideoLoading}
            />
            <span className="text-xs sm:text-sm text-gray-400 w-8 text-right">
              {volume}%
            </span>
          </div>

          {/* Loading notice */}
          {isVideoLoading && (
            <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-xs sm:text-sm text-yellow-300 text-center">
                🔄 Loading new video... Please wait
              </p>
            </div>
          )}

          {/* Non-host notice */}
          {!isHost && !isVideoLoading && (
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-xs sm:text-sm text-blue-300 text-center">
                🎵 Music is controlled by the room host
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
