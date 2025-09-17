import { Message } from "discord.js";
import {
  shouldRespond,
  safeChannelSend,
  getRandomElement,
  isBotAddressed,
  extractCommandFromBotAddress,
} from "../../utils/helpers";

// More intelligent goodnight detection patterns
const GOODNIGHT_PATTERNS = [
  // Direct goodnight phrases
  "\\b(good\\s*night|goodnight|nighty\\s*night|night\\s*night)\\b",
  // Sleep-related phrases
  "\\b(sleep\\s*well|sweet\\s*dreams|sleep\\s*tight)\\b",
  // Bedtime phrases
  "\\b(going\\s*to\\s*(bed|sleep)|time\\s*for\\s*bed|bedtime|sleepy\\s*time)\\b",
  // Casual variations
  "\\b(gn|gnite|gnight|nite)\\b",
  // Activity-based
  "\\b(off\\s*to\\s*bed|hitting\\s*the\\s*hay|catch\\s*some\\s*(z|zs))\\b",
  // Time references
  "\\b(see\\s*you\\s*tomorrow|until\\s*tomorrow)\\b",
  // Simple night
  "\\bnight\\b",
];

// Context patterns that should NOT trigger goodnight (to avoid false positives)
const EXCLUDE_PATTERNS = [
  // Questions about night/sleep
  "\\b(what|how|when|where|why|which|who|can|could|would|should)\\b.*\\b(night|sleep|bed)\\b",
  // Past tense references
  "\\b(last\\s*night|yesterday\\s*night|that\\s*night)\\b",
  // Negatives
  "\\b(not|never|don't|doesn't|won't|can't|shouldn't)\\b.*\\b(night|sleep|bed)\\b",
  // Other contexts
  "\\b(all\\s*night|every\\s*night|day\\s*and\\s*night|night\\s*and\\s*day)\\b",
  // Quoting someone
  "['\"][^'\"]*\\b(night|goodnight|sleep)\\b[^'\"]*['\"]",
];

const GOODNIGHT_RESPONSES = [
  "Nighty night!",
  "Sweet dreams!",
  "Sleep well!",
  "Good night! Rest up!",
  "Night night! See you tomorrow!",
  "Sleep tight!",
  "Pleasant dreams!",
  "Good night! Don't let the bed bugs bite!",
  "Rest well! Catch you later!",
  "Night! Hope you sleep well!",
  "Good night! Dream of electric sheep! 🐑",
  "Sleep well! Tomorrow's another day!",
  "Nighty night! Time to recharge!",
  "Good night! May your dreams be filled with memes!",
];

export class GoodnightHandler {
  static checkPhrases(messageContent: string): { goodnight: boolean } {
    const content = messageContent.toLowerCase().trim();

    // Don't match if the message is too long (likely not a simple goodnight)
    if (content.length > 150) return { goodnight: false };

    // Check for exclusion patterns first (avoid false positives)
    for (const excludePattern of EXCLUDE_PATTERNS) {
      if (new RegExp(excludePattern, "i").test(content)) {
        return { goodnight: false };
      }
    }

    // Check if bot is specifically addressed
    const botAddressed = isBotAddressed(content);

    if (botAddressed) {
      // If bot is addressed, extract the command part and check for goodnight patterns
      const command = extractCommandFromBotAddress(content).toLowerCase();

      // Check if the command contains goodnight patterns
      for (const pattern of GOODNIGHT_PATTERNS) {
        if (new RegExp(pattern, "i").test(command)) {
          return { goodnight: true };
        }
      }

      // Special handling for "night [botname]" format
      if (/^(good\s*)?night\s*(matsuda|matsu)?[!.]*$/.test(command)) {
        return { goodnight: true };
      }
    } else {
      // If bot is not specifically addressed, be more selective
      // Only respond to very clear, standalone goodnight messages
      const standalonePatterns = [
        "^\\s*(good\\s*night|goodnight|nighty\\s*night|night\\s*night)\\s*[!.]*\\s*$",
        "^\\s*(gn|gnite|gnight)\\s*[!.]*\\s*$",
        "^\\s*(good\\s*night|goodnight)\\s+(everyone|all|chat)\\s*[!.]*\\s*$",
        "^\\s*(sleep\\s*well|sweet\\s*dreams|sleep\\s*tight)\\s*[!.]*\\s*$",
        "^\\s*(going\\s*to\\s*bed|time\\s*for\\s*bed|off\\s*to\\s*bed)\\s*[!.]*\\s*$",
      ];

      for (const pattern of standalonePatterns) {
        if (new RegExp(pattern, "i").test(content)) {
          return { goodnight: true };
        }
      }
    }

    return { goodnight: false };
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    try {
      const response = getRandomElement(GOODNIGHT_RESPONSES);
      const personalizedResponse = response.replace(
        /Good night|Night/,
        (match) => {
          return Math.random() > 0.5
            ? `${match}, ${message.author.toString()}`
            : match;
        },
      );

      await safeChannelSend(message.channel, personalizedResponse);
    } catch (error) {
      console.error("Error sending goodnight response:", error);
      // Fallback response
      await safeChannelSend(message.channel, "Nighty night!");
    }
  }
}
