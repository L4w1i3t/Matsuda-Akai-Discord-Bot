documentation_phrases = [
    'show me your commands', 'show me your documentation on how you work'
    ]

def check_phrases(message_content_lower):
    return {'documentation': any(phrase in message_content_lower for phrase in documentation_phrases)}

async def send_help_message(message):
    help_message = """
    Here are some things I can do so far:
    ```txt
- Mention my name and I will respond. I won't respond if you don't say my name or are just wasting my time!

- Wanna know specific commands? just say "Matsuda, show me your commands" or "Matsuda, show me your documentation on how you work". [THIS IS CURRENTLY UNDER MAINTENANCE, COME BACK LATER]

- Ask me "what day is it" or similar to know the current day of the week.

- Ask me to "tell me a joke" or similar to hear a joke.

- Ask me to "show me a meme" or similar to see something from my meme collection.

- Want a fun fact? Just say the word and I'll give you a fun fact.

- I have a treasure trove of random websites that I can show you if you want me to!

- Ask me to "make a poll" or similar to create a poll with several choices.

- "Wanna play a game? I got Rock Paper Scissors and Tic Tac Toe! Also putting together checkers, but things are a bit screwy with that right now."

- Please don't ping me, or I'll get mad!
    ```
    """
    await message.channel.send(help_message)

async def send_documentation(message):
    doc_message = "Sure thing!\n```py\n"
    phrases_dict = {
        'UNDER MAINTENANCE. SORRY!'
    }
    for var_name, phrases in phrases_dict.items():
        doc_message += f"{var_name} = {phrases}\n\n"
    doc_message += "```"
    await message.channel.send(doc_message)
    await message.channel.send("All these are case-insensitive, by the way. For all I care, alternate between caps and lowercase or flame me.")
    await message.channel.send("Let me know if you have any questions!")
