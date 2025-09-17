# Matsuda Bot

A TypeScript Discord bot that acts as an AI companion and provides moderation features.

## Features

- **AI Companion**: Acts like another user in the server, responding naturally to conversations
- **Moderation**: Automated moderation including spam detection, content filtering, and caps checking
- **DM Support**: Can interact with users via direct messages
- **TypeScript**: Fully typed for better development experience

## Setup

### Prerequisites

- Node.js (v16 or higher)
- A Discord application and bot token

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your Discord bot token:
   ```
   DISCORD_TOKEN=your_bot_token_here
   ```

### Getting a Discord Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section
4. Click "Add Bot"
5. Copy the token and add it to your `.env` file
6. Enable the following bot permissions:
   - Send Messages
   - Read Messages
   - Manage Messages (for moderation)
   - Read Message History

### Inviting the Bot

Generate an invite link with the following permissions:
- `applications.commands`
- `bot`

Required bot permissions:
- Send Messages
- Read Messages
- Manage Messages
- Read Message History

## Development

### Scripts

- `npm run dev` - Run the bot in development mode with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled bot
- `npm run watch` - Watch for changes and recompile

### Project Structure

```
src/
├── index.ts                 # Main bot entry point
├── handlers/
│   ├── messageHandler.ts    # AI companion functionality
│   └── moderationHandler.ts # Moderation features
```

## Configuration

The bot can be customized by modifying the handler files:

- **AI Companion**: Edit `src/handlers/messageHandler.ts` to change response behavior
- **Moderation**: Edit `src/handlers/moderationHandler.ts` to adjust moderation rules

## Usage

Once the bot is running and invited to your server:

1. **AI Companion Features**:
   - Mention the bot to get a response
   - The bot will occasionally respond naturally to conversations (5% chance)

2. **Moderation Features**:
   - Automatically detects and removes spam messages
   - Filters inappropriate content (customize the word list)
   - Prevents excessive caps usage

## Development Notes

- The bot uses Discord.js v14
- All code is written in TypeScript with strict type checking
- Modular structure for easy feature additions
- Environment-based configuration

## Contributing

Feel free to submit issues and enhancement requests!