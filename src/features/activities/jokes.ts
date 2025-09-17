import { Message } from "discord.js";
import {
  checkPhrases,
  getRandomElement,
  shouldRespond,
  safeChannelSend,
  delay,
} from "../../utils/helpers";
import axios from "axios";

const JOKE_PHRASES = [
  "tell me a joke",
  "give me a joke",
  "i want to hear a joke",
  "joke please",
  "another joke",
  "gimme a joke",
  "joke, please",
  "make me laugh",
  "say something funny",
  "tell a joke",
  "share a joke",
  "got any jokes",
  "know any jokes",
  "funny joke",
  "good joke",
  "crack a joke",
  "joke time",
  "i need a laugh",
  "cheer me up",
  "something humorous",
  "be funny",
  "entertain me",
  "amuse me",
  "got anything funny",
  "make me giggle",
  "say a joke",
  "tell me something funny",
  "i want to laugh",
  "need a joke",
  "joke me",
  "funny please",
  "humor me",
];

const FALLBACK_JOKES = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why don't skeletons fight each other? They don't have the guts.",
  "I'm reading a book about anti-gravity. It's impossible to put down!",
  "Why did the scarecrow win an award? He was outstanding in his field!",
  "I used to hate facial hair, but then it grew on me.",
  "What do you call a fake noodle? An impasta!",
  "Why don't eggs tell jokes? They'd crack each other up!",
];

export class JokesHandler {
  static checkPhrases(messageContent: string): { jokes: boolean } {
    return {
      jokes: checkPhrases(messageContent, JOKE_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    try {
      // 1% chance to ping a random member instead of telling a joke (Easter egg)
      if (Math.random() < 0.01 && message.guild) {
        const members = message.guild.members.cache.filter(
          (member) => !member.user.bot,
        );
        if (members.size > 0) {
          const randomMember = getRandomElement(Array.from(members.values()));
          await safeChannelSend(message.channel, `${randomMember.toString()}`);
          return;
        }
      }

      // Try to fetch a joke from the API with timeout
      try {
        const response = (await Promise.race([
          axios.get("https://official-joke-api.appspot.com/random_joke"),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("API Timeout")), 5000),
          ),
        ])) as any;

        if (response?.data?.setup && response?.data?.punchline) {
          const joke = response.data;

          // Send setup first
          await safeChannelSend(message.channel, joke.setup);

          // Add suspense with a delay
          await delay(2000 + Math.random() * 2000); // 2-4 second delay

          // Send punchline
          await safeChannelSend(message.channel, joke.punchline);
          return;
        }

        throw new Error("Invalid API response");
      } catch (apiError) {
        console.log("API failed, using fallback joke:", apiError);

        // Use fallback jokes
        const fallbackJoke = getRandomElement(FALLBACK_JOKES);
        await safeChannelSend(message.channel, fallbackJoke);
      }
    } catch (error) {
      console.error("Error in jokes handler:", error);
      await safeChannelSend(
        message.channel,
        "I'm sorry, I can't think of any good jokes right now...",
      );
    }
  }
}
