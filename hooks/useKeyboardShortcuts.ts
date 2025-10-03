import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// Predefined shortcuts
export const SHORTCUTS = {
  TOGGLE_MUTE: { key: 'm', description: 'Toggle microphone' },
  END_CALL: { key: 'e', description: 'End call' },
  CLOSE_MODAL: { key: 'Escape', description: 'Close modal/sidebar' },
  OPEN_NAV: { key: 'n', ctrlKey: true, description: 'Open navigation' },
  NEW_CONVERSATION: { key: 'n', metaKey: true, description: 'New conversation' },
  TOGGLE_CHAT: { key: 'c', ctrlKey: true, description: 'Toggle chat' },
} as const;
