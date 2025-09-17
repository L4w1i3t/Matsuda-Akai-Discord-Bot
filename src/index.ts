import { Client, GatewayIntentBits, Events, Message } from "discord.js";
import * as dotenv from "dotenv";
import { handleMessage } from "./handlers/messageHandler";
import { handleModeration } from "./handlers/moderationHandler";

// Load environment variables
dotenv.config();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
});

// When the client is ready, run this code
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Listen for messages
client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  try {
    // Handle AI companion functionality
    await handleMessage(message);

    // Handle moderation
    await handleModeration(message);
  } catch (error) {
    console.error("Error handling message:", error);
  }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

export { client };
