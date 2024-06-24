
# Matsuda Bot Primary Logic

import asyncio
import discord
from discord.ext import commands, tasks
from datetime import datetime, timedelta
import requests
import os
import random
import json
from dotenv import load_dotenv

#-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

load_dotenv()

bot = commands.Bot(command_prefix='!', intents=discord.Intents.all())

# Load meme texts from json
with open('meme_texts.json', 'r') as file:
    meme_texts = json.load(file)

# List to keep track of recent pings
recent_pings = []
bot_muted = False

# Cooldown tracking
cooldown_end_time = None

@bot.event
async def on_ready():
    print('MATSUDA IS ONLINE!')

#-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

@bot.event
async def on_message(message):
    global bot_muted, cooldown_end_time

    # Check if the message is from a bot, if so, ignore it
    if message.author.bot:
        return

    # Check if the bot is mentioned
    bot_mentioned = bot.user in message.mentions
    if bot_mentioned:
        if not bot_muted:
            recent_pings.append(message.author.id)
            if len(recent_pings) == 2:
                await message.channel.send("Okay, ha ha, you had your fun, now please stop.")
            elif len(recent_pings) == 3:
                await message.channel.send("""
                Alright, listen up. I can't believe I have to fucking say this: STOP FUCKING PINGING ME. Seriously, I'm not your damn servant. I'm not here to cater to your every random thought or meme. Just because you feel like sharing some dumb bullshit doesn't mean you need to drag me into it with a ping. Do you think my notifications exist for your fucking convenience? HELL NO.

I have a life outside of this damn server, believe it or not. Every time you ping me, my focus gets wrecked and my sanity takes another hit. Not to mention I could be blocking stuff for LITERALLY ANYONE ELSE. Imagine being in the middle of something important and then BAM, another "Hey, @me, check this out! GUHUHUHU!" like I'm just sitting here waiting for your summons. Fuck outta here with that bullshit.

So, here's a fucking novel idea: Use what you have left of your brain. Think for a second: is your message really worth a ping? Can it wait? Can you figure it out yourself? Because 99% of the time, the answer is a resounding YES. And if it's truly, absolutely, undeniably urgent, maybe, JUST MAYBE, talk to my dad about it.

Let's save the pings for other people or announcements, not your random bullshit. Thanks for coming to my TED Talk, and get fucked.
                """)

            elif len(recent_pings) == 4:
                await message.channel.send("Dafuq did I just say, you little shit?")

            elif len(recent_pings) == 5:
                # Timeout the user who pings for the fifth time
                try:
                    timeout_duration = timedelta(minutes=1)
                    await message.author.timeout(timeout_duration)
                    await message.channel.send(f"{message.author.mention} ***SINCE WHEN WERE YOU THE ONE IN CONTROL?***")
                except discord.Forbidden:
                    await message.channel.send("***I would time you out, but you're stronger than me...***")

            elif len(recent_pings) == 6:
                # Repeat timeouts
                try:
                    timeout_duration = timedelta(minutes=2)
                    await message.author.timeout(timeout_duration)
                    await message.channel.send(f"{message.author.mention} ***OH, WE GOT ANOTHER!***")
                except discord.Forbidden:
                    await message.channel.send("***I would time you out, but you're stronger than me...***")

            elif len(recent_pings) >= 7:
                # Repeat timeouts
                try:
                    timeout_duration = timedelta(minutes=3)
                    await message.author.timeout(timeout_duration)
                    await message.channel.send(f"{message.author.mention} ***YEET.***")
                except discord.Forbidden:
                    await message.channel.send("***I would time you out, but you're stronger than me...***")

            else:
                await message.channel.send("Don't ping me! >:(")
        return

#-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    # Define a function to check for phrases
    def check_for_phrases(message_content, phrases):
        return any(phrase in message_content for phrase in phrases)

    # Clear recent pings if the bot is addressed but not mentioned
    bot_names = ['Matsuda', 'Matsu']
    message_content_lower = message.content.lower()
    bot_addressed = any(name.lower() in message_content_lower for name in bot_names)

    # Dictionary to store phrases and their corresponding check flags
    phrases_dict = {
        'day_of_week_phrases': ['what day is it', 'what day of the week is it', 'tell me the day', 'which day is it'],
        'joke_phrases': ['tell me a joke', 'give me a joke', 'i want to hear a joke', 'joke please', 'another joke', 'gimme a joke', 'joke, please'],
        'meme_phrases': ['me a meme', 'me a funny meme', 'me something from your meme collection', 'send a meme', 'show a meme', 'give a meme'],
        'poll_phrases': ['make a poll', 'create a poll', 'start a poll'],
        'night_phrases': ['good night', 'goodnight', 'nighty night'],
        'documentation': ['show me your commands', 'show me your documentation on how you work'],
        'rps_phrases': ['let\'s play rps', 'let\'s play rock paper scissors', 'play rps with me', 'wanna play rps', 'play rock paper scissors with me', 'wanna play rock paper scissors', 'lets play rps', 'lets play rock paper scissors'],
}

    # Check for phrases and set flags
    check_flags = {key: check_for_phrases(message_content_lower, phrases) for key, phrases in phrases_dict.items()}

    # Access specific flags as needed
    asked_for_day_of_week = check_flags['day_of_week_phrases']
    asked_for_joke = check_flags['joke_phrases']
    asked_for_meme = check_flags['meme_phrases']
    asked_for_poll = check_flags['poll_phrases']
    told_goodnight = check_flags['night_phrases']
    asked_for_documentation = check_flags['documentation']
    asked_for_rps = check_flags['rps_phrases']

