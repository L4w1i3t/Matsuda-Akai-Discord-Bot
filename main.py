import discord
from discord.ext import commands
from dotenv import load_dotenv
import os

from logic.helper import decrypt_env
from logic.events import setup_events

# Decrypt the .env file and load environment variables
decrypt_env()
load_dotenv()

bot = commands.Bot(command_prefix='!', intents=discord.Intents.all())

# Set up events
setup_events(bot)

# Load the token from env
bot.run(os.getenv('DISCORD_TOKEN'))
