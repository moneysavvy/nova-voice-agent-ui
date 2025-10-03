'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ className }) => {
  const room = useRoomContext();
  const { state: agentState } = useVoiceAssistant();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | undefined>(undefined);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  useEffect(() => {
    if (!room || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up audio analysis
    const setupAudioAnalysis = async () => {
      try {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        // Get local audio track
        const localParticipant = room.localParticipant;
        const audioTrack = localParticipant.audioTrackPublications.values().next().value?.track;

        if (audioTrack && audioTrack.mediaStreamTrack) {
          const source = audioContext.createMediaStreamSource(
            new MediaStream([audioTrack.mediaStreamTrack])
          );
          source.connect(analyser);
        }
      } catch (error) {
        console.error('Failed to set up audio analysis:', error);
      }
    };

    setupAudioAnalysis();

    // Animation loop
    const draw = () => {
      if (!ctx || !analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalizedLevel = average / 255;
      setAudioLevel(normalizedLevel);

      // Voice activity detection (simple threshold)
      setIsUserSpeaking(normalizedLevel > 0.05);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw visualization
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const numCircles = 3;
      const baseRadius = 20;

      for (let i = 0; i < numCircles; i++) {
        const radius = baseRadius + i * 25 + normalizedLevel * 50;
        const alpha = 0.3 - i * 0.1 + normalizedLevel * 0.5;

        // Color based on state
        let color;
        if (agentState === 'speaking') {
          color = `rgba(31, 213, 249, ${alpha})`; // Cyan for agent speaking
        } else if (isUserSpeaking) {
          color = `rgba(0, 44, 242, ${alpha})`; // Blue for user speaking
        } else if (agentState === 'listening') {
          color = `rgba(99, 102, 241, ${alpha})`; // Purple for listening
        } else {
          color = `rgba(156, 163, 175, ${alpha})`; // Gray for idle
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Draw core circles ("O O O" effect)
      const coreSpacing = 40;
      const coreRadius = 10 + normalizedLevel * 5;

      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(centerX + i * coreSpacing, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle =
          agentState === 'speaking'
            ? 'rgba(31, 213, 249, 0.9)'
            : isUserSpeaking
              ? 'rgba(0, 44, 242, 0.9)'
              : 'rgba(156, 163, 175, 0.7)';
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [room, agentState, isUserSpeaking]);

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="w-full max-w-md"
        aria-label="Audio visualizer"
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-gray-400">
        {agentState === 'speaking' && 'Agent speaking...'}
        {agentState === 'listening' && isUserSpeaking && 'Listening...'}
        {agentState === 'thinking' && 'Thinking...'}
        {!agentState ||
        (agentState !== 'speaking' && agentState !== 'listening' && agentState !== 'thinking')
          ? 'Ready'
          : null}
      </div>
    </div>
  );
};
