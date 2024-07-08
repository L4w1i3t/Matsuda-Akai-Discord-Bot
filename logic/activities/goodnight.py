night_phrases = ['good night', 'goodnight', 'nighty night']

def check_phrases(message_content_lower):
    return {'night_phrases': any(phrase in message_content_lower for phrase in night_phrases)}

async def send_goodnight(message):
    await message.channel.send("Nighty night!")
