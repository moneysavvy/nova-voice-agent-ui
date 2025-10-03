'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AGENT_PROFILES, type AgentProfile, AgentSelector } from '@/components/agent-selector';
import { toastAlert } from '@/components/alert-toast';
import { AudioVisualizer } from '@/components/audio-visualizer';
import { ConversationSidebar } from '@/components/conversation-sidebar';
import { LatencyMonitor } from '@/components/latency-monitor';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import { NavigationSidebar } from '@/components/navigation-sidebar';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
}

export const SessionView = ({
  appConfig,
  disabled,
  sessionStarted,
  ref,
}: React.ComponentProps<'div'> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(true); // Open by default to show chat and transcriptions
  const [currentConversationId, setCurrentConversationId] = useState(() => {
    // Initialize with stored conversation ID or create new one (client-side only)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nova_current_conversation_id');
      return stored || `conversation_${Date.now()}`;
    }
    return `conversation_${Date.now()}`;
  });
  const { messages, send } = useChatAndTranscription({ conversationId: currentConversationId });
  const room = useRoomContext();
  const [sessionStartTime] = useState(Date.now());
  const [showWelcome, setShowWelcome] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navSidebarOpen, setNavSidebarOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile>(AGENT_PROFILES[0]);

  // Determine which messages are from previous session
  const isHistoricalMessage = (message: ReceivedChatMessage) => {
    return message.timestamp < sessionStartTime;
  };

  // Hide welcome when first message arrives
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages.length]);

  // Copy to clipboard function
  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Save current conversation ID to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('nova_current_conversation_id', currentConversationId);
  }, [currentConversationId]);

  // Clear conversation
  const clearConversation = () => {
    if (confirm('Clear this conversation? This cannot be undone.')) {
      localStorage.removeItem('nova_chat_history');
      localStorage.removeItem(`nova_conversation_${currentConversationId}`);

      // Remove from conversations list
      const stored = localStorage.getItem('nova_conversations');
      if (stored) {
        const conversations = JSON.parse(stored);
        const updated = conversations.filter(
          (c: { id: string; name: string; lastUpdated: number }) => c.id !== currentConversationId
        );
        localStorage.setItem('nova_conversations', JSON.stringify(updated));
      }

      window.location.reload();
    }
  };

  const handleNewConversation = () => {
    const newId = `conversation_${Date.now()}`;
    setCurrentConversationId(newId);
    localStorage.setItem('nova_current_conversation_id', newId);
    localStorage.removeItem('nova_chat_history');
    window.location.reload();
  };

  const handleSelectConversation = (id: string) => {
    // Load conversation from storage
    const stored = localStorage.getItem(`nova_conversation_${id}`);
    if (stored) {
      localStorage.setItem('nova_chat_history', stored);
      localStorage.setItem('nova_current_conversation_id', id);
      setCurrentConversationId(id);
      window.location.reload();
    }
  };

  // Connection status indicator
  const getConnectionStatus = () => {
    switch (agentState) {
      case 'connecting':
        return { text: 'Connecting...', color: 'bg-yellow-500' };
      case 'initializing':
        return { text: 'Initializing...', color: 'bg-yellow-500' };
      case 'listening':
        return { text: 'Listening', color: 'bg-green-500' };
      case 'thinking':
        return { text: 'Thinking...', color: 'bg-blue-500' };
      case 'speaking':
        return { text: 'Speaking', color: 'bg-purple-500' };
      default:
        return { text: 'Offline', color: 'bg-gray-500' };
    }
  };

  const connectionStatus = getConnectionStatus();

  useDebugMode({
    enabled: process.env.NODE_END !== 'production',
  });

  async function handleSendMessage(message: string) {
    try {
      // Check if room is still connected before sending
      if (room.state !== 'connected') {
        console.warn('Cannot send message: room is not connected');
        return;
      }
      await send(message);
    } catch (error) {
      console.error('Error sending message:', error);
      toastAlert({
        title: 'Could not send message',
        description: 'The connection was closed. Please reconnect.',
      });
    }
  }

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === 'connecting'
              ? 'Agent did not join the room. '
              : 'Agent connected but did not complete initializing. ';

          toastAlert({
            title: 'Session ended',
            description: (
              <p className="w-full">
                {reason}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.livekit.io/agents/start/voice-ai/"
                  className="whitespace-nowrap underline"
                >
                  See quickstart guide
                </a>
                .
              </p>
            ),
          });
          room.disconnect();
        }
      }, 20_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  return (
    <section
      ref={ref}
      inert={disabled}
      className={cn(
        'opacity-0',
        // prevent page scrollbar
        // when !chatOpen due to 'translate-y-20'
        !chatOpen && 'max-h-svh overflow-hidden'
      )}
    >
      {/* Agent Selector - Top Bar (offset to not overlap menu button) */}
      {sessionStarted && (
        <div className="fixed top-4 left-20 z-50">
          <AgentSelector
            selectedAgentId={selectedAgent.id}
            onSelectAgent={setSelectedAgent}
            disabled={false}
          />
        </div>
      )}

      {/* Latency Monitor - Bottom Right */}
      {sessionStarted && <LatencyMonitor collapsed={true} />}

      {/* Navigation Sidebar - Lindy-style */}
      <NavigationSidebar isOpen={navSidebarOpen} onClose={() => setNavSidebarOpen(false)} />

      {/* Conversation History Sidebar */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      <ChatMessageView
        className={cn(
          'mx-auto min-h-svh w-full max-w-2xl px-3 pt-32 pb-40 transition-[opacity,translate] duration-300 ease-out md:px-0 md:pt-36 md:pb-48',
          chatOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-20 opacity-0'
        )}
      >
        <div className="space-y-4 whitespace-pre-wrap">
          {/* Welcome Message with Quick Actions */}
          {showWelcome && messages.length === 0 && sessionStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="space-y-3 py-12 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block text-6xl"
                >
                  👋
                </motion.div>
                <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
                  Hi! I&apos;m Nova
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your AI voice assistant with macOS integration and web search
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => send('What can you do?')}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 transition-all hover:scale-105 dark:border-blue-800 dark:from-blue-950/50 dark:to-blue-900/50"
                >
                  <span className="text-2xl transition-transform group-hover:scale-110">💡</span>
                  <span className="text-sm font-medium">What can you do?</span>
                </button>

                <button
                  onClick={() => send('Search latest AI news')}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 transition-all hover:scale-105 dark:border-purple-800 dark:from-purple-950/50 dark:to-purple-900/50"
                >
                  <span className="text-2xl transition-transform group-hover:scale-110">🔍</span>
                  <span className="text-sm font-medium">Latest AI News</span>
                </button>

                <button
                  onClick={() => send("What's the weather like?")}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 transition-all hover:scale-105 dark:border-green-800 dark:from-green-950/50 dark:to-green-900/50"
                >
                  <span className="text-2xl transition-transform group-hover:scale-110">🌤️</span>
                  <span className="text-sm font-medium">Check Weather</span>
                </button>

                <button
                  onClick={() => send('Tell me a fun fact')}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100 p-4 transition-all hover:scale-105 dark:border-pink-800 dark:from-pink-950/50 dark:to-pink-900/50"
                >
                  <span className="text-2xl transition-transform group-hover:scale-110">🎲</span>
                  <span className="text-sm font-medium">Fun Fact</span>
                </button>
              </div>

              <div className="space-y-2 text-center text-xs text-gray-500 dark:text-gray-500">
                <p>💬 Type or speak to get started</p>
                <p>🎤 Press space to talk • 📝 Type in the box below</p>
              </div>
            </motion.div>
          )}
          {messages.length > 0 && isHistoricalMessage(messages[0]) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-blue-100/50 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-6 py-4 shadow-sm dark:border-blue-900/30 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30"
            >
              <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Previous Conversation
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Continuing from where we left off
                  </p>
                </div>
              </div>
              <div className="absolute top-4 right-4 opacity-10">
                <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
                </svg>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((message: ReceivedChatMessage, index: number) => {
              // Check if we need to show the "Current Session" divider
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showDivider =
                prevMessage && isHistoricalMessage(prevMessage) && !isHistoricalMessage(message);

              const isHistorical = isHistoricalMessage(message);

              return (
                <React.Fragment key={message.id}>
                  {showDivider && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative my-8"
                    >
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="border-gradient-to-r w-full border-t from-transparent via-gray-300 to-transparent dark:via-gray-700" />
                      </div>
                      <div className="relative flex justify-center">
                        <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-2 shadow-lg">
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          <span className="text-sm font-bold tracking-wide text-white">
                            NEW SESSION
                          </span>
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={cn(
                      'group relative',
                      isHistorical && 'opacity-70 transition-opacity hover:opacity-100'
                    )}
                  >
                    <div
                      className={cn(
                        'relative rounded-xl transition-all',
                        isHistorical && 'bg-gray-50/50 p-3 dark:bg-gray-900/30'
                      )}
                    >
                      <ChatEntry hideName entry={message} />

                      {/* Copy Button */}
                      <button
                        onClick={() => copyToClipboard(message.message || '', message.id)}
                        className="absolute top-2 right-2 rounded-lg border border-gray-200 bg-white p-2 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <svg
                            className="h-4 w-4 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4 text-gray-600 dark:text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {isHistorical && (
                      <div className="absolute top-1/2 -left-3 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600" />
                      </div>
                    )}
                  </motion.div>
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </div>
      </ChatMessageView>

      <div className="bg-background fixed top-0 right-0 left-0 z-40 h-32 md:h-36">
        {/* Navigation Sidebar Toggle Button - Always Visible */}
        <motion.button
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          onClick={() => setNavSidebarOpen(!navSidebarOpen)}
          className="absolute top-4 left-4 z-50 rounded-full border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur-xl transition-transform hover:scale-110 dark:border-gray-800 dark:bg-gray-900/90"
          title="Navigation Menu"
        >
          <svg
            className="h-5 w-5 text-gray-700 dark:text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </motion.button>

        {/* Connection Status Bar */}
        {sessionStarted && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="absolute top-4 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white/90 px-6 py-3 shadow-lg backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={cn('h-3 w-3 animate-pulse rounded-full', connectionStatus.color)} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {connectionStatus.text}
                </span>
              </div>

              {/* Divider */}
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />

              {/* Message Counter */}
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span className="font-medium">{messages.length}</span>
              </div>

              {/* Clear Button */}
              {messages.length > 0 && (
                <>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
                  <button
                    onClick={clearConversation}
                    className="flex items-center gap-1.5 text-sm text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Clear conversation"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* skrim */}
        <div className="from-background absolute bottom-0 left-0 h-12 w-full translate-y-full bg-gradient-to-b to-transparent" />
      </div>

      {/* Audio Visualizer - Replaces MediaTiles */}
      {sessionStarted && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <AudioVisualizer className="my-8" />
        </div>
      )}

      <div className="bg-background fixed right-0 bottom-0 left-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12">
        <motion.div
          key="control-bar"
          initial={{ opacity: 0, translateY: '100%' }}
          animate={{
            opacity: sessionStarted ? 1 : 0,
            translateY: sessionStarted ? '0%' : '100%',
          }}
          transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
        >
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            {appConfig.isPreConnectBufferEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                  transition: {
                    ease: 'easeIn',
                    delay: messages.length > 0 ? 0 : 0.8,
                    duration: messages.length > 0 ? 0.2 : 0.5,
                  },
                }}
                aria-hidden={messages.length > 0}
                className={cn(
                  'absolute inset-x-0 -top-12 text-center',
                  sessionStarted && messages.length === 0 && 'pointer-events-none'
                )}
              >
                <p className="animate-text-shimmer inline-block !bg-clip-text text-sm font-semibold text-transparent">
                  Agent is listening, ask it a question
                </p>
              </motion.div>
            )}

            <AgentControlBar
              capabilities={capabilities}
              onChatOpenChange={setChatOpen}
              onSendMessage={handleSendMessage}
            />
          </div>
          {/* skrim */}
          <div className="from-background border-background absolute top-0 left-0 h-12 w-full -translate-y-full bg-gradient-to-t to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};
