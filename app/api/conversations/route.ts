import { NextResponse } from 'next/server';

export interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
  preview: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// GET /api/conversations - List all conversations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    // If specific conversation requested
    if (conversationId) {
      // In a real app, fetch from database
      // For now, return mock data
      return NextResponse.json({
        success: true,
        conversation: {
          id: conversationId,
          title: 'Sample Conversation',
          timestamp: Date.now(),
          messageCount: 0,
          preview: 'No messages yet',
          messages: [],
        },
      });
    }

    // Return list of conversations
    // In a real app, fetch from database
    return NextResponse.json({
      success: true,
      conversations: [],
      count: 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, messages } = body;

    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: title || 'New Conversation',
      timestamp: Date.now(),
      messageCount: messages?.length || 0,
      preview: messages?.[0]?.content || 'No messages yet',
      messages: messages || [],
    };

    // In a real app, save to database
    return NextResponse.json({
      success: true,
      conversation: newConversation,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations - Delete conversation
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID required' },
        { status: 400 }
      );
    }

    // In a real app, delete from database
    return NextResponse.json({
      success: true,
      message: `Conversation ${conversationId} deleted`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
