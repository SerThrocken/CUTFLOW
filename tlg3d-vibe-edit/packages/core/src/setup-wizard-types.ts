// ===== SETUP WIZARD STATE & TYPES =====

export interface SetupWizardState {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  
  // System Detection
  systemSpecs: {
    gpuVram: number;
    cpuGeneration: string;
    ramAvailable: number;
    osType: 'windows' | 'macos' | 'linux';
  };

  // Messaging Platforms
  messagingPlatforms: {
    discord: {
      enabled: boolean;
      botToken?: string;
      verified: boolean;
    };
    telegram: {
      enabled: boolean;
      botToken?: string;
      verified: boolean;
    };
    slack: {
      enabled: boolean;
      botToken?: boolean;
      verified: boolean;
    };
    sms: {
      enabled: boolean;
      twilioAccountSid?: string;
      twilioAuthToken?: string;
      twilioPhoneNumber?: string;
      verified: boolean;
    };
  };

  // LLM Provider Selection
  llmConfig: {
    primaryProvider: 'local' | 'openrouter' | 'openai' | 'groq' | 'mistral' | 'deepseek';
    fallbackProvider?: string;
    localModelsEnabled: boolean;
    selectedLocalModels: string[];
    apiKeys: Record<string, string>;
  };

  // Animation & Effects Preferences
  animationPreferences: {
    transitionSpeed: 'slow' | 'normal' | 'fast';
    defaultTransitionType: 'fade' | 'slide' | 'wipe' | 'dissolve' | 'zoom';
    enableColorGrading: boolean;
    colorGradingPreset: 'neutral' | 'warm' | 'cool' | 'cinematic';
    enableParticleEffects: boolean;
    particleDensity: 'low' | 'medium' | 'high';
  };

  // Video Editing Defaults
  editingPreferences: {
    defaultResolution: '720p' | '1080p' | '1440p' | '4k';
    defaultFramerate: 24 | 30 | 60;
    autoSceneDetection: boolean;
    autoColorGrade: boolean;
    enableSubtitles: boolean;
    subtitleLanguage: string;
  };

  // Agentic Features
  agenticFeatures: {
    scriptGeneration: boolean;
    voiceoverSynthesis: boolean;
    sceneDetection: boolean;
    autoColorCorrection: boolean;
    motionSmoothing: boolean;
    styleTransfer: boolean;
    subtitleGeneration: boolean;
    autoEditing: boolean;
  };

  // Theme Selection
  themePreferences: {
    theme: 'tlg3d-default' | 'tlg3d-light' | 'tlg3d-neon';
    customTheme?: any;
  };

  // User Info
  userInfo: {
    username: string;
    email?: string;
    displayName?: string;
  };
}

export const INITIAL_WIZARD_STATE: SetupWizardState = {
  currentStep: 1,
  totalSteps: 8,
  completed: false,
  
  systemSpecs: {
    gpuVram: 0,
    cpuGeneration: '',
    ramAvailable: 0,
    osType: 'linux',
  },

  messagingPlatforms: {
    discord: { enabled: false, verified: false },
    telegram: { enabled: false, verified: false },
    slack: { enabled: false, verified: false },
    sms: { enabled: false, verified: false },
  },

  llmConfig: {
    primaryProvider: 'openrouter',
    localModelsEnabled: false,
    selectedLocalModels: [],
    apiKeys: {},
  },

  animationPreferences: {
    transitionSpeed: 'normal',
    defaultTransitionType: 'fade',
    enableColorGrading: true,
    colorGradingPreset: 'cinematic',
    enableParticleEffects: false,
    particleDensity: 'low',
  },

  editingPreferences: {
    defaultResolution: '1080p',
    defaultFramerate: 30,
    autoSceneDetection: true,
    autoColorGrade: true,
    enableSubtitles: true,
    subtitleLanguage: 'en',
  },

  agenticFeatures: {
    scriptGeneration: true,
    voiceoverSynthesis: true,
    sceneDetection: true,
    autoColorCorrection: true,
    motionSmoothing: false,
    styleTransfer: false,
    subtitleGeneration: true,
    autoEditing: false,
  },

  themePreferences: {
    theme: 'tlg3d-default',
  },

  userInfo: {
    username: '',
  },
};

// ===== STEP DEFINITIONS =====

export const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Welcome to TLG3D',
    description: 'Let\'s set up your AI video editing suite',
    icon: '🎬',
    estimated: '2 min',
  },
  {
    id: 2,
    title: 'System Detection',
    description: 'Scan your hardware capabilities',
    icon: '🖥️',
    estimated: '1 min',
  },
  {
    id: 3,
    title: 'Messaging Platforms',
    description: 'Connect Discord, Telegram, Slack, or SMS',
    icon: '💬',
    estimated: '5 min',
  },
  {
    id: 4,
    title: 'AI Models',
    description: 'Choose local offline or cloud-based models',
    icon: '🤖',
    estimated: '3 min',
  },
  {
    id: 5,
    title: 'Animation & Effects',
    description: 'Set your default video effects and transitions',
    icon: '✨',
    estimated: '3 min',
  },
  {
    id: 6,
    title: 'Editing Preferences',
    description: 'Configure video resolution, frame rate, and auto-features',
    icon: '🎞️',
    estimated: '2 min',
  },
  {
    id: 7,
    title: 'Agentic Features',
    description: 'Enable AI-powered automation features',
    icon: '🤝',
    estimated: '2 min',
  },
  {
    id: 8,
    title: 'Theme & Personalization',
    description: 'Choose your UI theme and finalize setup',
    icon: '🎨',
    estimated: '1 min',
  },
];

// ===== VALIDATION RULES =====

export const validateStep = (stepId: number, state: SetupWizardState): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  switch (stepId) {
    case 3: // Messaging
      const hasMessaging = Object.values(state.messagingPlatforms).some(p => p.enabled);
      if (!hasMessaging) {
        errors.push('Please enable at least one messaging platform');
      }
      break;

    case 4: // Models
      if (!state.llmConfig.primaryProvider) {
        errors.push('Please select a primary LLM provider');
      }
      if (state.llmConfig.primaryProvider !== 'local' && !state.llmConfig.apiKeys[state.llmConfig.primaryProvider]) {
        errors.push(`API key required for ${state.llmConfig.primaryProvider}`);
      }
      break;

    case 1: // User Info
      if (!state.userInfo.username || state.userInfo.username.length < 2) {
        errors.push('Username must be at least 2 characters');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
