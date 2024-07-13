#hello.py
import re

hello_phrases = [
    r'\bhello\b', r'\bhello chat\b', r'\bhello, chat\b', r'\bhi\b', r'\bsup\b', r'\bhola\b', r'\bhey\b'
]

def check_phrases(message_content_lower):
    return {'hello_phrases': any(re.search(phrase, message_content_lower) for phrase in hello_phrases)}

async def send_hello(message):
    await message.channel.send('Hello, ' + message.author.mention + '!')
