'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { AGENT_PROFILES, AgentProfile } from '@/components/agent-selector';

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Agents</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage and customize your AI assistants
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Start Session
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_PROFILES.map((agent) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <div
                className={`cursor-pointer rounded-2xl border-2 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:bg-gray-900 ${
                  selectedAgent === agent.id
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                }`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                {/* Avatar */}
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-4xl">
                  {agent.avatar}
                </div>

                {/* Info */}
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                  {agent.name}
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {agent.description}
                </p>

                {/* Details */}
                <div className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Voice</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {agent.voice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Personality</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {agent.personality}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="mt-4">
                  <Link
                    href={`/?agent=${agent.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Start Conversation
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                About Agents
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Each agent has a unique personality, voice, and conversation style. Select an agent
                to start a personalized conversation tailored to your needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
