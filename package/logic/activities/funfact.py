#funfact.py

import requests

funfact_phrases = [
    'me a fun fact', 'me a random fun fact', 'me another fun fact', 'tell a fun fact', 'give a fun fact',
    'i want to hear a fun fact', 'i want a fun fact', 'gimme a fun fact'
]

def check_phrases(message_content_lower):
    return {'funfact_phrases': any(phrase in message_content_lower for phrase in funfact_phrases)}

async def send_funfact(message):
    try:
        response = requests.get('https://uselessfacts.jsph.pl/random.json?language=en')
        funfact = response.json()['text']
        await message.channel.send(funfact)
    except Exception as e:
        print("Error fetching fun fact", e)
        await message.channel.send("Yeah, I dunno any off the top of my head. Sorry.")