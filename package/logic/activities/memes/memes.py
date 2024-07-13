#memes.py
import discord
import os
import requests
import random
import json

meme_phrases = [
    'me a meme', 'me a funny meme', 'me something from your meme collection', 'send a meme', 'show a meme', 'give a meme', 'another meme'
    ]

def check_phrases(message_content_lower):
    return {'meme_phrases': any(phrase in message_content_lower for phrase in meme_phrases)}

async def send_meme(message):
    try:
        username = os.getenv('IMGFLIP_USERNAME')
        password = os.getenv('IMGFLIP_PASSWORD')
        
        response = requests.get('https://api.imgflip.com/get_memes')
        memes = response.json().get('data', {}).get('memes', [])
        
        if memes:
            meme = random.choice(memes)
            meme_url = meme['url']
            meme_id = meme['id']

            current_dir = os.path.dirname(os.path.abspath(__file__))
            meme_texts_path = os.path.join(current_dir, 'meme_texts.json')
            
            with open(meme_texts_path, 'r') as file:
                meme_texts = json.load(file)
            
            top_text = random.choice(meme_texts['goofy_texts'])
            bottom_text = random.choice(meme_texts['goofy_texts'])
            extra_text = random.choice(meme_texts['goofy_texts'])
            
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
