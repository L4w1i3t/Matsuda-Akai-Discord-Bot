import discord
from discord.ext import commands
from dotenv import load_dotenv
import os

from logic.helper import decrypt_env
from logic.events import setup_events

def main():
    # Decrypt the .env file and load environment variables
    decrypt_env()
    load_dotenv(dotenv_path='.env.decrypted')

    bot = commands.Bot(command_prefix='!', intents=discord.Intents.all())

    # Set up events
    setup_events(bot)

    # Load the token from env
    bot.run(os.getenv('DISCORD_TOKEN'))

if __name__ == "__main__":
    main()
