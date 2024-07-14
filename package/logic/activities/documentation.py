#documentation.py

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