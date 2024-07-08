documentation_phrases = ['show me your commands', 'show me your documentation on how you work']

def check_phrases(message_content_lower):
    return {'documentation': any(phrase in message_content_lower for phrase in documentation_phrases)}

async def send_help_message(message):
    help_message = """
    Here are some things I can do so far:
    ```txt
- Mention my name and I will respond. I won't respond if you don't say my name or are just wasting my time!

- Wanna know specific commands? just say "Matsuda, show me your commands" or "Matsuda, show me your documentation on how you work".

- Ask me "what day is it" or similar to know the current day of the week.

- Ask me to "tell me a joke" or similar to hear a joke.

- Ask me to "show me a meme" or similar to see something from my meme collection.

- Ask me to "make a poll" or similar to create a poll with several choices.

- "Wanna play a game? I got Rock Paper Scissors and Tic Tac Toe!"

- Please don't ping me, or I'll get mad!
    ```
    """
    await message.channel.send(help_message)

async def send_documentation(message):
    doc_message = "Sure thing!\n```py\n"
    phrases_dict = {
        'day_of_week_phrases': ['what day is it', 'what day of the week is it', 'tell me the day', 'which day is it'],
        'joke_phrases': ['tell me a joke', 'give me a joke', 'i want to hear a joke', 'joke please', 'another joke', 'gimme a joke', 'joke, please'],
        'meme_phrases': ['me a meme', 'me a funny meme', 'me something from your meme collection', 'send a meme', 'show a meme', 'give a meme', 'another meme'],
        'poll_phrases': ['make a poll', 'create a poll', 'start a poll'],
        'documentation': ['show me your commands', 'show me your documentation on how you work'],
        'rps_phrases': ['let\'s play rps', 'let\'s play rock paper scissors', 'play rps with me', 'wanna play rps', 'play rock paper scissors with me', 'wanna play rock paper scissors', 'lets play rps', 'lets play rock paper scissors'],
        'tic-tac-toe': ['let\'s play tic tac toe', 'let\'s play tictactoe', 'lets play tic tac toe', 'lets play tictactoe', 'let\'s play ttt', 'lets play ttt', 'play tic tac toe with me', 'play tictactoe with me', 'play ttt with me']
    }
    for var_name, phrases in phrases_dict.items():
        doc_message += f"{var_name} = {phrases}\n\n"
    doc_message += "```"
    await message.channel.send(doc_message)
    await message.channel.send("All these are case-insensitive, by the way. For all I care, alternate between caps and lowercase or flame me.")
    await message.channel.send("Let me know if you have any questions!")
