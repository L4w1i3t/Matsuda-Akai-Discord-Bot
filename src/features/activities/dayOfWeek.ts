import { Message } from "discord.js";
import {
  checkPhrases,
  shouldRespond,
  safeChannelSend,
  getRandomElement,
} from "../../utils/helpers";

const DAY_PHRASES = [
  "what day is it",
  "what day of the week is it",
  "tell me the day",
  "which day is it",
  "what day today",
  "day of the week",
  "what's today",
  "whats today",
  "today is what day",
  "current day",
  "what day are we on",
  "which day of the week",
  "tell me what day it is",
  "what day is today",
  "day today",
  "day is it",
  "what's the day",
  "whats the day",
  "give me the day",
  "show me the day",
  "day check",
  "check day",
  "day status",
];

const DAY_RESPONSES = {
  Monday: [
    "https://tenor.com/view/mio-xenoblade-mio-xenoblade-xenoblade3-monday-gif-25756566",
  ],
  Tuesday: [
    "https://tenor.com/view/yukari-yukari-takeba-takeba-tuesday-persona-persona3-gif-25179490",
  ],
  Wednesday: [
    "https://tenor.com/view/eunie-xenoblade-xenoblade3-euniewednesday-its-eunie-gif-26486078",
  ],
  Thursday: ["https://tenor.com/view/aerith-gif-15519481347988923819"],
  Friday: [
    "https://tenor.com/view/persona-3-fuuka-fuuka-yamagishi-fuuka-fridya-fuuka-friday-gif-4308770182909675284",
    "https://tenor.com/view/happy-friday-funky-monkey-pinkus-gif-27320337",
  ],
  Saturday: [
    "https://tenor.com/view/chie-satonaka-satonaka-chie-saturday-satonaka-saturday-gif-21357663",
  ],
  Sunday: ["sunday."],
};

export class DayOfWeekHandler {
  static checkPhrases(messageContent: string): { dayOfWeek: boolean } {
    return {
      dayOfWeek: checkPhrases(messageContent, DAY_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    try {
      const currentDay = new Date().toLocaleDateString("en-US", {
        weekday: "long",
      }) as keyof typeof DAY_RESPONSES;
      const responses = DAY_RESPONSES[currentDay];

      if (responses && responses.length > 0) {
        const response = getRandomElement(responses);
        await safeChannelSend(message.channel, response);
      } else {
        // Fallback if no responses defined for the day
        await safeChannelSend(message.channel, `Today is ${currentDay}.`);
      }
    } catch (error) {
      console.error("Error sending day of week:", error);
      await safeChannelSend(
        message.channel,
        "I can't seem to remember what day it is...",
      );
    }
  }
}
