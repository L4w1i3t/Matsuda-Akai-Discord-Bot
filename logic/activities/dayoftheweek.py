import discord
from datetime import datetime

day_of_week_phrases = ['what day is it', 'what day of the week is it', 'tell me the day', 'which day is it']

def check_phrases(message_content_lower):
    return {'day_of_week_phrases': any(phrase in message_content_lower for phrase in day_of_week_phrases)}

async def send_day_of_week(message):
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
