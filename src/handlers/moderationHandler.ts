import { Message, GuildMember, EmbedBuilder } from "discord.js";
import { safeChannelSend } from "../utils/helpers";

// Track user warnings for progressive enforcement
const userWarnings = new Map<string, { count: number; lastWarning: number }>();

// Rate limiting for moderation messages
const moderationCooldowns = new Map<string, number>();

// Common typos and their corrections
const commonTypos = new Map([
  ["teh", "the"],
  ["recieve", "receive"],
  ["seperate", "separate"],
  ["occured", "occurred"],
  ["definately", "definitely"],
  ["accomodate", "accommodate"],
  ["calender", "calendar"],
  ["embarass", "embarrass"],
  ["enviroment", "environment"],
  ["goverment", "government"],
  ["independant", "independent"],
  ["neccessary", "necessary"],
  ["occassion", "occasion"],
  ["recomend", "recommend"],
  ["untill", "until"],
  ["truely", "truly"],
  ["thier", "their"],
  ["alot", "a lot"],
  ["becuase", "because"],
  ["freind", "friend"],
  ["youre", "you're"],
  ["dont", "don't"],
  ["cant", "can't"],
  ["wont", "won't"],
  ["shouldnt", "shouldn't"],
  ["wouldnt", "wouldn't"],
  ["couldnt", "couldn't"],
  ["doesnt", "doesn't"],
  ["didnt", "didn't"],
  ["hasnt", "hasn't"],
  ["havent", "haven't"],
  ["isnt", "isn't"],
  ["arent", "aren't"],
  ["wasnt", "wasn't"],
  ["werent", "weren't"],
]);

/**
 * Handle moderation functionality
 * This function provides automated moderation features with a helpful, non-invasive approach
 */
export async function handleModeration(message: Message): Promise<void> {
  // Skip DMs - moderation only works in servers
  if (!message.guild) return;

  // Skip bot messages
  if (message.author.bot) return;

  // Skip messages from moderators/admins
  const member = message.member;
  if (!member) return;

  if (
    member.permissions.has("ModerateMembers") ||
    member.permissions.has("Administrator")
  ) {
    return;
  }

  // Run gentle moderation checks
  await checkSpamGently(message);
  await checkEmojisGently(message);
  await checkContentHelpfully(message);
  await checkCapsHelpfully(message);
  await checkTypos(message);
  await checkExcessivePunctuation(message);
}

/**
 * Helper function to check if user is on cooldown for moderation messages
 */
function isOnModerationCooldown(userId: string): boolean {
  const now = Date.now();
  const lastMessage = moderationCooldowns.get(userId);
  return Boolean(lastMessage && now - lastMessage < 60000); // 1 minute cooldown
}

/**
 * Helper function to set moderation cooldown
 */
function setModerationCooldown(userId: string): void {
  moderationCooldowns.set(userId, Date.now());
}

/**
 * Helper function to get or create user warning data
 */
function getUserWarnings(userId: string) {
  if (!userWarnings.has(userId)) {
    userWarnings.set(userId, { count: 0, lastWarning: 0 });
  }
  return userWarnings.get(userId)!;
}

/**
 * Gently check for spam patterns without being overly aggressive
 */
