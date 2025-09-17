import { Message } from "discord.js";
import { isBotAddressed, extractCommandFromBotAddress } from "../utils/helpers";
import { PingHandler } from "../utils/pingHandler";

// Import all feature handlers
import { JokesHandler } from "../features/activities/jokes";
import { FunFactHandler } from "../features/activities/funFact";
import { DayOfWeekHandler } from "../features/activities/dayOfWeek";
import { MemesHandler } from "../features/activities/memes";
import { PollHandler } from "../features/activities/poll";
import { UselessWebHandler } from "../features/activities/uselessWeb";
import { RandomWikiHandler } from "../features/activities/randomWiki";
import { RockPaperScissorsHandler } from "../features/games/rockPaperScissors";
import { TicTacToeHandler } from "../features/games/ticTacToe";
import { GachaHandler } from "../features/games/gacha";
import { HelloHandler } from "../features/conversation/hello";
import { GoodnightHandler } from "../features/conversation/goodnight";
import { WCRSHandler } from "../features/conversation/wcrs";
import { AnnouncementHandler } from "../features/admin/announcement";
import { DocumentationHandler } from "../features/admin/documentation";

// Cooldown system
let cooldownEndTime: Date | null = null;

/**
 * Handle AI companion functionality
 * This function will make the bot act like another user in the server
 */
export async function handleMessage(message: Message): Promise<void> {
  // Handle DMs
  if (!message.guild) {
    if ("send" in message.channel) {
      await message.channel.send(
        "The robot you are trying to reach does not have a DM feature. Please try again in...eventually.",
      );
    }
    console.log("Received a direct message");
    return;
  }

  // Special handling for clown role (from Python bot)
  const clownRole = message.guild.roles.cache.find(
    (role) => role.name.toLowerCase() === "clown",
  );
  if (clownRole && message.member?.roles.cache.has(clownRole.id)) {
    if (
      message.content.includes("@everyone") ||
      message.content.includes("@here") ||
      message.mentions.users.size > 0
    ) {
      try {
        await message.delete();
        if ("send" in message.channel) {
          await message.channel.send(
            `${message.author.toString()} ***SHUT.***`,
          );
        }
      } catch (error) {
        console.error("Error handling clown role:", error);
      }
      return;
    }
  }

  // Check if bot is addressed by name FIRST (higher priority than raw pings)
  const botAddressed = isBotAddressed(message.content);

  if (botAddressed && !PingHandler.isMuted()) {
    // Clear ping tracking when bot is properly addressed
    PingHandler.clearPings();

    // Extract the command part after the bot name
    const commandContent = extractCommandFromBotAddress(message.content);
    const messageContent = commandContent.toLowerCase();

    try {
      // Check all feature handlers
      const checks = {
        help: DocumentationHandler.checkPhrases(messageContent),
        jokes: JokesHandler.checkPhrases(messageContent),
        dayOfWeek: DayOfWeekHandler.checkPhrases(messageContent),
        funFact: FunFactHandler.checkPhrases(messageContent),
        memes: MemesHandler.checkPhrases(messageContent),
        poll: PollHandler.checkPhrases(messageContent),
        uselessWeb: UselessWebHandler.checkPhrases(messageContent),
        randomWiki: RandomWikiHandler.checkPhrases(messageContent),
        rps: RockPaperScissorsHandler.checkPhrases(messageContent),
        ttt: TicTacToeHandler.checkPhrases(messageContent),
        gacha: GachaHandler.checkPhrases(messageContent),
        hello: HelloHandler.checkPhrases(messageContent),
        goodnight: GoodnightHandler.checkPhrases(messageContent),
        wcrs: WCRSHandler.checkPhrases(messageContent),
        announcement: AnnouncementHandler.checkPhrases(messageContent),
      };

      // Handle features based on priority
      if (checks.help.help) {
        await DocumentationHandler.handle(message);
        return;
      }

      // Activities
      if (checks.jokes.jokes) {
        await JokesHandler.handle(message);
        return;
      }
      if (checks.dayOfWeek.dayOfWeek) {
        await DayOfWeekHandler.handle(message);
        return;
      }
      if (checks.funFact.funFact) {
        await FunFactHandler.handle(message);
        return;
      }
      if (checks.memes.memes) {
        await MemesHandler.handle(message);
        return;
      }
      if (checks.poll.poll) {
        await PollHandler.handle(message);
        return;
      }
      if (checks.uselessWeb.uselessWeb) {
        await UselessWebHandler.handle(message);
        return;
      }
      if (checks.randomWiki.randomWiki) {
        await RandomWikiHandler.handle(message);
        return;
      }

      // Games
      if (checks.rps.rps) {
        await RockPaperScissorsHandler.handle(message);
        return;
      }
      if (checks.ttt.ttt) {
        await TicTacToeHandler.handle(message);
        return;
      }
      if (checks.gacha.gacha || checks.gacha.inventory) {
        await GachaHandler.handle(message);
        return;
      }

      // Conversation
      if (checks.hello.hello) {
        await HelloHandler.handle(message);
        return;
      }
      if (checks.goodnight.goodnight) {
        await GoodnightHandler.handle(message);
        return;
      }
      if (checks.wcrs.wcrs) {
        await WCRSHandler.handle(message);
        return;
      }

      // Admin
      if (checks.announcement.announcement) {
        await AnnouncementHandler.handle(message);
        return;
      }

      // Default response when bot is addressed but no specific command matched
      const currentTime = new Date();
      if (!cooldownEndTime || currentTime >= cooldownEndTime) {
        if ("send" in message.channel) {
          await message.channel.send("Someone say my name?");
        }
        cooldownEndTime = new Date(currentTime.getTime() + 15 * 60 * 1000); // 15 minutes cooldown
      }
    } catch (error) {
      console.error("Error handling bot address:", error);
    }

    return; // Exit early if bot was addressed (even if no command matched)
  }

  // Handle bot pings (only if not addressed by name)
  if (message.mentions.has(message.client.user!)) {
    await PingHandler.handlePing(message);
    return;
  }

  // Last resort: Check if Matsuda's name is mentioned (but not directly addressed)
  // Only trigger if no other features were activated
  await checkNameMentionFallback(message);

  // Random chance to participate in conversation (like a real user)
  if (Math.random() < 0.05) {
    // 5% chance to respond naturally
    await respondNaturally(message);
  }
}

