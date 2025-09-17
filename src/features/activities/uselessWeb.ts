import { Message } from "discord.js";
import { checkPhrases, getRandomElement } from "../../utils/helpers";
import axios from "axios";

const USELESS_WEB_PHRASES = [
  "me a useless site",
  "me a useless website",
  "cure my boredom",
  "me a website",
  "take me to a random site",
  "me a random site",
  "me a random website",
  "me a site",
  "me the useless web",
  "gimme a random site",
  "gimme a random website",
  "gimme a useless site",
  "gimme a useless website",
  "show me a random site",
  "show me a random website",
  "random website please",
  "random site please",
  "useless website please",
  "useless site please",
  "entertain me with a site",
  "entertain me with a website",
  "give me something random",
  "show me something random",
  "i'm bored give me a site",
  "i'm bored give me a website",
  "bored cure",
  "boredom cure",
  "waste my time",
  "something to waste time",
  "weird website",
  "weird site",
  "strange website",
  "strange site",
  "funny website",
  "funny site",
  "pointless website",
  "pointless site",
  "procrastination website",
  "procrastination site",
];

// Random websites to cure boredom
const RANDOM_WEBSITES = [
  "https://www.theuselessweb.com/",
];

export class UselessWebHandler {
  static checkPhrases(messageContent: string): { uselessWeb: boolean } {
    return {
      uselessWeb: checkPhrases(messageContent, USELESS_WEB_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    try {
      const randomWebsite = getRandomElement(RANDOM_WEBSITES);

      if ("send" in message.channel) {
        await message.channel.send(
          `You got it! Here's a little something to entertain you: ${randomWebsite}`,
        );
      }
    } catch (error) {
      console.error("Error fetching random website:", error);
      if ("send" in message.channel) {
        await message.channel.send(
          "Yeah, I dunno any off the top of my head. Sorry.",
        );
      }
    }
  }
}
