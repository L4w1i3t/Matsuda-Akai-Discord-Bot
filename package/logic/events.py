import discord
from discord.ext import commands
import asyncio
import requests
import random
from datetime import datetime, timedelta

# Import necessary logic or necessary files from their given directories
from logic.activities.tictactoe.minimax import find_best_move
from logic.activities.tictactoe.qlearn import choose_action, update_Q_table, get_state, load_Q_table, save_Q_table
from logic.activities import dayoftheweek, jokes, poll, rps, documentation, funfact
from logic.activities.memes import memes
from logic.activities.uselessweb import uselessweb
from logic.activities.tictactoe import ttt
from logic.activities.checkers import playcheckers
from logic.conversation import goodnight, hello, wcrs
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
    check_funfact_flags = funfact.check_phrases(message_content_lower)
    check_uselessweb_flags = uselessweb.check_phrases(message_content_lower)
    check_rps_flags = rps.check_phrases(message_content_lower)
    check_ttt_flags = ttt.check_phrases(message_content_lower)
    check_checkers_flags = playcheckers.check_phrases(message_content_lower)
    check_goodnight_flags = goodnight.check_phrases(message_content_lower)
    check_hello_flags = hello.check_phrases(message_content_lower)
    check_wcrs_flags = wcrs.check_phrases(message_content_lower)

    check_documentation_flags = documentation.check_phrases(message_content_lower)
    check_admin_flags = announcement.check_phrases(message_content_lower)

    # Setups for conditionals below
    asked_for_day_of_week = check_flags['day_of_week_phrases']
    asked_for_joke = check_jokes_flags['joke_phrases']
    asked_for_meme = check_memes_flags['meme_phrases']
    asked_for_poll = check_poll_flags['poll_phrases']
    asked_for_funfact = check_funfact_flags['funfact_phrases']
    asked_for_randomsite = check_uselessweb_flags['uselessweb_phrases']
    told_goodnight = check_goodnight_flags['night_phrases']
    told_hello = check_hello_flags['hello_phrases']
    told_wcrs = check_wcrs_flags['wcrs_phrases']
    asked_for_documentation = check_documentation_flags['documentation']
    asked_for_rps = check_rps_flags['rps_phrases']
    asked_for_ttt = check_ttt_flags['tic-tac-toe']
    asked_for_checkers = check_checkers_flags['checkers']
    asked_for_announcement = check_admin_flags['announcements']

    if bot_addressed and not bot_muted:
        recent_pings.clear()

        # Conversational
        if told_goodnight:
            await goodnight.send_goodnight(message)
        if told_hello:
            await hello.send_hello(message)
        if told_wcrs:
            await wcrs.send_wcrs(message)

        # Documentation and command help
        if '!help' in message_content_lower or 'what do you do' in message_content_lower or 'what can you do' in message_content_lower:
            await documentation.send_help_message(message)
        if asked_for_documentation:
            await documentation.send_documentation(message)

        # Activities
        if asked_for_joke:
            await jokes.send_joke(message)
        if asked_for_day_of_week:
            await dayoftheweek.send_day_of_week(message)
        if asked_for_meme:
            await memes.send_meme(message)
        if asked_for_poll:
            await poll.create_poll(message)
        if asked_for_funfact:
            await funfact.send_funfact(message)
        if asked_for_randomsite:
            await uselessweb.send_randomsite(message)
        if asked_for_rps:
            await rps.play_rps(message, bot)
        if asked_for_ttt:
            await ttt.play_ttt(message, bot)
        if asked_for_checkers:
            await playcheckers.play_checkers(message, bot)

        # ADMIN
        if asked_for_announcement:
            await announcement.handle_announcement(message)

        # General when her name is said
        if not any([asked_for_joke, asked_for_day_of_week, asked_for_meme, asked_for_poll, asked_for_funfact, asked_for_randomsite, asked_for_rps, asked_for_ttt, asked_for_checkers, told_goodnight, told_hello, told_wcrs, asked_for_announcement]):
            recent_pings.clear()
            bot_muted = False
            current_time = datetime.now()
            if cooldown_end_time is None or current_time >= cooldown_end_time:
                await message.channel.send('Someone say my name?')
                cooldown_end_time = current_time + timedelta(minutes=15)

    elif 'hello chat' in message_content_lower:
        await hello.send_hello(message)

def setup_events(bot):
    bot.add_listener(on_ready)
    async def on_message_wrapper(message):
        await on_message(message, bot)
    bot.add_listener(on_message_wrapper, 'on_message')
