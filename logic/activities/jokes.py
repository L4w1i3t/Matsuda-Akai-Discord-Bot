import discord
import requests
import random

joke_phrases = ['tell me a joke', 'give me a joke', 'i want to hear a joke', 'joke please', 'another joke', 'gimme a joke', 'joke, please']

def check_phrases(message_content_lower):
    return {'joke_phrases': any(phrase in message_content_lower for phrase in joke_phrases)}

async def send_joke(message):
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
