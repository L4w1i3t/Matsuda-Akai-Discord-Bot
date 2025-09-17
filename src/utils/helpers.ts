import { Message } from "discord.js";

/**
 * Check if any of the provided phrases are found in the message content
 * Uses word boundaries for more precise matching to avoid false positives
 */
export function checkPhrases(
  messageContent: string,
  phrases: string[],
): boolean {
  if (!messageContent || !phrases.length) return false;

  const content = messageContent.toLowerCase().trim();
  return phrases.some((phrase) => {
    const normalizedPhrase = phrase.toLowerCase().trim();
    // For short phrases (1-2 words), use word boundaries for precision
    if (normalizedPhrase.split(" ").length <= 2) {
      const pattern = new RegExp(
        `\\b${normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      );
      return pattern.test(content);
    }
    // For longer phrases, use substring matching as intended
    return content.includes(normalizedPhrase);
  });
}

/**
 * Check if any of the provided regex patterns match the message content
 * Includes validation and error handling for malformed patterns
 */
export function checkPhrasesRegex(
  messageContent: string,
  patterns: string[],
): boolean {
  if (!messageContent || !patterns.length) return false;

  const content = messageContent.toLowerCase().trim();
  return patterns.some((pattern) => {
    try {
      const regex = new RegExp(pattern, "i");
      return regex.test(content);
    } catch (error) {
      console.warn(`Invalid regex pattern: ${pattern}`, error);
      // Fallback to simple string matching if regex is invalid
      const cleanPattern = pattern.replace(/\\b/g, "").replace(/\\/g, "");
      return content.includes(cleanPattern.toLowerCase());
    }
  });
}

/**
 * Check if the bot is addressed in the message and extract the command
 */
export function isBotAddressed(
  messageContent: string,
  botNames: string[] = ["matsuda", "matsu"],
): boolean {
  const content = messageContent.toLowerCase().trim();
  return botNames.some((name) => {
    const namePattern = new RegExp(`\\b${name.toLowerCase()}\\b`, "i");
    return namePattern.test(content);
  });
}

/**
 * Extract command content after bot name
 */
export function extractCommandFromBotAddress(
  messageContent: string,
  botNames: string[] = ["matsuda", "matsu"],
): string {
  const content = messageContent.trim();

  for (const name of botNames) {
    // Try different patterns: "matsuda command", "matsuda, command", "matsuda: command"
    // Use 's' flag to make '.' match newlines (equivalent to Python's re.DOTALL)
    const patterns = [
      new RegExp(`^${name}[,:]?\\s+(.+)$`, "is"), // "matsuda, command" or "matsuda: command"
      new RegExp(`^${name}\\s+(.+)$`, "is"), // "matsuda command"
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
  }

  return content; // Return original if no pattern matches
}

/**
 * Extract content after a specific phrase
 */
export function extractContentAfterPhrase(
  messageContent: string,
  phrase: string,
): string | null {
  const regex = new RegExp(`${phrase}:?\\s*(.*)`, "i");
  const match = messageContent.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Add delay to make responses feel more natural
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get random element from array
 */
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Check if user has admin permissions
 */
export function hasAdminPermissions(message: Message): boolean {
  if (!message.guild || !message.member) return false;
  return message.member.permissions.has("Administrator");
}

/**
 * Find channel by name in guild
 */
export function findChannelByName(message: Message, channelName: string) {
  if (!message.guild) return null;
  return message.guild.channels.cache.find(
    (channel) => channel.name === channelName && channel.isTextBased(),
  );
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string, maxLength: number = 2000): string {
  if (!input || typeof input !== "string") return "";

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[^\w\s\-.,!?'"()]/g, "") // Remove potentially harmful characters
    .replace(/\s+/g, " "); // Normalize whitespace
}

/**
 * Check if message is likely spam or abuse
 */
export function isSpamMessage(messageContent: string): boolean {
  if (!messageContent) return false;

  const content = messageContent.trim();

  // Check for excessive repetition
  const repeatedChars = /(.)\1{10,}/;
  if (repeatedChars.test(content)) return true;

  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (content.length > 10 && capsRatio > 0.7) return true;

  // Check for excessive emojis
  const emojiCount = (
    content.match(
      /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu,
    ) || []
  ).length;
  if (emojiCount > 15) return true;

  return false;
}

/**
 * Rate limiting check for users
 */
const userLastAction = new Map<string, number>();

export function isRateLimited(
  userId: string,
  cooldownMs: number = 3000,
): boolean {
  const now = Date.now();
  const lastAction = userLastAction.get(userId) || 0;

  if (now - lastAction < cooldownMs) {
    return true;
  }

  userLastAction.set(userId, now);
  return false;
}

/**
 * Check if bot should respond based on context
 */
export function shouldRespond(
  message: Message,
  requiresBotAddress: boolean = false,
): boolean {
  // Don't respond to bots
  if (message.author.bot) return false;

  // Don't respond to system messages
  if (message.system) return false;

  // Check if content exists
  if (!message.content || !message.content.trim()) return false;

  // Check for spam
  if (isSpamMessage(message.content)) return false;

  // Check rate limiting
  if (isRateLimited(message.author.id)) return false;

  // If bot address is required, check for it
  if (requiresBotAddress && !isBotAddressed(message.content)) return false;

  return true;
}

/**
 * Safe channel send with error handling
 */
export async function safeChannelSend(
  channel: any,
  content: string | { embeds?: any[]; content?: string },
): Promise<boolean> {
  try {
    if (!channel || !("send" in channel)) return false;

    // Handle string content
    if (typeof content === "string") {
      // Ensure content isn't empty and isn't too long
      if (!content || content.length === 0) return false;
      if (content.length > 2000) {
        content = content.slice(0, 1997) + "...";
      }
      await channel.send(content);
    } else {
      // Handle object content (embeds, etc.)
      await channel.send(content);
    }

    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
}

/**
 * Safe channel send that returns the message object for reactions
 */
export async function safeChannelSendWithMessage(
  channel: any,
  content: string | { embeds?: any[]; content?: string },
): Promise<any | null> {
  try {
    if (!channel || !("send" in channel)) return null;

    // Handle string content
    if (typeof content === "string") {
      // Ensure content isn't empty and isn't too long
      if (!content || content.length === 0) return null;
      if (content.length > 2000) {
        content = content.slice(0, 1997) + "...";
      }
      return await channel.send(content);
    } else {
      // Handle object content (embeds, etc.)
      return await channel.send(content);
    }
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}
