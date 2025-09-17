import { Message, EmbedBuilder } from "discord.js";
import {
  checkPhrases,
  shouldRespond,
  safeChannelSend,
  extractContentAfterPhrase,
  sanitizeInput,
} from "../../utils/helpers";

const POLL_PHRASES = [
  "make a poll",
  "create a poll",
  "start a poll",
  "new poll",
  "poll please",
  "poll time",
  "do a poll",
  "run a poll",
  "set up a poll",
  "setup a poll",
  "poll creation",
  "poll maker",
  "voting poll",
  "vote poll",
  "opinion poll",
  "survey poll",
  "quick poll",
  "simple poll",
  "poll question",
];

export class PollHandler {
  static checkPhrases(messageContent: string): { poll: boolean } {
    return {
      poll: checkPhrases(messageContent, POLL_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    try {
      // Extract poll content using regex pattern similar to Python version
      const pollContent =
        extractContentAfterPhrase(message.content, "make a poll") ||
        extractContentAfterPhrase(message.content, "create a poll") ||
        extractContentAfterPhrase(message.content, "start a poll");

      if (!pollContent) {
        await safeChannelSend(
          message.channel,
          "Please provide the poll question and options in the format: 'Matsuda, make a poll: Question | Option1 | Option2 | Option3 ...'",
        );
        return;
      }

      // Split by | to get question and options
      const pollParts = pollContent
        .split("|")
        .map((part) => sanitizeInput(part.trim(), 100));
      const pollQuestion = pollParts[0];
      const pollOptions = pollParts
        .slice(1)
        .filter((option) => option.length > 0);

      if (!pollQuestion || pollQuestion.length === 0) {
        await safeChannelSend(
          message.channel,
          "Please provide a poll question!",
        );
        return;
      }

      if (pollOptions.length < 2) {
        await safeChannelSend(
          message.channel,
          "Please provide at least 2 options for the poll in the format: 'Matsuda, make a poll: Question | Option1 | Option2 | Option3 ...'",
        );
        return;
      }

      if (pollOptions.length > 10) {
        await safeChannelSend(
          message.channel,
          "Sorry, you can provide a maximum of 10 options for the poll!",
        );
        return;
      }

      // Create the poll message
      let pollMessage = `**📊 ${pollQuestion}**\n\n`;
      const numberEmojis = [
        "1️⃣",
        "2️⃣",
        "3️⃣",
        "4️⃣",
        "5️⃣",
        "6️⃣",
        "7️⃣",
        "8️⃣",
        "9️⃣",
        "🔟",
      ];

      for (let i = 0; i < pollOptions.length; i++) {
        pollMessage += `${numberEmojis[i]} ${pollOptions[i]}\n`;
      }

      pollMessage += `\n*React with the corresponding emoji to vote!*`;

      // Send the poll message using safeChannelSend
      const success = await safeChannelSend(message.channel, pollMessage);

      if (success && "send" in message.channel) {
        // Get the sent message for adding reactions
        const messages = await message.channel.messages.fetch({ limit: 1 });
        const sentMessage = messages.first();

        if (sentMessage) {
          // Add reactions for voting
          for (let i = 0; i < pollOptions.length; i++) {
            try {
              await sentMessage.react(numberEmojis[i]);
            } catch (error) {
              console.error("Error adding poll reaction:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      await safeChannelSend(
        message.channel,
        "Oops! Something went wrong while creating the poll. Try again?",
      );
    }
  }
}
