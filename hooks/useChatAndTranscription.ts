import { useMemo, useEffect, useState } from 'react';
import {
  type ReceivedChatMessage,
  type TextStreamData,
  useChat,
  useRoomContext,
  useTranscriptions,
} from '@livekit/components-react';
import { transcriptionToChatMessage } from '@/lib/utils';

const HISTORY_KEY = 'nova_chat_history';
const MAX_HISTORY = 50;
const CONVERSATIONS_KEY = 'nova_conversations';
const MAX_CONVERSATIONS = 50;

interface ConversationMetadata {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
  preview: string;
}

interface UseChatAndTranscriptionOptions {
  conversationId?: string;
}

export default function useChatAndTranscription(options: UseChatAndTranscriptionOptions = {}) {
  const { conversationId = 'default' } = options;
  const transcriptions: TextStreamData[] = useTranscriptions();
  const chat = useChat();
  const room = useRoomContext();
  const [historicalMessages, setHistoricalMessages] = useState<Array<ReceivedChatMessage>>([]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistoricalMessages(parsed);
      }
    } catch (error) {
      console.warn('Could not load chat history:', error);
    }
  }, []);

  const mergedTranscriptions = useMemo(() => {
    const currentMessages: Array<ReceivedChatMessage> = [
      ...transcriptions.map((transcription) => transcriptionToChatMessage(transcription, room)),
      ...chat.chatMessages,
    ];

    // Combine historical and current messages
    const allMessages = [...historicalMessages, ...currentMessages];
    return allMessages.sort((a, b) => a.timestamp - b.timestamp);
  }, [transcriptions, chat.chatMessages, room, historicalMessages]);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (mergedTranscriptions.length > 0) {
      try {
        // Keep only last MAX_HISTORY messages
        const toSave = mergedTranscriptions.slice(-MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.warn('Could not save chat history:', error);
      }
    }
  }, [mergedTranscriptions]);

  // Auto-save conversation metadata
  useEffect(() => {
    if (mergedTranscriptions.length > 0) {
      try {
        // Generate conversation title from first user message
        const firstUserMessage = mergedTranscriptions.find(
          (msg) => msg.from?.identity !== 'agent' && msg.message
        );
        const title = firstUserMessage?.message?.substring(0, 50) || 'New Chat';

        // Get last message for preview
        const lastMessage = mergedTranscriptions[mergedTranscriptions.length - 1];
        const preview = lastMessage?.message?.substring(0, 100) || '';

        // Create/update conversation metadata
        const conversation: ConversationMetadata = {
          id: conversationId,
          title: title + (title.length >= 50 ? '...' : ''),
          timestamp: Date.now(),
          messageCount: mergedTranscriptions.length,
          preview: preview + (preview.length >= 100 ? '...' : ''),
        };

        // Save conversation data
        localStorage.setItem(
          `nova_conversation_${conversationId}`,
          JSON.stringify(mergedTranscriptions)
        );

        // Update conversations list
        const stored = localStorage.getItem(CONVERSATIONS_KEY);
        let conversations: ConversationMetadata[] = stored ? JSON.parse(stored) : [];

        // Remove existing entry for this conversation
        conversations = conversations.filter((c) => c.id !== conversationId);

        // Add updated conversation at the beginning
        conversations.unshift(conversation);

        // Keep only last MAX_CONVERSATIONS
        conversations = conversations.slice(0, MAX_CONVERSATIONS);

        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
      } catch (error) {
        console.warn('Could not save conversation metadata:', error);
      }
    }
  }, [mergedTranscriptions, conversationId]);

  return { messages: mergedTranscriptions, send: chat.send };
}