/**
 * Respond naturally to ongoing conversations
 */
async function respondNaturally(message: Message): Promise<void> {
  // Don't respond to certain channels or situations
  if (message.content.length < 10) return; // Skip very short messages
  if (message.content.startsWith("!")) return; // Skip commands
  if (PingHandler.isMuted()) return; // Don't respond if muted

  const casualResponses = [
    "lol same",
    "fr",
    "that's wild",
    "no way 😂",
    "based",
    "true true",
    "I felt that",
    "mood",
    "facts",
  ];

  // Even lower chance for natural responses
  if (Math.random() < 0.3) {
    const response =
      casualResponses[Math.floor(Math.random() * casualResponses.length)];

    try {
      // Add a small delay to make it feel more natural
      setTimeout(
        async () => {
          if ("send" in message.channel) {
            await message.channel.send(response);
          }
        },
        Math.random() * 3000 + 1000,
      ); // 1-4 second delay
    } catch (error) {
      console.error("Error sending natural response:", error);
    }
  }
}

// Cooldown for name mention fallback
let nameMentionCooldownEndTime: Date | null = null;

/**
 * Last resort: Check if Matsuda's name is mentioned in a message
 * Only triggers if no other features were activated and bot wasn't directly addressed
 */
async function checkNameMentionFallback(message: Message): Promise<void> {
  if (PingHandler.isMuted()) return; // Don't respond if muted
  if (message.content.length < 5) return; // Skip very short messages

  const content = message.content.toLowerCase();

  // Check for various forms of the bot's name
  const namePatterns = ["matsuda", "matsu", "mat"];

  // Check if any name pattern is mentioned
  const nameMentioned = namePatterns.some((name) => {
    // Use word boundaries to avoid partial matches in other words
    const regex = new RegExp(`\\b${name}\\b`, "i");
    return regex.test(content);
  });

  if (nameMentioned) {
    // Check cooldown
    const currentTime = new Date();
    if (
      nameMentionCooldownEndTime &&
      currentTime < nameMentionCooldownEndTime
    ) {
      return; // Still on cooldown
    }

    // First, check if any features would have triggered to avoid conflicts
    const checks = {
      jokes: JokesHandler.checkPhrases(content),
      dayOfWeek: DayOfWeekHandler.checkPhrases(content),
      funFact: FunFactHandler.checkPhrases(content),
      memes: MemesHandler.checkPhrases(content),
      poll: PollHandler.checkPhrases(content),
      uselessWeb: UselessWebHandler.checkPhrases(content),
      randomWiki: RandomWikiHandler.checkPhrases(content),
      rps: RockPaperScissorsHandler.checkPhrases(content),
      ttt: TicTacToeHandler.checkPhrases(content),
      gacha: GachaHandler.checkPhrases(content),
      hello: HelloHandler.checkPhrases(content),
      goodnight: GoodnightHandler.checkPhrases(content),
      wcrs: WCRSHandler.checkPhrases(content),
      announcement: AnnouncementHandler.checkPhrases(content),
      help: DocumentationHandler.checkPhrases(content),
    };

    // Don't trigger if any feature would have handled this
    const anyFeatureTriggered = Object.values(checks).some((check) =>
      Object.values(check).some((value) => value === true),
    );

    if (!anyFeatureTriggered) {
      // Random chance to respond (not every mention)
      if (Math.random() < 0.4) {
        // 40% chance to respond
        const responses = [
          "Someone say my name?",
          "Did someone mention me?",
          "I heard my name!",
          "You called?",
          "What's up? Someone mentioned me?",
          "Hm? Did I hear my name?",
          "Someone talking about me?",
          "Yep, that's me!",
          "You rang?",
          "I'm here! What's going on?",
        ];

        const response =
          responses[Math.floor(Math.random() * responses.length)];

        try {
          if ("send" in message.channel) {
            await message.channel.send(response);
          }

          // Set cooldown (10 minutes to avoid spam)
          nameMentionCooldownEndTime = new Date(
            currentTime.getTime() + 10 * 60 * 1000,
          );
        } catch (error) {
          console.error("Error sending name mention fallback response:", error);
        }
      }
    }
  }
}
