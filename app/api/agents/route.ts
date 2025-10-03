import { NextResponse } from 'next/server';
import { AGENT_PROFILES } from '@/components/agent-selector';

// GET /api/agents - List all available agents
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      agents: AGENT_PROFILES,
      count: AGENT_PROFILES.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Select/activate an agent
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentId } = body;

    const agent = AGENT_PROFILES.find((a) => a.id === agentId);

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent,
      message: `Agent ${agent.name} activated`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to activate agent' },
      { status: 500 }
    );
  }
}
