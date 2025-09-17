import { Message } from "discord.js";
import {
  checkPhrases,
  shouldRespond,
  safeChannelSend,
  getRandomElement,
} from "../../utils/helpers";
import axios from "axios";

const FUNFACT_PHRASES = [
  "me a fun fact",
  "me a random fun fact",
  "me another fun fact",
  "tell a fun fact",
  "give a fun fact",
  "i want to hear a fun fact",
  "i want a fun fact",
  "gimme a fun fact",
  "share a fun fact",
  "fun fact please",
  "tell me a fun fact",
  "give me a fun fact",
  "random fact",
  "interesting fact",
  "cool fact",
  "fact please",
  "another fact",
  "know any facts",
  "got any facts",
  "teach me something",
  "something interesting",
  "random trivia",
  "trivia fact",
  "tell me something cool",
  "share something interesting",
  "educate me",
  "blow my mind",
  "interesting trivia",
  "cool trivia",
  "something random",
  "random knowledge",
  "drop some knowledge",
  "fact time",
  "trivia time",
  "tell me trivia",
];

const FALLBACK_FACTS = [
  "Bananas are berries, but strawberries aren't!",
  "A group of flamingos is called a 'flamboyance'.",
  "Honey never spoils - archaeologists have found 3000-year-old honey that's still edible!",
  "Octopuses have three hearts and blue blood.",
  "A day on Venus is longer than its year.",
  "Wombat poop is cube-shaped!",
  "There are more possible games of chess than atoms in the observable universe.",
];

export class FunFactHandler {
  static checkPhrases(messageContent: string): { funFact: boolean } {
    return {
      funFact: checkPhrases(messageContent, FUNFACT_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    try {
      // Try to get a fact from the API with timeout
      const response = (await Promise.race([
        axios.get("https://uselessfacts.jsph.pl/random.json?language=en"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000),
        ),
      ])) as any;

      if (response?.data?.text) {
        const funfact = response.data.text.trim();
        // Validate the fact isn't too long or empty
        if (funfact.length > 0 && funfact.length <= 1500) {
          await safeChannelSend(message.channel, funfact);
          return;
        }
      }

      // Fallback if API response is invalid
      throw new Error("Invalid API response");
    } catch (error) {
      console.error("Error fetching fun fact from API:", error);

      // Use fallback facts
      const fallbackFact = getRandomElement(FALLBACK_FACTS);
      const success = await safeChannelSend(message.channel, fallbackFact);

      if (!success) {
        // Last resort response
        await safeChannelSend(
          message.channel,
          "Yeah, I dunno any off the top of my head. Sorry.",
        );
      }
    }
  }
}
