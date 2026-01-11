import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Play, Pause, Volume2, VolumeX } from "lucide-react";

interface FullscreenPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrl: string;
  mediaType: "image" | "video";
  title?: string;
}

export const FullscreenPreview = ({
  open,
  onOpenChange,
  mediaUrl,
  mediaType,
  title,
}: FullscreenPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleVideoToggle = (video: HTMLVideoElement) => {
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = (video: HTMLVideoElement) => {
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none">
        <div className="relative flex items-center justify-center min-h-[50vh]">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Title */}
          {title && (
            <div className="absolute top-4 left-4 z-50 bg-black/50 px-4 py-2 rounded-lg">
              <p className="text-white font-medium">{title}</p>
            </div>
          )}

          {/* Media content */}
          {mediaType === "image" ? (
            <img
              src={mediaUrl}
              alt={title || "Preview"}
              className="max-w-full max-h-[90vh] object-contain"
            />
          ) : (
            <div className="relative">
              <video
                src={mediaUrl}
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => handleVideoToggle(e.currentTarget)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
              />
              
              {/* Video controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = e.currentTarget.closest('.relative')?.querySelector('video');
                    if (video) handleVideoToggle(video);
                  }}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = e.currentTarget.closest('.relative')?.querySelector('video');
                    if (video) handleMuteToggle(video);
                  }}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Trigger button component for easy reuse
interface PreviewTriggerProps {
  onClick: () => void;
  className?: string;
}

export const PreviewTrigger = ({ onClick, className }: PreviewTriggerProps) => (
  <Button
    variant="ghost"
    size="icon"
    className={`absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${className}`}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    <Maximize2 className="w-4 h-4" />
  </Button>
);
