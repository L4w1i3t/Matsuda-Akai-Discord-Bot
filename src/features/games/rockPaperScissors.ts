import { Message } from "discord.js";
import {
  checkPhrases,
  getRandomElement,
  shouldRespond,
  safeChannelSend,
  delay,
} from "../../utils/helpers";

const RPS_PHRASES = [
  "let's play rps",
  "let's play rock paper scissors",
  "play rps with me",
  "wanna play rps",
  "play rock paper scissors with me",
  "wanna play rock paper scissors",
  "lets play rps",
  "lets play rock paper scissors",
  "rock paper scissors",
  "rps game",
  "rps match",
  "play rps",
  "game of rps",
  "rock paper scissors game",
  "rock paper scissors match",
  "want to play rps",
  "want to play rock paper scissors",
  "up for rps",
  "up for rock paper scissors",
  "fancy rps",
  "fancy rock paper scissors",
  "rps challenge",
  "rock paper scissors challenge",
  "challenge me to rps",
  "challenge me to rock paper scissors",
  "rps time",
  "rock paper scissors time",
  "how about rps",
  "how about rock paper scissors",
];

type RPSChoice = "rock" | "paper" | "scissors";

const CHOICE_EMOJIS = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
};

const WIN_RESPONSES = ["HA, REKT, GG EZ + I'M JUST BETTER"];

const LOSE_RESPONSES = [
  "Ah damn, ya got me...",
  "Uh yeah, so I was blindfolded, and my little brother was playing, and my controller was unplugged, and I was lagging, and I had a headache, and I was distracted by my cat, and I forgot to eat breakfast, and I didn't sleep well last night, and I was just having an off day... but good game!",
];

const TIE_RESPONSES = ["Ah, we tied..."];

export class RockPaperScissorsHandler {
  static checkPhrases(messageContent: string): { rps: boolean } {
    return {
      rps: checkPhrases(messageContent, RPS_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    try {
      const startMessage = await safeChannelSend(
        message.channel,
        "Sure thing! After this message, just type one of the three! Rock, paper, scissors...",
      );

      if (!startMessage) return;

      // Create a message collector to wait for user's choice
      const filter = (msg: Message) => {
        const content = msg.content.toLowerCase().trim();
        return (
          msg.author.id === message.author.id &&
          msg.channel.id === message.channel.id &&
          ["rock", "paper", "scissors", "r", "p", "s"].includes(content)
        );
      };

      try {
        // Check if channel supports awaitMessages
        if (!("awaitMessages" in message.channel)) {
          await safeChannelSend(
            message.channel,
            "Sorry, can't play RPS in this type of channel!",
          );
          return;
        }

        const collected = await message.channel.awaitMessages({
          filter,
          max: 1,
          time: 30000, // 30 seconds timeout
          errors: ["time"],
        });

        const userMessage = collected.first();
        if (!userMessage) return;

        // Parse user choice (support shorthand)
        let userChoice: RPSChoice;
        const input = userMessage.content.toLowerCase().trim();
        switch (input) {
          case "r":
          case "rock":
            userChoice = "rock";
            break;
          case "p":
          case "paper":
            userChoice = "paper";
            break;
          case "s":
          case "scissors":
            userChoice = "scissors";
            break;
          default:
            userChoice = input as RPSChoice;
        }

        const matsudaChoice = getRandomElement([
          "rock",
          "paper",
          "scissors",
        ] as RPSChoice[]);

        // Add some suspense
        await delay(500);

        // Show both choices with emojis
        const choiceMessage =
          `You: ${CHOICE_EMOJIS[userChoice]} ${userChoice.charAt(0).toUpperCase() + userChoice.slice(1)}\n` +
          `Me: ${CHOICE_EMOJIS[matsudaChoice]} ${matsudaChoice.charAt(0).toUpperCase() + matsudaChoice.slice(1)}`;

        await safeChannelSend(message.channel, choiceMessage);

        await delay(1000);

        // Determine winner and send appropriate response
        if (userChoice === matsudaChoice) {
          await safeChannelSend(
            message.channel,
            getRandomElement(TIE_RESPONSES),
          );
        } else if (
          (userChoice === "rock" && matsudaChoice === "scissors") ||
          (userChoice === "paper" && matsudaChoice === "rock") ||
          (userChoice === "scissors" && matsudaChoice === "paper")
        ) {
          await safeChannelSend(
            message.channel,
            getRandomElement(LOSE_RESPONSES),
          );
        } else {
          await safeChannelSend(
            message.channel,
            getRandomElement(WIN_RESPONSES),
          );
        }
      } catch (timeoutError) {
        await safeChannelSend(
          message.channel,
          "Well, damn, just stand me up then.",
        );
      }
    } catch (error) {
      console.error("Error in RPS game:", error);
      await safeChannelSend(
        message.channel,
        "Oops! Something went wrong with the game. Try again later!",
      );
    }
  }
}
