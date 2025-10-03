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

      // Draw visualization with smooth, friendly appearance
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const numRings = 4;
      const baseRadius = 30;

      // Soft gradient rings
      for (let i = 0; i < numRings; i++) {
        const radius = baseRadius + i * 20 + normalizedLevel * 30;
        const alpha = 0.15 - i * 0.03 + normalizedLevel * 0.2;

        // Soft, friendly colors
        let color;
        if (agentState === 'speaking') {
          color = `rgba(96, 165, 250, ${alpha})`; // Soft blue for agent
        } else if (isUserSpeaking) {
          color = `rgba(147, 197, 253, ${alpha})`; // Light blue for user
        } else if (agentState === 'listening') {
          color = `rgba(167, 139, 250, ${alpha})`; // Soft purple for listening
        } else {
          color = `rgba(203, 213, 225, ${alpha})`; // Soft gray for idle
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Draw single friendly pulsing circle
      const pulseRadius = 15 + normalizedLevel * 8 + Math.sin(Date.now() / 500) * 3;

      // Add glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor =
        agentState === 'speaking'
          ? 'rgba(96, 165, 250, 0.6)'
          : isUserSpeaking
            ? 'rgba(147, 197, 253, 0.6)'
            : 'rgba(167, 139, 250, 0.4)';

      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle =
        agentState === 'speaking'
          ? 'rgba(96, 165, 250, 0.95)'
          : isUserSpeaking
            ? 'rgba(147, 197, 253, 0.95)'
            : 'rgba(203, 213, 225, 0.8)';
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

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