async function checkSpamGently(message: Message): Promise<void> {
  const content = message.content;

  // Check for repeated characters (more lenient - 8+ instead of 6+)
  const repeatedChar = /(.)\1{7,}/g;
  const repeatedMatches = content.match(repeatedChar);

  if (repeatedMatches && repeatedMatches.length > 0) {
    const userWarningsData = getUserWarnings(message.author.id);

    // Only warn if not on cooldown
    if (!isOnModerationCooldown(message.author.id)) {
      const passiveAggressiveResponses = [
        `Yooooooo ${message.author.displayName || message.author.username}!!!!!!! Stop spamming repeated characterssssssss! It's sooooo annoying!!!!!!`,
        `${message.author.displayName || message.author.username} pleaaaaaase don't hold down keysssss like thatttttt! It's really baaaaad!!!!`,
        `Heyyyy ${message.author.displayName || message.author.username}... could you maybe NOT spam letters everywhereeeee? Thankssssss!!!!!!`,
        `${message.author.displayName || message.author.username} stoppppppp doing thatttttt! Repeated letters are the worstttttt!!!!!!!`,
        `Omgggggg ${message.author.displayName || message.author.username}! Don't you know spamming is annoyinggggggg???????`,
      ];

      const response =
        passiveAggressiveResponses[
          Math.floor(Math.random() * passiveAggressiveResponses.length)
        ];
      await safeChannelSend(message.channel, response);
      setModerationCooldown(message.author.id);
    }

    // Only delete if it's really excessive (12+ characters) and user has multiple warnings
    if (
      repeatedMatches.some((match) => match.length > 12) &&
      userWarningsData.count > 2
    ) {
      try {
        await message.delete();
        await safeChannelSend(
          message.channel,
          `${message.author}, that message was literallyyyyyyy unreadable!!!! Try againnnnnn without all that spammmmm! 😤😤�`,
        );
      } catch (error) {
        console.error("Error handling spam:", error);
      }
    }
  }

  // Check for too many emojis (more lenient)
  const emojiCount = (content.match(/:\w+:|<a?:\w+:\d+>/g) || []).length;
  if (emojiCount >= 15) {
    if (!isOnModerationCooldown(message.author.id)) {
      const emojiResponses = [
        `${message.author.displayName || message.author.username} STOP using so many emojis!!! 😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡`,
        `Too many emojis ${message.author.displayName || message.author.username}!!! 🤬💀☠️👿😾🙄😤😠😡🤯🥵👹👺💯💯💯💯`,
        `${message.author.displayName || message.author.username} what's with all the emojis???? 🤨🤨🤨🤨🤨🤨🤨🤨🤨🤨🤨🤨🤨🤨🤨`,
        `Bro ${message.author.displayName || message.author.username}... emoji spam is NOT cool!!! 😒😒😒😒😒😒😒😒😒😒😒😒😒😒�`,
      ];

      const response =
        emojiResponses[Math.floor(Math.random() * emojiResponses.length)];
      await safeChannelSend(message.channel, response);
      setModerationCooldown(message.author.id);
    }

    // Only delete if extremely excessive (25+ emojis)
    if (emojiCount >= 25) {
      const userWarningsData = getUserWarnings(message.author.id);
      userWarningsData.count++;
      userWarningsData.lastWarning = Date.now();

      try {
        await message.delete();
        await safeChannelSend(
          message.channel,
          `${message.author} EMOJI OVERLOAD!!!! 🤯🤯🤯🤯🤯🤯🤯🤯 Try again without spamming emojis everywhere!!! 😤😤😤😤�`,
        );
      } catch (error) {
        console.error("Error handling emojis:", error);
      }
    }
  }
}

/**
 * Check for too many emojis separately (for better organization)
 */
