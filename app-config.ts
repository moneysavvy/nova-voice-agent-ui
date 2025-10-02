import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Nova',
  pageTitle: 'Nova Voice Assistant',
  pageDescription: 'Your AI voice assistant - Ask about weather, time, or schedule meetings',

  supportsChatInput: true,
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/lk-logo.svg',
  accent: '#002cf2',
  logoDark: '/lk-logo-dark.svg',
  accentDark: '#1fd5f9',
  startButtonText: 'Talk to Nova',

  agentName: undefined,
};
