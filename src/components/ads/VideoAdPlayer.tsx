import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, RotateCcw, Maximize2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  onFullscreen?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export const VideoAdPlayer = ({
  segments,
  totalDuration,
  title,
  voiceoverUrl,
  onFullscreen,
  className = "",
  autoPlay = false,
}: VideoAdPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

      if (audioRef.current && voiceoverUrl) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, totalDuration, voiceoverUrl]);

  // Sync audio with playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Reset audio when looping
  useEffect(() => {
    if (audioRef.current && currentTime === 0 && isPlaying) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [currentTime, isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setCurrentSegmentIndex(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * totalDuration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime % (audioRef.current.duration || totalDuration);
    }
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
    <div className={`relative group bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video frame display */}
      <div className="relative aspect-video">
        <img
          src={currentSegment?.imageUrl}
          alt={`Frame ${currentSegmentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Caption overlay */}
        {currentSegment?.caption && (
          <div className="absolute bottom-16 left-0 right-0 px-4">
            <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center">
              {currentSegment.caption}
            </div>
          </div>
        )}

        {/* Title overlay */}
        {title && (
          <div className="absolute top-4 left-4 bg-black/50 px-3 py-1.5 rounded-lg">
            <p className="text-white text-sm font-medium">{title}</p>
          </div>
        )}

        {/* Fullscreen button */}
        {onFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onFullscreen}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}

        {/* Play indicator overlay */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={handlePlayPause}
          >
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Loop indicator */}
        <div className="absolute top-4 right-4 bg-black/50 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
          Loop {Math.floor(currentTime / totalDuration) + 1}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress bar */}
        <div 
          className="w-full h-2 bg-white/30 rounded-full cursor-pointer mb-3"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20"
              onClick={handleRestart}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20"
              onClick={handleMuteToggle}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <span className="text-white text-sm ml-2">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          {/* Segment indicator */}
          <div className="flex items-center gap-1">
            {segments.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
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
        />
      )}
    </div>
  );
};