async function checkEmojisGently(message: Message): Promise<void> {
  const content = message.content;

  // More comprehensive emoji detection
  const emojiRegex =
    /<:\w+:\d+>|[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = content.match(emojiRegex) || [];

  // More lenient - warn at 15+ emojis, suggest moderation at 20+
  if (emojis.length >= 15) {
    if (!isOnModerationCooldown(message.author.id)) {
      const hypocriticalEmojiResponses = [
        `${message.author.displayName || message.author.username} what the hell is wrong with you??? 😡😡😡 Stop using so many damn emojis!!! 🤬💀☠️👿😾🙄😤😠😡🤯🥵👹👺💯💯💯`,
        `BRO ${message.author.displayName || message.author.username}!!! 😤😤😤 Too many emojis makes you look stupid!!! 🤪🤪🤪🤪🤪🤪🤪🤪🤪🤪🤪🤪🤪`,
        `${message.author.displayName || message.author.username} STOP THE EMOJI SPAM RIGHT NOW!!! 🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫`,
        `YO ${message.author.displayName || message.author.username}... emoji overload much??? 🙄🙄🙄🙄🙄🙄🙄🙄🙄🙄🙄🙄🙄🙄🙄🙄🙄🙄🙄�`,
      ];

      const response =
        hypocriticalEmojiResponses[
          Math.floor(Math.random() * hypocriticalEmojiResponses.length)
        ];
      await safeChannelSend(message.channel, response);
      setModerationCooldown(message.author.id);
    }

    // Only delete if extremely excessive (25+ emojis)
    if (emojis.length >= 25) {
      const userWarningsData = getUserWarnings(message.author.id);
      userWarningsData.count++;
      userWarningsData.lastWarning = Date.now();

      try {
        await message.delete();
        await safeChannelSend(
          message.channel,
          `${message.author} ARE YOU KIDDING ME???? 🤯🤯🤯🤯🤯🤯🤯🤯🤯🤯 That was way too many emojis!!! Try again without being so extra!!! 😤😤😤😤😤😤😤😤😤�`,
        );
      } catch (error) {
        console.error("Error handling emojis:", error);
      }
    }
  }
}

/**
 * Helpfully check content without being invasive
 */
async function checkContentHelpfully(message: Message): Promise<void> {
  const content = message.content.toLowerCase();

  // Hypocritical content suggestions
  const discouragedPhrases = [
    {
      phrase: "that sucks",
      response: `${message.author.displayName || message.author.username} saying "that sucks" is fucking stupid! Use better words you moron!`,
    },
    {
      phrase: "this is stupid",
      response: `${message.author.displayName || message.author.username} YOU'RE the one being stupid by saying "this is stupid"! What an idiot!`,
    },
    {
      phrase: "i hate this",
      response: `${message.author.displayName || message.author.username} stop being so damn negative! I hate when people say "I hate this"!!!`,
    },
    {
      phrase: "this is dumb",
      response: `${message.author.displayName || message.author.username} calling things "dumb" makes YOU look dumb as hell!`,
    },
    {
      phrase: "you're wrong",
      response: `${message.author.displayName || message.author.username} don't tell people they're wrong! That's wrong of you to do!`,
    },
    {
      phrase: "that's trash",
      response: `${message.author.displayName || message.author.username} YOUR attitude is trash! Stop calling things trash!`,
    },
    {
      phrase: "shut up",
      response: `${message.author.displayName || message.author.username} how about YOU shut up instead of telling others to shut up!`,
    },
    {
      phrase: "nobody asked",
      response: `${message.author.displayName || message.author.username} nobody asked for YOUR opinion either, genius!`,
    },
  ];

  for (const item of discouragedPhrases) {
    if (content.includes(item.phrase)) {
      if (!isOnModerationCooldown(message.author.id)) {
        await safeChannelSend(message.channel, item.response);
        setModerationCooldown(message.author.id);
      }
      break; // Only respond to one thing at a time
    }
  }
}

/**
 * Helpfully check for excessive caps
 */
async function checkCapsHelpfully(message: Message): Promise<void> {
  const content = message.content;

  // Skip short messages
  if (content.length < 20) return;

  // Calculate percentage of caps
  const letters = content.match(/[a-zA-Z]/g) || [];
  const caps = content.match(/[A-Z]/g) || [];

  if (letters.length > 15) {
    const capsPercentage = caps.length / letters.length;

    // More lenient - warn at 80% caps instead of 70%
    if (capsPercentage > 0.8) {
      if (!isOnModerationCooldown(message.author.id)) {
        const hypocriticalCapsResponses = [
          `${message.author.displayName || message.author.username} STOP FUCKING SHOUTING!!!!!!!!!! YOU'RE BEING TOO LOUD AND IT'S ANNOYING AS HELL!!!!!!!!!`,
          `BRO ${message.author.displayName || message.author.username}!!! WHY ARE YOU YELLING???? CALM THE FUCK DOWN AND STOP USING SO MANY CAPS!!!!!!!!`,
          `${message.author.displayName || message.author.username} WHAT THE HELL IS WRONG WITH YOU????? STOP SCREAMING IN ALL CAPS YOU MORON!!!!!!!!!`,
          `YO ${message.author.displayName || message.author.username}... CAPS LOCK IS NOT CRUISE CONTROL FOR COOL!!!! TURN THAT SHIT OFF RIGHT NOW!!!!!!!!!`,
          `${message.author.displayName || message.author.username} ARE YOU DEAF OR SOMETHING????? STOP TYPING IN ALL CAPS LIKE A CRAZY PERSON!!!!!!!!!!`,
        ];

        const response =
          hypocriticalCapsResponses[
            Math.floor(Math.random() * hypocriticalCapsResponses.length)
          ];
        await safeChannelSend(message.channel, response);
        setModerationCooldown(message.author.id);
      }

      // Only delete if it's really excessive (90%+ caps) and long message
      if (capsPercentage > 0.9 && letters.length > 30) {
        const userWarningsData = getUserWarnings(message.author.id);
        userWarningsData.count++;
        userWarningsData.lastWarning = Date.now();

        try {
          await message.delete();
          await safeChannelSend(
            message.channel,
            `${message.author} THAT WAS WAY TOO FUCKING LOUD!!!!!!! TYPE THAT AGAIN WITHOUT SCREAMING LIKE A MANIAC!!!!!!!!`,
          );
        } catch (error) {
          console.error("Error handling caps:", error);
        }
      }
    }
  }
}

/**
 * Check for common typos and offer helpful corrections
 */
async function checkTypos(message: Message): Promise<void> {
  const content = message.content.toLowerCase();
  const words = content.split(/\s+/);

  const foundTypos: Array<{ typo: string; correction: string }> = [];

  for (const word of words) {
    // Clean word of punctuation for checking
    const cleanWord = word.replace(/[^\w]/g, "");
    if (commonTypos.has(cleanWord)) {
      foundTypos.push({
        typo: cleanWord,
        correction: commonTypos.get(cleanWord)!,
      });
    }
  }

  // Only suggest corrections if there are 2+ typos or if not on cooldown
  if (foundTypos.length >= 2 && !isOnModerationCooldown(message.author.id)) {
    const suggestions = foundTypos
      .slice(0, 3)
      .map((t) => `"${t.typo}" → "${t.correction}"`)
      .join(", ");

    const hypocriticalTypoResponses = [
      `${message.author.displayName || message.author.username} your spelling is AWFULL!!!! Learn to spell properly: ${suggestions}. Don't be sutch an idiot!`,
      `BRO ${message.author.displayName || message.author.username}... you misspelled alot of words! Here's the corections: ${suggestions}. Try harder next thyme!`,
      `${message.author.displayName || message.author.username} what the hell??? You spelled like 3 words rong! ${suggestions}. Use spellcheck you moron!`,
      `YO ${message.author.displayName || message.author.username}... your typing is realy bad! Fix these: ${suggestions}. It's embarasing!`,
    ];

    const response =
      hypocriticalTypoResponses[
        Math.floor(Math.random() * hypocriticalTypoResponses.length)
      ];
    await safeChannelSend(message.channel, response);
    setModerationCooldown(message.author.id);
  }
}

/**
 * Check for excessive punctuation
 */
async function checkExcessivePunctuation(message: Message): Promise<void> {
  const content = message.content;

  // Check for excessive question marks, exclamation points, or periods
  const excessiveQuestions = /\?{4,}/g;
  const excessiveExclamations = /!{4,}/g;
  const excessivePeriods = /\.{4,}/g;

  if (
    excessiveQuestions.test(content) ||
    excessiveExclamations.test(content) ||
    excessivePeriods.test(content)
  ) {
    if (!isOnModerationCooldown(message.author.id)) {
      const hypocriticalPunctuationResponses = [
        `${message.author.displayName || message.author.username} STOP USING SO MANY QUESTION MARKS AND EXCLAMATION POINTS!!!!!!!!!!!!! IT'S ANNOYING AS FUCK!!!!!!!!`,
        `BRO ${message.author.displayName || message.author.username}... what's with all the punctuation???????? Stop doing that shit!!!!!!!!!!!`,
        `${message.author.displayName || message.author.username} excessive punctuation makes you look stupid!!!!!!!!!!! Cut it out right now!!!!!!!!!!!`,
        `YO ${message.author.displayName || message.author.username}............. too many dots and exclamation marks!!!!!!!!!! Learn proper grammar you idiot!!!!!!!!!!!`,
      ];

      const response =
        hypocriticalPunctuationResponses[
          Math.floor(Math.random() * hypocriticalPunctuationResponses.length)
        ];
      await safeChannelSend(message.channel, response);
      setModerationCooldown(message.author.id);
    }
  }
}
