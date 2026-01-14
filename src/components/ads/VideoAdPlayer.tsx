import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, RotateCcw, Maximize2 } from "lucide-react";

interface VideoSegment {
  imageUrl: string;
  startTime: number;
  endTime: number;
  caption?: string;
}

interface VideoAdPlayerProps {
  segments: VideoSegment[];
  totalDuration: number;
  title?: string;
  voiceoverUrl?: string;
  audioUrl?: string;
  onFullscreen?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export const VideoAdPlayer = ({
  segments,
  totalDuration,
  title,
  voiceoverUrl,
  audioUrl,
  onFullscreen,
  className = "",
  autoPlay = false,
}: VideoAdPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false); // Unmuted by default for better UX
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Calculate which segment should be shown based on current time
  const getCurrentSegment = useCallback((time: number) => {
    if (segments.length === 0) return 0;
    
    // Loop through time if exceeds total duration
    const loopedTime = time % totalDuration;
    
    for (let i = 0; i < segments.length; i++) {
      if (loopedTime >= segments[i].startTime && loopedTime < segments[i].endTime) {
        return i;
      }
    }
    return 0;
  }, [segments, totalDuration]);

  // Update current segment when time changes
  useEffect(() => {
    const newIndex = getCurrentSegment(currentTime);
    if (newIndex !== currentSegmentIndex) {
      setCurrentSegmentIndex(newIndex);
    }
  }, [currentTime, getCurrentSegment, currentSegmentIndex]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          // Loop continuously
          if (next >= totalDuration) {
            return 0;
          }
          return next;
        });
      }, 100);

      // Play audio with user interaction handling
      const playAudio = async () => {
        try {
          if (audioRef.current && voiceoverUrl) {
            audioRef.current.muted = isMuted;
            await audioRef.current.play();
          }
          if (musicRef.current && audioUrl) {
            musicRef.current.muted = isMuted;
            await musicRef.current.play();
          }
        } catch (e) {
          // Auto-play blocked, mute and retry
          console.log("Autoplay blocked, muting audio");
          setIsMuted(true);
          if (audioRef.current) {
            audioRef.current.muted = true;
            audioRef.current.play().catch(() => {});
          }
          if (musicRef.current) {
            musicRef.current.muted = true;
            musicRef.current.play().catch(() => {});
          }
        }
      };
      playAudio();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (musicRef.current) {
        musicRef.current.pause();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, totalDuration, voiceoverUrl, audioUrl, isMuted]);

  // Sync audio with playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
    if (musicRef.current) {
      musicRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Reset audio when looping
  useEffect(() => {
    if (currentTime === 0 && isPlaying) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      if (musicRef.current) {
        musicRef.current.currentTime = 0;
        musicRef.current.play().catch(() => {});
      }
    }
  }, [currentTime, isPlaying]);

  // Auto-hide controls after 3 seconds
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
    }
  }, [isPlaying]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Click anywhere to play/pause (YouTube style)
  const handleVideoClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't toggle if clicking on controls
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.controls-bar')) {
      return;
    }
    
    setUserInteracted(true);
    setIsPlaying(!isPlaying);
    resetControlsTimeout();
    
    // If user clicks while muted and hasn't interacted, unmute
    if (isMuted && !userInteracted) {
      setIsMuted(false);
    }
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserInteracted(true);
    setIsPlaying(!isPlaying);
    resetControlsTimeout();
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTime(0);
    setCurrentSegmentIndex(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    if (musicRef.current) {
      musicRef.current.currentTime = 0;
    }
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * totalDuration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime % (audioRef.current.duration || totalDuration);
    }
    if (musicRef.current) {
      musicRef.current.currentTime = newTime % (musicRef.current.duration || totalDuration);
    }
  };

  // Touch handling for mobile
  const handleTouchStart = () => {
    resetControlsTimeout();
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const progressPercentage = (currentTime / totalDuration) * 100;
  const currentSegment = segments[currentSegmentIndex] || segments[0];

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (segments.length === 0) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground">No video segments available</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden cursor-pointer touch-manipulation ${className}`}
      onClick={handleVideoClick}
      onTouchStart={handleTouchStart}
      onMouseMove={handleMouseMove}
    >
      {/* Video frame display */}
      <div className="relative aspect-video select-none">
        <img
          src={currentSegment?.imageUrl}
          alt={`Frame ${currentSegmentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
          draggable={false}
        />

        {/* Caption overlay */}
        {currentSegment?.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4 pointer-events-none">
            <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center text-sm md:text-base">
              {currentSegment.caption}
            </div>
          </div>
        )}

        {/* Title overlay */}
        {title && (
          <div className={`absolute top-4 left-4 bg-black/50 px-3 py-1.5 rounded-lg transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-white text-sm font-medium">{title}</p>
          </div>
        )}

        {/* Fullscreen button */}
        {onFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen();
            }}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}

        {/* Center play/pause overlay - YouTube style */}
        <div 
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${!isPlaying ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" />
          </div>
        </div>

        {/* Tap to unmute hint (shows briefly) */}
        {isMuted && isPlaying && !userInteracted && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 px-4 py-2 rounded-lg pointer-events-none animate-pulse">
            <p className="text-white text-sm flex items-center gap-2">
              <VolumeX className="w-4 h-4" />
              Tap to unmute
            </p>
          </div>
        )}
      </div>

      {/* Controls bar - always visible on hover/touch, hidden during play */}
      <div 
        className={`controls-bar absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 md:p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Progress bar - larger touch target for mobile */}
        <div 
          className="w-full h-3 md:h-2 bg-white/30 rounded-full cursor-pointer mb-3 touch-manipulation"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-primary rounded-full transition-all duration-100 relative"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Progress handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 md:w-3 md:h-3 bg-primary rounded-full shadow-lg" />
          </div>
        </div>

        {/* Control buttons - larger for mobile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:h-9 md:w-9 text-white hover:bg-white/20 active:bg-white/30"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:h-9 md:w-9 text-white hover:bg-white/20 active:bg-white/30"
              onClick={handleRestart}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:h-9 md:w-9 text-white hover:bg-white/20 active:bg-white/30"
              onClick={handleMuteToggle}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <span className="text-white text-xs md:text-sm ml-1 md:ml-2 tabular-nums">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          {/* Segment indicator - responsive */}
          <div className="flex items-center gap-1">
            {segments.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors ${
                  index === currentSegmentIndex ? "bg-primary" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hidden audio element for voiceover */}
      {voiceoverUrl && (
        <audio
          ref={audioRef}
          src={voiceoverUrl}
          loop
          muted={isMuted}
          preload="auto"
          playsInline
        />
      )}

      {/* Hidden audio element for background music */}
      {audioUrl && (
        <audio
          ref={musicRef}
          src={audioUrl}
          loop
          muted={isMuted}
          preload="auto"
          playsInline
        />
      )}
    </div>
  );
};
