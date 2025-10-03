'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('home');

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'agents', label: 'My Agents', icon: '🤖' },
  ];

  const recentItems = [
    { id: '1', name: 'Morning Briefing', timestamp: '2 hours ago' },
    { id: '2', name: 'Project Discussion', timestamp: '5 hours ago' },
    { id: '3', name: 'Daily Check-in', timestamp: 'Yesterday' },
  ];

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-72 border-r border-gray-700 bg-gray-900/95 backdrop-blur-xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-700 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌟</span>
                  <span className="text-lg font-semibold text-white">Nova</span>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                  aria-label="Close sidebar"
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

              {/* Search */}
              <div className="border-b border-gray-700 p-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 pl-10 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <svg
                    className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                {/* Main Navigation */}
                <div className="mb-6 space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                        activeSection === item.id
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* New Agent Button */}
                <button className="mb-6 flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-600 bg-gray-800/30 px-3 py-2.5 text-left text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-800/50 hover:text-white">
                  <span className="text-lg">➕</span>
                  New Agent
                </button>

                {/* Recents Section */}
                <div>
                  <h3 className="mb-2 px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Recents
                  </h3>
                  <div className="space-y-1">
                    {recentItems.map((item) => (
                      <button
                        key={item.id}
                        className="group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-800"
                      >
                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
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
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-white">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.timestamp}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </nav>

              {/* Footer */}
              <div className="border-t border-gray-700 p-4">
                {/* User Info / Settings */}
                <div className="flex items-center gap-3 rounded-lg bg-gray-800/50 px-3 py-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                    <span className="text-lg">👤</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">User Account</div>
                    <div className="text-xs text-gray-400">Settings & Preferences</div>
                  </div>
                  <button className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
