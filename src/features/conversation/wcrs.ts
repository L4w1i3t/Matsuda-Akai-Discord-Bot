import { Message } from "discord.js";
import {
  checkPhrases,
  shouldRespond,
  safeChannelSend,
  getRandomElement,
} from "../../utils/helpers";

const WCRS_PHRASES = [
  "which community reigns supreme",
  "what community reigns supreme",
  "wcrs",
  "community reigns supreme",
  "reigns supreme",
  "which community is best",
  "what community is best",
  "best community",
  "supreme community",
  "top community",
  "which community wins",
  "what community wins",
  "winning community",
  "ultimate community",
  "which community rules",
  "what community rules",
  "ruling community",
];

const WCRS_RESPONSES = [
  "What do you think?",
  "Hmm, which one do you think?",
  "You tell me!",
  "Easy, it's [REDACTED]!",
];

export class WCRSHandler {
  static checkPhrases(messageContent: string): { wcrs: boolean } {
    return {
      wcrs: checkPhrases(messageContent, WCRS_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    try {
      const response = getRandomElement(WCRS_RESPONSES);
      await safeChannelSend(message.channel, response);
    } catch (error) {
      console.error("Error sending WCRS response:", error);
      // Fallback response
      await safeChannelSend(message.channel, "What do you think?");
    }
  }
}
