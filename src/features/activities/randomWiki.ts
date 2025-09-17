import { Message } from "discord.js";
import {
  checkPhrases,
  shouldRespond,
  safeChannelSend,
  getRandomElement,
} from "../../utils/helpers";
import axios from "axios";

const RANDOMWIKI_PHRASES = [
  "random wikipedia",
  "random wiki",
  "wikipedia article",
  "wiki article",
  "random wikipedia page",
  "random wiki page",
  "show me a random wikipedia",
  "give me a random wikipedia",
  "random wikipedia article",
  "random wiki article",
  "surprise me with wikipedia",
  "wikipedia random",
  "wiki random",
  "random page from wikipedia",
  "random article from wikipedia",
  "wikipedia me",
  "wiki me",
  "show me wikipedia",
  "random knowledge from wikipedia",
  "wikipedia surprise",
  "wiki surprise",
  "random wikipedia entry",
  "random wiki entry",
  "take me to wikipedia",
  "wikipedia adventure",
  "wiki adventure",
  "random learning",
  "teach me from wikipedia",
  "wikipedia rabbit hole",
  "wiki rabbit hole",
];

const FALLBACK_ARTICLES = [
  {
    title: "Rubber Duck Debugging",
    extract: "Rubber duck debugging is an informal term used in software engineering to refer to a method of debugging code by articulating a problem in spoken or written natural language.",
    url: "https://en.wikipedia.org/wiki/Rubber_duck_debugging"
  },
  {
    title: "Petrichor",
    extract: "Petrichor is the earthy scent produced when rain falls on dry soil. The word is constructed from Greek petros, meaning 'stone', and īchōr, the fluid that flows in the veins of the gods in Greek mythology.",
    url: "https://en.wikipedia.org/wiki/Petrichor"
  },
  {
    title: "Sonder",
    extract: "Sonder is a neologism coined by John Koenig for his project The Dictionary of Obscure Sorrows. It refers to the profound feeling of realizing that everyone, including strangers passing in the street, has a life as complex and vivid as your own.",
    url: "https://en.wikipedia.org/wiki/Sonder_(emotion)"
  },
  {
    title: "Baader-Meinhof Phenomenon",
    extract: "The Baader-Meinhof phenomenon, also known as frequency illusion, is a cognitive bias where something you recently learned about suddenly seems to appear everywhere.",
    url: "https://en.wikipedia.org/wiki/Frequency_illusion"
  },
  {
    title: "Dunning-Kruger Effect",
    extract: "The Dunning-Kruger effect is a cognitive bias whereby people with low ability at a task overestimate their ability. It is related to the cognitive bias of illusory superiority.",
    url: "https://en.wikipedia.org/wiki/Dunning%E2%80%93Kruger_effect"
  }
];

export class RandomWikiHandler {
  static checkPhrases(messageContent: string): { randomWiki: boolean } {
    return {
      randomWiki: checkPhrases(messageContent, RANDOMWIKI_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    try {
      // First, get a random article title from Wikipedia
      const randomResponse = await Promise.race([
        axios.get("https://en.wikipedia.org/api/rest_v1/page/random/summary"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 7000)
        ),
      ]) as any;

      if (randomResponse?.data?.title && randomResponse?.data?.extract) {
        const title = randomResponse.data.title;
        const extract = randomResponse.data.extract;
        const pageUrl = randomResponse.data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;

        // Truncate extract if it's too long
        let description = extract;
        if (description.length > 400) {
          description = description.substring(0, 400) + "...";
        }

        const wikiMessage = `**${title}**\n\n${description}\n\n🔗 ${pageUrl}`;

        await safeChannelSend(message.channel, wikiMessage);
        return;
      }

      // Fallback if API response is invalid
      throw new Error("Invalid API response");
    } catch (error) {
      console.error("Error fetching random Wikipedia article:", error);

      // Use fallback articles
      const fallbackArticle = getRandomElement(FALLBACK_ARTICLES);
      const fallbackMessage = `**${fallbackArticle.title}**\n\n${fallbackArticle.extract}\n\n🔗 ${fallbackArticle.url}`;
      
      const success = await safeChannelSend(message.channel, fallbackMessage);

      if (!success) {
        // Last resort response
        await safeChannelSend(
          message.channel,
          "Sorry, I couldn't fetch a Wikipedia article right now. Try again later!"
        );
      }
    }
  }
}
