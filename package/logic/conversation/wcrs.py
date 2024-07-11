import re
import asyncio

wcrs_phrases = [
    r'\bwhich community reigns supreme\b', r'\bwhich community reigns supreme\?\b', r'\bwhat community reigns supreme\b', r'\bwhat community reigns supreme\?\b',
]

interpret_phrases = [
    r'\binterpreting vague answer as "yes"\b', r'\binterpreting vague answer as yes\b'
]

# Dictionary to store conversation states for each user
conversation_state = {}

def check_phrases(message_content_lower):
    return {'wcrs_phrases': any(re.search(phrase, message_content_lower) for phrase in wcrs_phrases)}

async def send_wcrs(message):
    await message.channel.send('What do you think?')
    # Store that the bot is waiting for an immediate response from the user
    #conversation_state[message.author.id] = 'waiting_for_interpretation'

#async def handle_wcrs_message(message):
    #message_content_lower = message.content.lower()
    #user_id = message.author.id

    #if check_phrases(message_content_lower, wcrs_phrases):
        #await send_wcrs(message)
    #elif conversation_state.get(user_id) == 'waiting_for_interpretation' and check_phrases(message_content_lower, interpret_phrases):
        #await message.channel.send('NO, nonononono! Agh, didn\'t pick up on my sarcasm...')
        # Clear the conversation state
        #conversation_state.pop(user_id)
    #else:
        # Clear the conversation state if the user responds with something else
        #conversation_state.pop(user_id, None)
