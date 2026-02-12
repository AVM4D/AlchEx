// Pluggable Content Moderation Service
// Supports basic profanity/spam detection with future OpenAI integration

export interface ModerationResult {
  isClean: boolean;
  flags: string[];
  confidence: number;
}

export interface ContentModerationProvider {
  moderate(content: string): Promise<ModerationResult>;
}

// Basic built-in moderation
class BasicModerationProvider implements ContentModerationProvider {
  private profanityList = [
    // Add profanity words as needed — keeping empty for clean codebase
  ];

  private spamPatterns = [
    /(.)\1{5,}/i, // Repeated characters
    /(buy|sell|discount|free money|click here|subscribe)/gi, // Spam keywords
    /https?:\/\/[^\s]+/gi, // URLs (flag for review)
  ];

  async moderate(content: string): Promise<ModerationResult> {
    const flags: string[] = [];
    const lowerContent = content.toLowerCase();

    // Profanity check
    for (const word of this.profanityList) {
      if (lowerContent.includes(word)) {
        flags.push('PROFANITY');
        break;
      }
    }

    // Spam check
    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        flags.push('POTENTIAL_SPAM');
        break;
      }
    }

    // Duplicate/repetitive content
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    if (words.length > 5 && uniqueWords.size / words.length < 0.3) {
      flags.push('REPETITIVE_CONTENT');
    }

    return {
      isClean: flags.length === 0,
      flags,
      confidence: flags.length === 0 ? 1.0 : 0.7,
    };
  }
}

// Future OpenAI moderation provider
class OpenAIModerationProvider implements ContentModerationProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async moderate(content: string): Promise<ModerationResult> {
    // TODO: Implement OpenAI moderation API call
    // POST https://api.openai.com/v1/moderations
    return { isClean: true, flags: [], confidence: 1.0 };
  }
}

// Service factory
export class ContentModerationService {
  private provider: ContentModerationProvider;

  constructor(provider?: ContentModerationProvider) {
    this.provider = provider || new BasicModerationProvider();
  }

  async moderate(content: string): Promise<ModerationResult> {
    return this.provider.moderate(content);
  }

  setProvider(provider: ContentModerationProvider) {
    this.provider = provider;
  }
}

export const contentModerationService = new ContentModerationService();
