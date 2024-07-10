#uselessweb.py

import random
import json
import os
import requests

uselessweb_phrases = [
    'me a useless site', 'me a useless website', 'cure my boredom', 'me a website', 'take me to a random site',
    'me a random site', 'me a random website', 'me a site', 'me the useless web', 'gimme a random site', 'gimme a random website',
    'gimme a useless site', 'gimme a useless website'
]

def check_phrases(message_content_lower):
    return {'uselessweb_phrases': any(phrase in message_content_lower for phrase in uselessweb_phrases)}

async def send_randomsite(message):
    try:
        # Load the JSON file containing random websites
        with open(os.path.join(os.path.dirname(__file__), 'uselessweb.json'), 'r') as f:
            websites = json.load(f)['websites']
        
        # Choose a random website from the list
        website = random.choice(websites)
        await message.channel.send('You got it! Here\'s a little something to entertain you: ' + website)
    except Exception as e:
        print("Error fetching random website", e)
        await message.channel.send("Yeah, I dunno any off the top of my head. Sorry.")
