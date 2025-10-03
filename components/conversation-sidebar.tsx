'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
  preview: string;
}

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({
  isOpen,
  onClose,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    const stored = localStorage.getItem('nova_conversations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConversations(parsed);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    }
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    localStorage.setItem('nova_conversations', JSON.stringify(updated));

    // Also delete the conversation data
    localStorage.removeItem(`nova_conversation_${id}`);

    // If deleting current conversation, load most recent or create new
    if (id === currentConversationId) {
      if (updated.length > 0) {
        onSelectConversation(updated[0].id);
      } else {
        onNewConversation();
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-80 border-r border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Conversations
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {conversations.length} total
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* New Conversation Button */}
              <div className="p-4">
                <button
                  onClick={() => {
                    onNewConversation();
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Conversation
                </button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
                {conversations.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-3 px-4 text-center">
                    <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        No conversations yet
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Start chatting with Nova to see your conversation history here
                      </p>
                    </div>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative"
                    >
                      <button
                        onClick={() => {
                          onSelectConversation(conversation.id);
                          onClose();
                        }}
                        className={cn(
                          'w-full rounded-xl p-4 text-left transition-all',
                          conversation.id === currentConversationId
                            ? 'border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm dark:border-blue-800 dark:from-blue-950/50 dark:to-purple-950/50'
                            : 'border-2 border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
                        )}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {conversation.title}
                          </h3>
                          <span className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                            {formatDate(conversation.timestamp)}
                          </span>
                        </div>
                        <p className="mb-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                          {conversation.preview}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                          {conversation.messageCount} messages
                        </div>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this conversation?')) {
                            deleteConversation(conversation.id);
                          }
                        }}
                        className="absolute top-3 right-3 rounded-lg border border-gray-200 bg-white p-1.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-red-950/30"
                        title="Delete conversation"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-red-600 dark:text-red-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
