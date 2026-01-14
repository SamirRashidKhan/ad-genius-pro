import { useState, useCallback } from "react";

interface VideoSegment {
  imageUrl: string;
  startTime: number;
  endTime: number;
  caption?: string;
}

interface UseVideoGeneratorOptions {
  segments: VideoSegment[];
  audioUrl?: string;
  duration: number;
  title: string;
  onProgress?: (progress: number) => void;
}

export const useVideoGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateVideo = useCallback(
    async ({
      segments,
      audioUrl,
      duration,
      title,
      onProgress,
    }: UseVideoGeneratorOptions): Promise<Blob | null> => {
      if (segments.length === 0) {
        console.error("No segments provided");
        return null;
      }

      setIsGenerating(true);
      setProgress(0);

      try {
        // Create canvas for video frames
        const canvas = document.createElement("canvas");
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d")!;

        // Load all images first
        const images: HTMLImageElement[] = await Promise.all(
          segments.map(
            (segment) =>
              new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = segment.imageUrl;
              })
          )
        );

        setProgress(20);
        onProgress?.(20);

        // Set up MediaRecorder
        const stream = canvas.captureStream(30); // 30 FPS

        // Add audio track if available
        let audioElement: HTMLAudioElement | null = null;
        if (audioUrl) {
          audioElement = document.createElement("audio");
          audioElement.crossOrigin = "anonymous";
          audioElement.src = audioUrl;
          await new Promise((resolve, reject) => {
            audioElement!.oncanplaythrough = resolve;
            audioElement!.onerror = reject;
            audioElement!.load();
          });

          // Create audio context to capture audio
          const audioContext = new AudioContext();
          const source = audioContext.createMediaElementSource(audioElement);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          source.connect(audioContext.destination);

          // Add audio track to stream
          destination.stream.getAudioTracks().forEach((track) => {
            stream.addTrack(track);
          });
        }

        setProgress(30);
        onProgress?.(30);

        // Create MediaRecorder
        const chunks: Blob[] = [];
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 5000000, // 5 Mbps for good quality
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        const recordingComplete = new Promise<Blob>((resolve) => {
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            resolve(blob);
          };
        });

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms

        // Start audio if available
        if (audioElement) {
          audioElement.currentTime = 0;
          await audioElement.play();
        }

        // Render frames
        const frameRate = 30;
        const totalFrames = Math.ceil(duration * frameRate);
        let currentFrame = 0;

        const renderFrame = () => {
          const currentTime = currentFrame / frameRate;

          // Find current segment
          let currentSegmentIndex = 0;
          for (let i = 0; i < segments.length; i++) {
            if (currentTime >= segments[i].startTime && currentTime < segments[i].endTime) {
              currentSegmentIndex = i;
              break;
            }
          }

          // Draw current image
          const img = images[currentSegmentIndex];
          if (img) {
            // Scale and center image to cover canvas
            const scale = Math.max(
              canvas.width / img.width,
              canvas.height / img.height
            );
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // Draw caption if exists
            const segment = segments[currentSegmentIndex];
            if (segment.caption) {
              ctx.font = "bold 48px sans-serif";
              ctx.textAlign = "center";
              ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
              const textWidth = ctx.measureText(segment.caption).width;
              ctx.fillRect(
                canvas.width / 2 - textWidth / 2 - 20,
                canvas.height - 150,
                textWidth + 40,
                70
              );
              ctx.fillStyle = "white";
              ctx.fillText(segment.caption, canvas.width / 2, canvas.height - 100);
            }

            // Draw title
            if (title && currentTime < 3) {
              ctx.font = "bold 64px sans-serif";
              ctx.textAlign = "center";
              ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
              const titleWidth = ctx.measureText(title).width;
              ctx.fillRect(
                canvas.width / 2 - titleWidth / 2 - 30,
                80,
                titleWidth + 60,
                90
              );
              ctx.fillStyle = "white";
              ctx.fillText(title, canvas.width / 2, 150);
            }
          }

          currentFrame++;
          const currentProgress = 30 + Math.floor((currentFrame / totalFrames) * 60);
          setProgress(currentProgress);
          onProgress?.(currentProgress);

          if (currentFrame < totalFrames) {
            // Use setTimeout for better frame timing
            setTimeout(renderFrame, 1000 / frameRate);
          } else {
            // Stop recording
            if (audioElement) {
              audioElement.pause();
            }
            mediaRecorder.stop();
          }
        };

        // Start rendering
        renderFrame();

        // Wait for recording to complete
        const videoBlob = await recordingComplete;

        setProgress(100);
        onProgress?.(100);
        setIsGenerating(false);

        return videoBlob;
      } catch (error) {
        console.error("Video generation failed:", error);
        setIsGenerating(false);
        setProgress(0);
        return null;
      }
    },
    []
  );

  const downloadVideo = useCallback(
    async (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    []
  );

  return {
    generateVideo,
    downloadVideo,
    isGenerating,
    progress,
  };
};
