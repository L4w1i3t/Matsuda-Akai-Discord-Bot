#documentation.py
import re

help_phrases = [
    r'\b!help\b', r'\bwhat do you do\b', r'\bwhat can you do\b'
]

def check_phrases(message_content_lower):
    return {'help_phrases': any(re.search(phrase, message_content_lower) for phrase in help_phrases)}

async def send_help_message(message):
    help_message = "Here's my repository for more in-depth instructions! https://github.com/L4w1i3t/Matsuda-Akai-Discord-Bot"
    await message.channel.send(help_message)