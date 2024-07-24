import discord
from discord.ext import commands
from dotenv import load_dotenv
import os
import sys
import traceback
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from logic.helper import decrypt_env
from logic.events import setup_events

def log_crash_report(exc_info):
    # Generate a crash report
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    crash_report_file = f"crash_reports/crash_report_{timestamp}.txt"
    with open(crash_report_file, "w") as file:
        file.write("Crash Report\n")
        file.write(f"Timestamp: {timestamp}\n")
        file.write("".join(traceback.format_exception(*exc_info)))
    print(f"Crash report generated: {crash_report_file}")

def main():
    while True:
        try:
            # Decrypt the .env file and load environment variables
            decrypt_env()
            load_dotenv(dotenv_path='package/.env.decrypted')

            bot = commands.Bot(command_prefix='!', intents=discord.Intents.all())

            # Set up events
            setup_events(bot)

            # Load the token from env
            bot.run(os.getenv('DISCORD_TOKEN'))
            
        # If the bot crashes for whatever reason
        except Exception:
            log_crash_report(sys.exc_info())
            print("Crashed. Restarting...")

if __name__ == "__main__":
    main()
