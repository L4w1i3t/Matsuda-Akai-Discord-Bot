import discord
from discord.ext import commands
import asyncio
import requests
import random
from datetime import datetime, timedelta

# Import necessary logic or necessary files from their given directories.
from logic.activities.tictactoe.minimax import find_best_move
from logic.activities.tictactoe.qlearn import choose_action, update_Q_table, get_state, load_Q_table, save_Q_table
from logic.activities import dayoftheweek, jokes, memes, poll, rps, documentation
from logic.activities.tictactoe import ttt
from logic.conversation import goodnight
from logic.admin import announcement
from logic.whenping import handle_pings

recent_pings = []
bot_muted = False
cooldown_end_time = None
Q_table = load_Q_table()

async def on_ready():
    print('MATSUDA IS ONLINE!')

async def on_message(message, bot):
    global bot_muted, cooldown_end_time, recent_pings, Q_table

    state = None
    action = None
    reward = 0

    if message.author.bot:
        return

    clown_role = next((role for role in message.guild.roles if role.name.lower() == "clown"), None)
    if clown_role and clown_role in message.author.roles:
        if any(mention in message.content for mention in ['@everyone', '@here']) or message.mentions:
            await message.delete()
            await message.channel.send(f"{message.author.mention} ***SHUT.***")
            return

    bot_mentioned = bot.user in message.mentions
    if bot_mentioned:
        recent_pings = await handle_pings(message, recent_pings)
        return

    bot_names = ['Matsuda', 'Matsu']
    message_content_lower = message.content.lower()
    bot_addressed = any(name.lower() in message_content_lower for name in bot_names)

    check_flags = dayoftheweek.check_phrases(message_content_lower)
    check_jokes_flags = jokes.check_phrases(message_content_lower)
    check_memes_flags = memes.check_phrases(message_content_lower)
    check_poll_flags = poll.check_phrases(message_content_lower)
    check_rps_flags = rps.check_phrases(message_content_lower)
    check_ttt_flags = ttt.check_phrases(message_content_lower)
    check_convo_flags = goodnight.check_phrases(message_content_lower)
    check_documentation_flags = documentation.check_phrases(message_content_lower)
    check_admin_flags = announcement.check_phrases(message_content_lower)

    asked_for_day_of_week = check_flags['day_of_week_phrases']
    asked_for_joke = check_jokes_flags['joke_phrases']
    asked_for_meme = check_memes_flags['meme_phrases']
    asked_for_poll = check_poll_flags['poll_phrases']
    told_goodnight = check_convo_flags['night_phrases']
    asked_for_documentation = check_documentation_flags['documentation']
    asked_for_rps = check_rps_flags['rps_phrases']
    asked_for_ttt = check_ttt_flags['tic-tac-toe']
    asked_for_announcement = check_admin_flags['announcements']

    if bot_addressed and not bot_muted:
        if '!help' in message_content_lower or 'what do you do' in message_content_lower or 'what can you do' in message_content_lower:
            await documentation.send_help_message(message)
        elif asked_for_documentation:
            await documentation.send_documentation(message)
        elif asked_for_joke:
            await jokes.send_joke(message)
        elif asked_for_day_of_week:
            await dayoftheweek.send_day_of_week(message)
        elif asked_for_meme:
            await memes.send_meme(message)
        elif asked_for_poll:
            await poll.create_poll(message)
        elif asked_for_rps:
            await rps.play_rps(message, bot)
        elif asked_for_ttt:
            await ttt.play_ttt(message, bot)
        elif told_goodnight:
            await goodnight.send_goodnight(message)
        elif asked_for_announcement:
            await announcement.handle_announcement(message)
        else:
            recent_pings.clear()
            bot_muted = False
            current_time = datetime.now()
            if cooldown_end_time is None or current_time >= cooldown_end_time:
                await message.channel.send('Someone say my name?')
                cooldown_end_time = current_time + timedelta(minutes=15)

def setup_events(bot):
    bot.add_listener(on_ready)
    async def on_message_wrapper(message):
        await on_message(message, bot)
    bot.add_listener(on_message_wrapper, 'on_message')