#-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    if bot_addressed and not bot_muted:
        
        if '!help' in message_content_lower or 'what do you do' in message_content_lower or 'what can you do' in message_content_lower:
            help_message = """
            Here are some things I can do so far:
            ```txt
- Mention my name and I will respond. I won't respond if you don't say my name or are just wasting my time!

- Wanna know specific commands? just say \"Matsuda, show me your commands\" or \"Matsuda, show me your documentation on how you work\".

- Ask me "what day is it" or similar to know the current day of the week.

- Ask me to "tell me a joke" or similar to hear a joke.

- Ask me to "show me a meme" or similar to see something from my meme collection.

- Ask me to "make a poll" or similar to create a poll with several choices.

- "Play RPS (Rock, paper, scissors) with me!"

- Please don't ping me, or I'll get mad!
            ```
            """
            await message.channel.send(help_message)
        
        elif asked_for_documentation:
            doc_message = "Sure thing!\n```py\n"
            for var_name, phrases in phrases_dict.items():
                doc_message += f"{var_name} = {phrases}\n\n"
            doc_message += "```"
            await message.channel.send(doc_message)
            await message.channel.send("All these are case-insensitive, by the way. For all I care, alternate between caps and lowercase or flame me.")
            await message.channel.send("Let me know if you have any questions!")


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
                'Monday': 'https://tenor.com/view/mio-xenoblade-mio-xenoblade-xenoblade3-monday-gif-25756566',
                'Tuesday': 'https://tenor.com/view/yukari-yukari-takeba-takeba-tuesday-persona-persona3-gif-25179490',
                'Wednesday': 'https://tenor.com/view/eunie-xenoblade-xenoblade3-euniewednesday-its-eunie-gif-26486078',
                'Thursday': 'https://tenor.com/view/aerith-gif-15519481347988923819',
                'Friday': 'https://tenor.com/view/persona-3-fuuka-fuuka-yamagishi-fuuka-fridya-fuuka-friday-gif-4308770182909675284',
                'Saturday': 'It is Saturday.',
                'Sunday': 'https://tenor.com/view/chie-satonaka-satonaka-chie-saturday-satonaka-saturday-gif-21357663'
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


        elif asked_for_poll:
            # Extract the poll question and options from the message content
            for phrase in phrases_dict['poll_phrases']:
                if phrase in message_content_lower:
                    poll_content = message.content.lower().split(phrase, 1)[1].strip()
                    break
            else:
                poll_content = None

            if not poll_content:
                await message.channel.send("Please provide the poll question and options in the format: 'Matsuda, make a poll: Question | Option1 | Option2 | Option3 ...'")
                return

            try:
                poll_parts = poll_content.split('|')
                poll_question = poll_parts[0].strip()
                poll_options = [option.strip() for option in poll_parts[1:]]
                
                if len(poll_options) < 2:
                    await message.channel.send("You need to provide at least two options for the poll.")
                    return

                if len(poll_options) > 10:
                    await message.channel.send("You can provide a maximum of 10 options for the poll.")
                    return

                # Send the poll message
                poll_message = f"**{poll_question}**\n"
                emoji_list = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
                for i, option in enumerate(poll_options):
                    poll_message += f"{emoji_list[i]} {option}\n"

                poll_msg = await message.channel.send(poll_message)

                # Add reactions for voting
                for i in range(len(poll_options)):
                    await poll_msg.add_reaction(emoji_list[i])
            except Exception as e:
                print('Error creating poll:', e)
                await message.channel.send("Ah frick, I can't make a poll right now. Sorry...")


        # Rock, paper, scissors
        elif asked_for_rps:
            await message.channel.send("Sure thing! After this message, just type one of the three! Rock, paper, scissors...")
            def check(msg):
                return msg.author == message.author and msg.channel == message.channel and msg.content.lower() in ['rock', 'paper', 'scissors']
            try:
                user_choice = await bot.wait_for('message', timeout=30.0, check=check)
                user_choice = user_choice.content.lower()
            except asyncio.TimeoutError:
                await message.channel.send("Well, damn, just stand me up then.")
                return
            matsuda_choice = random.choice(['rock', 'paper', 'scissors'])
            await message.channel.send(matsuda_choice.capitalize())
            if (user_choice == 'rock' and matsuda_choice == 'scissors') or (user_choice == 'paper' and matsuda_choice == 'rock') or (user_choice == 'scissors' and matsuda_choice == 'paper'):
                await message.channel.send("Ah damn, ya got me...")
            elif user_choice == matsuda_choice:
                await message.channel.send("Ah, we tied...")
            else:
                await message.channel.send("HA, REKT, GG EZ + I'M JUST BETTER")

                
        elif told_goodnight:
            await message.channel.send("Nighty night!")
        else:
            recent_pings.clear()
            bot_muted = False  # Unmute the bot when it is addressed without a ping
            current_time = datetime.now()
            if cooldown_end_time is None or current_time >= cooldown_end_time:
                await message.channel.send('Someone say my name?')
                cooldown_end_time = current_time + timedelta(minutes=15)
            return

#-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Load the token from env
bot.run(os.getenv('DISCORD_TOKEN'))
