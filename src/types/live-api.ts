export type LiveConfig = {
  model: string;
  generationConfig?: {
    responseModalities?: string | string[];
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    speechConfig?: {
      voiceConfig?: {
        prebuiltVoiceConfig?: {
          voiceName: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";
        };
      };
    };
  };
  systemInstruction?: {
    parts: {
      text: string;
    }[];
  };
  tools?: Array<{ googleSearch: {} } | { codeExecution: {} }>;
  // Configure Voice Activity Detection for background noise reduction
  realtimeInputConfig?: {
    automaticActivityDetection?: {
      // Disable automatic detection (client sends activityStart/activityEnd manually)
      disabled?: boolean;
      // How sensitive to detect start of speech
      // LOW = less sensitive (clearer speech required), HIGH = more sensitive (picks up subtle speech)
      startOfSpeechSensitivity?: 'START_SENSITIVITY_LOW' | 'START_SENSITIVITY_HIGH';
      // How sensitive to detect end of speech
      // LOW = waits longer (good for natural pauses), HIGH = ends quickly (better for noisy environments)
      endOfSpeechSensitivity?: 'END_SENSITIVITY_LOW' | 'END_SENSITIVITY_HIGH';
      // Milliseconds of audio to capture before speech starts
      prefixPaddingMs?: number;
      // Milliseconds of silence before considering speech ended
      silenceDurationMs?: number;
    };
  };
  // Add transcription support with explicit language configuration
  inputAudioTranscription?: {
    language?: string;
    languageCode?: string;
  };
  outputAudioTranscription?: {
    language?: string;
    languageCode?: string;
  };
};

export type LiveIncomingMessage =
  | {
    serverContent: {
      modelTurn?: {
        parts: {
          text?: string;
          inlineData?: {
            mimeType: string;
            data: string;
          };
        }[];
      };
      inputTranscription?: {
        text: string;
      };
      outputTranscription?: {
        text: string;
      };
      turnComplete?: boolean;
      interrupted?: boolean;
    };
  }
  | {
    setupComplete: {};
  }
  | {
    toolCall: {
      functionCalls: {
        name: string;
        args: any;
        id: string;
      }[];
    };
  }
  | {
    toolCallCancellation: {
      ids: string[];
    };
  };

export type LiveOutgoingMessage =
  | {
    setup: LiveConfig;
  }
  | {
    clientContent: {
      turns: {
        role: "user";
        parts: {
          text?: string;
          inlineData?: {
            mimeType: string;
            data: string;
          };
        }[];
      }[];
      turnComplete?: boolean;
    };
  }
  | {
    realtimeInput: {
      mediaChunks: {
        mimeType: string;
        data: string;
      }[];
    };
  }
  | {
    toolResponse: {
      functionResponses: {
        response: any;
        id: string;
      }[];
    };
  };
