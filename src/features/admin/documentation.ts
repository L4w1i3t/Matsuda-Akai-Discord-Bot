import { Message } from "discord.js";
import { checkPhrases } from "../../utils/helpers";

const HELP_PHRASES = [
  "what do you do",
  "what can you do",
  "show me your commands",
  "show me your documentation",
  "show me your documentation on how you work",
  "help",
  "commands",
  "what commands do you have",
  "list commands",
  "show commands",
  "available commands",
  "what features do you have",
  "what can i do with you",
  "how do you work",
  "instructions",
  "manual",
  "guide",
  "tutorial",
  "how to use you",
  "what are your features",
  "feature list",
  "command list",
  "help me",
  "i need help",
  "show me what you can do",
  "tell me what you can do",
  "explain yourself",
  "what's your purpose",
  "whats your purpose",
  "what are you for",
  "usage",
  "how do i use you",
  "what do i say to you",
  "documentation",
  "docs",
];

export class DocumentationHandler {
  static checkPhrases(messageContent: string): { help: boolean } {
    return {
      help: checkPhrases(messageContent, HELP_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    try {
      const helpMessage = `
Here are some things I can do so far:
\`\`\`txt
- Mention my name and I will respond. I won't respond if you don't say my name or are just wasting my time!

- Wanna know specific commands? just say "Matsuda, show me your commands" or "Matsuda, show me your documentation on how you work".

- Ask me "what day is it" or similar to know the current day of the week.

- Ask me to "tell me a joke" or similar to hear a joke.

- Ask me to "tell me a fun fact" or similar to hear a random fun fact.

- Ask me to "show me a meme" or similar to see something from my meme collection.

- Ask me to "make a poll" or similar to create a poll with several choices.

- Ask me to "cure my boredom" or "take me to a random site" to get a random website.

- Wanna play a game? I got Rock Paper Scissors and Tic Tac Toe!

- Say hello and I'll greet you back!

- Say goodnight and I'll wish you sweet dreams!

- Please don't ping me, or I'll get mad!
\`\`\`
      `;

      if ("send" in message.channel) {
        await message.channel.send(helpMessage);
        await message.channel.send(
          "For more in-depth help, check out https://github.com/L4w1i3t/Matsuda-Akai-Discord-Bot",
        );
        await message.channel.send("Let me know if you have any questions!");
      }
    } catch (error) {
      console.error("Error sending help message:", error);
      if ("send" in message.channel) {
        await message.channel.send(
          "Something went wrong while showing the help. But I'm here to help anyway!",
        );
      }
    }
  }
}
