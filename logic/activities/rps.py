#rps.py
import discord
import asyncio
import random

rps_phrases = [
    'let\'s play rps', 'let\'s play rock paper scissors', 'play rps with me', 'wanna play rps', 
    'play rock paper scissors with me', 'wanna play rock paper scissors', 'lets play rps', 'lets play rock paper scissors'
    ]

def check_phrases(message_content_lower):
    return {'rps_phrases': any(phrase in message_content_lower for phrase in rps_phrases)}

async def play_rps(message, bot):
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
