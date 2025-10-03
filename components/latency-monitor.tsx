'use client';

import React, { useEffect, useState } from 'react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';
import { cn } from '@/lib/utils';

interface LatencyMetrics {
  speechToText: number;
  endOfTurn: number;
  llm: number;
  textToSpeech: number;
  total: number;
}

interface LatencyMonitorProps {
  className?: string;
  collapsed?: boolean;
}

export const LatencyMonitor: React.FC<LatencyMonitorProps> = ({ className, collapsed = false }) => {
  const room = useRoomContext();
  const { state: agentState } = useVoiceAssistant();
  const [metrics, setMetrics] = useState<LatencyMetrics>({
    speechToText: 0,
    endOfTurn: 0,
    llm: 0,
    textToSpeech: 0,
    total: 0,
  });
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [timestamps, setTimestamps] = useState<{
    userSpeechStart?: number;
    userSpeechEnd?: number;
    agentResponseStart?: number;
    agentResponseEnd?: number;
  }>({});

  // Track state changes for latency calculation
  useEffect(() => {
    const now = Date.now();

    switch (agentState) {
      case 'listening':
        setTimestamps((prev) => ({ ...prev, userSpeechStart: now }));
        break;
      case 'thinking':
        setTimestamps((prev) => ({ ...prev, userSpeechEnd: now }));
        break;
      case 'speaking':
        setTimestamps((prev) => {
          const agentResponseStart = now;
          const newTimestamps = { ...prev, agentResponseStart };

          // Calculate latencies
          if (prev.userSpeechStart && prev.userSpeechEnd) {
            const sttLatency = prev.userSpeechEnd - prev.userSpeechStart;
            const llmLatency = agentResponseStart - prev.userSpeechEnd;
            const total = agentResponseStart - prev.userSpeechStart;

            setMetrics({
              speechToText: sttLatency,
              endOfTurn: 50, // Estimated VAD detection time
              llm: llmLatency,
              textToSpeech: 100, // Estimated TTS initialization
              total,
            });
          }

          return newTimestamps;
        });
        break;
    }
  }, [agentState]);

  const getLatencyColor = (value: number): string => {
    if (value < 500) return 'text-green-400';
    if (value < 1000) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatLatency = (ms: number): string => {
    return `${ms.toFixed(0)}ms`;
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'fixed right-4 bottom-4 border border-gray-700 bg-gray-900/90 px-4 py-2',
          'z-50 rounded-lg text-sm transition-colors hover:bg-gray-800',
          className
        )}
        aria-label="Show latency metrics"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Latency:</span>
          <span className={cn('font-mono', getLatencyColor(metrics.total))}>
            {formatLatency(metrics.total)}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed right-4 bottom-4 w-80 border border-gray-700 bg-gray-900/95',
        'z-50 rounded-lg p-4 shadow-xl',
        className
      )}
      role="region"
      aria-label="Latency metrics"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Latency Metrics</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 transition-colors hover:text-white"
          aria-label="Collapse latency metrics"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <MetricRow
          label="Speech-to-Text"
          value={metrics.speechToText}
          color={getLatencyColor(metrics.speechToText)}
        />
        <MetricRow
          label="End of Turn (VAD)"
          value={metrics.endOfTurn}
          color={getLatencyColor(metrics.endOfTurn)}
        />
        <MetricRow
          label="LLM Processing"
          value={metrics.llm}
          color={getLatencyColor(metrics.llm)}
        />
        <MetricRow
          label="Text-to-Speech"
          value={metrics.textToSpeech}
          color={getLatencyColor(metrics.textToSpeech)}
        />

        {/* Divider */}
        <div className="border-t border-gray-700 pt-3">
          <MetricRow
            label="Total Latency"
            value={metrics.total}
            color={getLatencyColor(metrics.total)}
            bold
          />
        </div>

        {/* Target indicator */}
        <div className="mt-2 text-xs text-gray-400">
          Target: {'<'}1500ms • Current: {formatLatency(metrics.total)}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              agentState === 'speaking' && 'animate-pulse bg-cyan-400',
              agentState === 'listening' && 'animate-pulse bg-blue-400',
              agentState === 'thinking' && 'animate-pulse bg-yellow-400',
              (!agentState ||
                (agentState !== 'speaking' &&
                  agentState !== 'listening' &&
                  agentState !== 'thinking')) &&
                'bg-gray-400'
            )}
          />
          <span className="text-gray-400 capitalize">{agentState || 'idle'}</span>
        </div>
      </div>
    </div>
  );
};

interface MetricRowProps {
  label: string;
  value: number;
  color: string;
  bold?: boolean;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, color, bold }) => (
  <div className="flex items-center justify-between">
    <span className={cn('text-sm text-gray-300', bold && 'font-semibold')}>{label}</span>
    <span className={cn('font-mono text-sm', color, bold && 'font-semibold')}>
      {value > 0 ? `${value.toFixed(0)}ms` : '-'}
    </span>
  </div>
);
