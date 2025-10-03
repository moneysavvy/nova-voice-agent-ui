'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface AgentProfile {
  id: string;
  name: string;
  avatar: string;
  description: string;
  voice: string;
  personality: string;
}

export const AGENT_PROFILES: AgentProfile[] = [
  {
    id: 'nova',
    name: 'Nova',
    avatar: '🌟',
    description: 'Your friendly AI assistant',
    voice: 'rachel',
    personality: 'helpful and conversational',
  },
  {
    id: 'haley',
    name: 'Haley',
    avatar: '👩',
    description: 'Professional and efficient',
    voice: 'bella',
    personality: 'professional and direct',
  },
  {
    id: 'samuel',
    name: 'Samuel',
    avatar: '👨',
    description: 'Technical expert',
    voice: 'adam',
    personality: 'analytical and precise',
  },
  {
    id: 'felicia',
    name: 'Felicia',
    avatar: '💼',
    description: 'Business consultant',
    voice: 'natasha',
    personality: 'strategic and insightful',
  },
  {
    id: 'jules',
    name: 'Jules',
    avatar: '🎨',
    description: 'Creative collaborator',
    voice: 'rachel',
    personality: 'creative and enthusiastic',
  },
];

interface AgentSelectorProps {
  selectedAgentId: string;
  onSelectAgent: (agent: AgentProfile) => void;
  disabled?: boolean;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgentId,
  onSelectAgent,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Selected Agent Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-2 transition-colors',
          'border border-gray-700 bg-gray-800/50 hover:bg-gray-800',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        aria-label="Select AI agent"
        aria-expanded={isOpen}
      >
        {AGENT_PROFILES.map((agent) =>
          agent.id === selectedAgentId ? (
            <div key={agent.id} className="flex items-center gap-2">
              <span className="text-2xl">{agent.avatar}</span>
              <div className="text-left">
                <div className="font-medium text-white">{agent.name}</div>
                <div className="text-xs text-gray-400">{agent.description}</div>
              </div>
            </div>
          ) : null
        )}
        <svg
          className={cn('ml-2 h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Agent List Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-2 w-80 border border-gray-700 bg-gray-900',
            'z-50 overflow-hidden rounded-lg shadow-xl'
          )}
          role="listbox"
        >
          {AGENT_PROFILES.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                onSelectAgent(agent);
                setIsOpen(false);
              }}
              disabled={disabled}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 transition-colors',
                'text-left hover:bg-gray-800',
                agent.id === selectedAgentId && 'bg-gray-800/50',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              role="option"
              aria-selected={agent.id === selectedAgentId}
            >
              <span className="text-3xl">{agent.avatar}</span>
              <div className="flex-1">
                <div className="font-medium text-white">{agent.name}</div>
                <div className="text-sm text-gray-400">{agent.description}</div>
                <div className="mt-1 text-xs text-gray-500">{agent.personality}</div>
              </div>
              {agent.id === selectedAgentId && (
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}
    </div>
  );
};
