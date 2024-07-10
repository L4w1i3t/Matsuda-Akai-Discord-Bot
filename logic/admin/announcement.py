#announcement.py
import discord
import re

announcements_phrases = [
    'make an announcement', 'make an announcement:'
    ]

def check_phrases(message_content_lower):
    return {'announcements': any(phrase in message_content_lower for phrase in announcements_phrases)}

async def handle_announcement(message):
    if message.author.guild_permissions.administrator:
        match = re.search(r'make an announcement:?\s*(.*)', message.content, re.IGNORECASE | re.DOTALL)
        if match:
            announcement = match.group(1).strip()
            announcements_channel = discord.utils.get(message.guild.text_channels, name='announcements')
            if announcements_channel:
                await announcements_channel.send(f"📢 @everyone\n**ANNOUNCEMENT:**\n\n{announcement}")
                await message.channel.send("Done!")
            else:
                await message.channel.send("Couldn't find an #announcements channel. Please create one and try again.")
        else:
            await message.channel.send("Please provide the announcement content.")
    else:
        await message.channel.send("You do not have permission to make announcements.")
