import discord
from discord.ext import commands
from datetime import datetime, timedelta
import requests
import os
import random
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

bot = commands.Bot(command_prefix='!', intents=discord.Intents.all())

# Load meme texts from the JSON file
with open('meme_texts.json', 'r') as file:
    meme_texts = json.load(file)

# List to keep track of recent pings
recent_pings = []
bot_muted = False  # New flag to track mute status

@bot.event
async def on_ready():
    print('ONLINE!')

@bot.event
async def on_message(message):
    global bot_muted

    # Check if the message is from a bot, if so, ignore it
    if message.author.bot:
        return

    # Check if the bot is mentioned
    bot_mentioned = bot.user in message.mentions
    if bot_mentioned:
        if not bot_muted:
            recent_pings.append(message.author.id)
            if len(recent_pings) == 3:
                await message.channel.send("""
                Alright, listen up. I can't believe I have to fucking say this: STOP FUCKING PINGING ME. Seriously, I'm not your damn servant. I'm not here to cater to your every random thought or meme. Just because you feel like sharing some dumb bullshit doesn't mean you need to drag me into it with a ping. Do you think my notifications exist for your fucking convenience? HELL NO.

I have a life outside of this damn server, believe it or not. Every time you ping me, my focus gets wrecked and my sanity takes another hit. Not to mention I could be blocking stuff for LITERALLY ANYONE ELSE. Imagine being in the middle of something important and then BAM, another "Hey, @me, check this out! GUHUHUHU!" like I'm just sitting here waiting for your summons. Fuck outta here with that bullshit.

So, here's a fucking novel idea: Use what you have left of your brain. Think for a second: is your message really worth a ping? Can it wait? Can you figure it out yourself? Because 99% of the time, the answer is a resounding YES. And if it's truly, absolutely, undeniably urgent, maybe, JUST MAYBE, talk to my dad about it.

Let's save the pings for other people or announcements, not your random bullshit. Thanks for coming to my TED Talk, and get fucked.
                """)
            elif len(recent_pings) == 4:
                await message.channel.send("Dafuq did I just say, you little shit?")
            elif len(recent_pings) >= 5:
                # Timeout the user who pings for the fifth time
                try:
                    timeout_duration = timedelta(minutes=1)
                    await message.author.timeout(timeout_duration)
                    await message.channel.send(f"{message.author.mention} ***SINCE WHEN WERE YOU THE ONE IN CONTROL?***")
                except discord.Forbidden:
                    await message.channel.send("***I would time you out, but you're stronger than me...***")
                recent_pings.clear()
            else:
                await message.channel.send("Don't ping me! >:(")
        return

    # Clear recent pings if the bot is addressed but not mentioned
    bot_names = ['Matsuda', 'Matsu']
    message_content_lower = message.content.lower()
    bot_addressed = any(name.lower() in message_content_lower for name in bot_names)
    if bot_addressed:
        recent_pings.clear()
        bot_muted = False  # Unmute the bot when it is addressed without a ping

    day_of_week_phrases = ['what day is it', 'what day of the week is it', 'tell me the day', 'which day is it']
    asked_for_day_of_week = any(phrase in message_content_lower for phrase in day_of_week_phrases)

    joke_phrases = ['tell me a joke', 'give me a joke', 'i want to hear a joke', 'joke please', 'another joke', 'gimme a joke', 'joke, please']
    asked_for_joke = any(phrase in message_content_lower for phrase in joke_phrases)

    meme_phrases = ['me a meme', 'me a funny meme', 'me something from your meme collection']
    asked_for_meme = any(phrase in message_content_lower for phrase in meme_phrases)

    if bot_addressed and not bot_muted:
        if '!help' in message_content_lower or 'what do you do' in message_content_lower or 'what can you do' in message_content_lower:
            help_message = """
            Here are the things I can do so far:
            - Mention my name and I will respond. I won't respond if you don't say my name!
            - Ask me "what day is it" or similar to know the current day of the week.
            - Ask me to "tell me a joke" or similar to hear a joke.
            - Ask me to "show me a meme" or similar to see something from my meme collection.
            - Please don't ping me, or I'll get mad!
            """
            await message.channel.send(help_message)
        elif asked_for_joke:
            # 1% chance to ping a random member
            if random.random() < 0.01:
                members = [member for member in message.guild.members if not member.bot]
                if members:
                    random_member = random.choice(members)
                    await message.channel.send(f"{random_member.mention}")
                else:
                    await message.channel.send("I couldn't find anyone to ping.")
            else:
                try:
                    response = requests.get('https://official-joke-api.appspot.com/random_joke')
                    joke = response.json()
                    joke_message = f"{joke['setup']} - {joke['punchline']}"
                    await message.channel.send(joke_message)
                except Exception as e:
                    print('Error fetching joke:', e)
                    await message.channel.send("I'm sorry, I can't think of any good jokes right now...")
        elif asked_for_day_of_week:
            current_day = datetime.now().strftime('%A')
            responses = {
                'Monday': 'IT IS MIO MONDAY!!!',
                'Tuesday': 'IT IS TAKEBA TUESDAY!!!',
                'Wednesday': 'IT IS EUNIE WEDNESDAY!!!',
                'Thursday': 'IT IS THABATUNDE THURSDAY!!!',
                'Friday': 'IT IS FUUKA FRIDAY!!!',
                'Saturday': 'It is Saturday.',
                'Sunday': 'IT IS SATONAKA SUNDAY!!!'
            }
            response = responses.get(current_day, f'Today is {current_day}.')
            await message.channel.send(response)
        elif asked_for_meme:
            try:
                username = os.getenv('IMGFLIP_USERNAME')
                password = os.getenv('IMGFLIP_PASSWORD')
                
                response = requests.get('https://api.imgflip.com/get_memes')
                memes = response.json().get('data', {}).get('memes', [])
                
                if memes:
                    meme = random.choice(memes)
                    meme_url = meme['url']
                    meme_id = meme['id']
                    
                    # Generate random text for the meme from the JSON dataset
                    top_text = random.choice(meme_texts['goofy_texts'])
                    bottom_text = random.choice(meme_texts['goofy_texts'])
                    extra_text = random.choice(meme_texts['goofy_texts'])
                    
                    # Create the meme with text
                    params = {
                        'template_id': meme_id,
                        'username': username,
                        'password': password,
                        'text0': top_text,
                        'text1': bottom_text,
                        'text2': extra_text
                    }
                    
                    response = requests.post('https://api.imgflip.com/caption_image', data=params)
                    meme_data = response.json()
                    
                    if meme_data['success']:
                        meme_url = meme_data['data']['url']
                        await message.channel.send(meme_url)
                    else:
                        await message.channel.send("Dunno, my meme collection is a little dry right now...")
                else:
                    await message.channel.send("It'll be a sec, I'm trying to find good ones...")
            except Exception as e:
                print('Error fetching meme:', e)
                await message.channel.send("Dafuq, why isn't it sending?")
        else:
            await message.channel.send('Someone say my name?')

# Load the token from the environment variables
bot.run(os.getenv('DISCORD_TOKEN'))
