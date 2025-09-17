import { Message } from "discord.js";
import {
  shouldRespond,
  safeChannelSend,
  getRandomElement,
  isBotAddressed,
  extractCommandFromBotAddress,
} from "../../utils/helpers";

// More intelligent hello detection with context awareness
const HELLO_PATTERNS = [
  // Direct greetings
  "\\b(hello|hi|hey|howdy|greetings|salutations)\\b",
  // Time-based greetings
  "\\b(good\\s+morning|morning|good\\s+afternoon|afternoon|good\\s+evening|evening)\\b",
  // Casual greetings
  "\\b(sup|wassup|whats?\\s+up|yo|hiya)\\b",
  // Friendly variations
  "\\b(hello\\s+there|hi\\s+there|hey\\s+there)\\b",
  "\\b(hello\\s+(everyone|all|chat)|hi\\s+(everyone|all|chat)|hey\\s+(everyone|all|chat))\\b",
];

// Context patterns that should NOT trigger hello (to avoid false positives)
const EXCLUDE_PATTERNS = [
  // Questions or commands (but exclude common greeting follow-ups)
  "\\b(what|when|where|why|which|who|can|could|would|should|tell|give|show|make|create)\\b(?!.*\\b(are\\s+you|doing|going)\\b)",
  // Exclude "how" except when it's "how are you" or similar greeting context
  "\\bhow\\b(?!.*\\b(are\\s+you|you\\s+doing|you\\s+been|things|life)\\b)",
  // Negatives
  "\\b(not|never|don't|doesn't|won't|can't|shouldn't)\\b",
  // Past tense references
  "\\b(said|told|mentioned|called)\\s+(hello|hi|hey)\\b",
  // Quoting someone
  "['\"][^'\"]*\\b(hello|hi|hey)\\b[^'\"]*['\"]",
];

const HELLO_RESPONSES = [
  "Hello there!",
  "Hey! How's it going?",
  "Hi! What's up?",
  "Howdy!",
  "Greetings!",
  "Hey there! Good to see you!",
  "Sup!",
  "Hello! Having a good day?",
  "Well hello there!",
  "Hey! Nice to see you around!",
  "Hi there! What brings you here?",
  "Greetings and salutations!",
  "Well well, if it isn't a friendly face!",
  "Hey! Great to see you!",
  "Hiya Papaya!",
];

export class HelloHandler {
  static checkPhrases(messageContent: string): { hello: boolean } {
    const content = messageContent.toLowerCase().trim();

    // Don't match if the message is too long (likely not a simple greeting)
    if (content.length > 100) return { hello: false };

    // Check for exclusion patterns first (avoid false positives)
    for (const excludePattern of EXCLUDE_PATTERNS) {
      if (new RegExp(excludePattern, "i").test(content)) {
        return { hello: false };
      }
    }

    // Check if this content itself contains bot addressing
    const botAddressed = isBotAddressed(content);

    if (botAddressed) {
      // If bot is addressed in the content, extract the command part and check for greetings
      const command = extractCommandFromBotAddress(content).toLowerCase();

      // Check if the command contains greeting patterns
      for (const pattern of HELLO_PATTERNS) {
        const regex = new RegExp(pattern, "i");
        if (regex.test(command)) {
          return { hello: true };
        }
      }
    } else {
      // If no bot addressing in the content, treat the content as the command
      // This handles cases where the message handler already extracted the command

      // First, check if it matches greeting patterns directly
      for (const pattern of HELLO_PATTERNS) {
        const regex = new RegExp(pattern, "i");
        if (regex.test(content)) {
          return { hello: true };
        }
      }

      // Also check standalone patterns for non-addressed messages
      const standalonePatterns = [
        "^\\s*(hello|hi|hey|howdy|greetings|yo|sup|wassup)\\s*[!.]*\\s*$",
        "^\\s*(good\\s+morning|morning|good\\s+afternoon|afternoon|good\\s+evening|evening)\\s*[!.]*\\s*$",
        "^\\s*(hello|hi|hey)\\s+(everyone|all|chat)\\s*[!.]*\\s*$",
      ];

      for (const pattern of standalonePatterns) {
        if (new RegExp(pattern, "i").test(content)) {
          return { hello: true };
        }
      }
    }

    return { hello: false };
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    try {
      const response = getRandomElement(HELLO_RESPONSES);

      // Handle special cases and general personalization
      let personalizedResponse: string;

      if (response === "Hiya Papaya!") {
        // Special handling for the cute play on words
        personalizedResponse =
          Math.random() > 0.5
            ? `Hiya Papaya, ${message.author.toString()}!`
            : "Hiya Papaya!";
      } else {
        // Improved personalization logic to handle context better
        if (Math.random() > 0.5) {
          // Personalize by adding the user mention
          personalizedResponse = response.replace(
            /\b(Hello|Hi|Hey|Hiya)(\s+there)?(!|\s)/g,
            (match, greeting, there, ending) => {
              if (there) {
                // If it's "Hey there" or similar, replace with "Hey there, @user"
                return `${greeting} there, ${message.author.toString()}${ending}`;
              } else {
                // If it's just "Hey" or similar, replace with "Hey, @user"
                return `${greeting}, ${message.author.toString()}${ending}`;
              }
            },
          );
        } else {
          // Don't personalize, use original response
          personalizedResponse = response;
        }
      }

      await safeChannelSend(message.channel, personalizedResponse);
    } catch (error) {
      console.error("Error sending hello response:", error);
      // Fallback response
      await safeChannelSend(
        message.channel,
        `Hello, ${message.author.toString()}!`,
      );
    }
  }
}
