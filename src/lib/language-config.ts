/**
 * Language Configuration Utility
 * Handles language settings for speech recognition and transcription
 */

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  speechCode: string; // For Web Speech API
  geminiCode?: string; // For Gemini API (if different)
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    speechCode: 'en-US',
    geminiCode: 'en'
  },
  {
    code: 'es',
    name: 'Spanish',
    flag: '🇪🇸',
    speechCode: 'es-ES',
    geminiCode: 'es'
  },
  {
    code: 'fr',
    name: 'French',
    flag: '🇫🇷',
    speechCode: 'fr-FR',
    geminiCode: 'fr'
  },
  {
    code: 'de',
    name: 'German',
    flag: '🇩🇪',
    speechCode: 'de-DE',
    geminiCode: 'de'
  },
  {
    code: 'it',
    name: 'Italian',
    flag: '🇮🇹',
    speechCode: 'it-IT',
    geminiCode: 'it'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    flag: '🇵🇹',
    speechCode: 'pt-PT',
    geminiCode: 'pt'
  },
  {
    code: 'hi',
    name: 'Hindi',
    flag: '🇮🇳',
    speechCode: 'hi-IN',
    geminiCode: 'hi'
  },
  {
    code: 'ja',
    name: 'Japanese',
    flag: '🇯🇵',
    speechCode: 'ja-JP',
    geminiCode: 'ja'
  },
  {
    code: 'ko',
    name: 'Korean',
    flag: '🇰🇷',
    speechCode: 'ko-KR',
    geminiCode: 'ko'
  },
  {
    code: 'zh',
    name: 'Chinese (Mandarin)',
    flag: '🇨🇳',
    speechCode: 'zh-CN',
    geminiCode: 'zh'
  }
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0]; // English

/**
 * Get language configuration by language code
 */
export function getLanguageByCode(code: string): LanguageOption {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || DEFAULT_LANGUAGE;
}

/**
 * Get the user's preferred language from localStorage or browser settings
 */
export function getPreferredLanguage(): LanguageOption {
  // Check localStorage first
  const savedLanguage = localStorage.getItem('interview-language');
  if (savedLanguage) {
    const language = getLanguageByCode(savedLanguage);
    if (language) return language;
  }

  // Fall back to browser language
  const browserLang = navigator.language.split('-')[0];
  const language = getLanguageByCode(browserLang);
  return language || DEFAULT_LANGUAGE;
}

/**
 * Save language preference to localStorage
 */
export function saveLanguagePreference(languageCode: string): void {
  localStorage.setItem('interview-language', languageCode);
}

/**
 * Check if Web Speech API supports the given language
 */
export function isSpeechRecognitionSupported(languageCode: string): boolean {
  // This is a basic check - you might want to enhance this
  // by actually testing speech recognition capabilities
  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SpeechRecognition;
}

/**
 * Get appropriate language instruction text for different languages
 */
export function getLanguageInstructions(languageCode: string): string {
  const instructions: Record<string, string> = {
    en: "Please speak clearly in English during the interview.",
    es: "Por favor, habla claramente en español durante la entrevista.",
    fr: "Veuillez parler clairement en français pendant l'entretien.",
    de: "Bitte sprechen Sie während des Interviews deutlich auf Deutsch.",
    it: "Si prega di parlare chiaramente in italiano durante l'intervista.",
    pt: "Por favor, fale claramente em português durante a entrevista.",
    hi: "कृपया साक्षात्कार के दौरान स्पष्ट रूप से हिंदी में बोलें।",
    ja: "面接中は日本語ではっきりとお話しください。",
    ko: "인터뷰 중에는 한국어로 명확하게 말씀해 주세요.",
    zh: "请在面试过程中用普通话清晰地说话。"
  };
  
  return instructions[languageCode] || instructions.en;
}