import { Message } from "discord.js";
import { checkPhrases, getRandomElement } from "../../utils/helpers";
import axios from "axios";

const MEME_PHRASES = [
  "me a meme",
  "me a funny meme",
  "me something from your meme collection",
  "send a meme",
  "show a meme",
  "give a meme",
  "another meme",
  "tell me a meme",
  "share a meme",
  "got any memes",
  "know any memes",
  "meme please",
  "meme time",
  "funny meme",
  "good meme",
  "dank meme",
  "quality meme",
  "spicy meme",
  "fresh meme",
  "random meme",
  "meme me",
  "hit me with a meme",
  "drop a meme",
  "post a meme",
  "show me a meme",
  "give me a meme",
  "send me a meme",
  "i need a meme",
  "want a meme",
  "gimme a meme",
  "something funny",
  "make me laugh with a meme",
];

// Goofy texts for meme generation (similar to Python version)
const GOOFY_TEXTS = [
  "BEANS",
  "AMONG US",
  "SUS",
  "IMPOSTER",
  "SUSSY BAKA",
  "GAMING",
  "EPIC GAMER MOMENT",
  "POG",
  "POGGERS",
  "SHEESH",
  "NO CAP",
  "RATIO",
  "BASED",
  "CRINGE",
  "CHAD",
  "VIRGIN",
  "SIGMA MALE",
  "LIGMA",
  "DEEZ NUTS",
  "GOTTEM",
  "STONKS",
  "NOT STONKS",
  "MONKE",
  "RETURN TO MONKE",
  "REJECT HUMANITY",
  "EMBRACE MONKE",
];

// Simple cache to avoid repeating memes too quickly
const recentMemes = new Set<string>();
const MAX_RECENT_MEMES = 50; // Remember last 50 memes

// Different meme subreddits for variety
const MEME_SUBREDDITS = [
  'memes',
  'dankmemes', 
  'me_irl',
  'wholesomememes',
  'funny',
  'memeeconomy',
  'PrequelMemes',
  'historymemes',
  'ProgrammerHumor',
  'animemes',
  'bikinibottomtwitter',
  'okbuddyretard',
  'okbuddypersona',
  'SpeedOfLobsters',
  'antimeme',
  'DanganronpaMemes'
];

export class MemesHandler {
  static checkPhrases(messageContent: string): { memes: boolean } {
    return {
      memes: checkPhrases(messageContent, MEME_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    try {
      // Try multiple meme sources for variety
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        try {
          // Pick a random subreddit for variety
          const randomSubreddit = getRandomElement(MEME_SUBREDDITS);
          const memeApiResponse = await axios.get(`https://meme-api.com/gimme/${randomSubreddit}`, {
            timeout: 6000
          });
          
          if (memeApiResponse.data && memeApiResponse.data.url) {
            const memeUrl = memeApiResponse.data.url;
            
            // Check if we've used this meme recently
            if (!recentMemes.has(memeUrl)) {
              // Add to recent memes cache
              recentMemes.add(memeUrl);
              
              // Keep cache size manageable
              if (recentMemes.size > MAX_RECENT_MEMES) {
                const firstItem = Array.from(recentMemes)[0];
                recentMemes.delete(firstItem);
              }
              
              // Send the fresh meme
              if ("send" in message.channel) {
                await message.channel.send({
                  files: [memeUrl]
                });
              }
              return; // Success!
            }
            
            // If meme was recent, try again
            attempts++;
            continue;
          }
        } catch (apiError: any) {
          console.error(`Meme API attempt ${attempts + 1} failed:`, apiError.message);
          attempts++;
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log("All meme API attempts failed, falling back to imgflip templates");

      // Fallback: Get imgflip templates and create our own meme
      const response = await axios.get("https://api.imgflip.com/get_memes");
      const memes = response.data.data.memes;

      if (memes && memes.length > 0) {
        // Try to pick a template we haven't used recently
        let templateAttempts = 0;
        let randomMeme;
        
        do {
          randomMeme = getRandomElement(memes) as {
            url: string;
            name: string;
            id: string;
          };
          templateAttempts++;
        } while (recentMemes.has(randomMeme.url) && templateAttempts < 10);

        // Add template to recent cache
        recentMemes.add(randomMeme.url);
        if (recentMemes.size > MAX_RECENT_MEMES) {
          const firstItem = Array.from(recentMemes)[0];
          recentMemes.delete(firstItem);
        }

        // Generate random goofy text
        const topText = getRandomElement(GOOFY_TEXTS);
        const bottomText = getRandomElement(GOOFY_TEXTS);

        // Randomly decide if we want just top text or both top and bottom
        const useBottomText = Math.random() > 0.3; // 70% chance for bottom text

        // Send just the template image with a simple overlay message
        const simpleMessage = `**${topText}**\n${useBottomText ? `**${bottomText}**` : ''}`;
        
        if ("send" in message.channel) {
          await message.channel.send({
            content: simpleMessage,
            files: [randomMeme.url]
          });
        }
      } else {
        if ("send" in message.channel) {
          await message.channel.send("No memes found 😢");
        }
      }
    } catch (error: any) {
      console.error("Error generating meme:", error);
      
      // Simple fallback
      const fallbackText = getRandomElement(GOOFY_TEXTS);
      
      if ("send" in message.channel) {
        await message.channel.send(`Meme machine broke 😭\n\n**${fallbackText}**\n\n*[imagine a meme here]*`);
      }
    }
  }
}
