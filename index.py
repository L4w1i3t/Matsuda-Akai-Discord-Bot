import asyncio
import discord
from discord.ext import commands, tasks
from datetime import datetime, timedelta
import requests
import os
import random
import json
from dotenv import load_dotenv
import re
import numpy as np
import pickle

# Decrypt the .env file
os.system('python decrypt_env.py')
load_dotenv()

bot = commands.Bot(command_prefix='!', intents=discord.Intents.all())

# Load meme texts from json
with open('meme_texts.json', 'r') as file:
    meme_texts = json.load(file)

# List to keep track of recent pings
recent_pings = []
bot_muted = False

# Cooldown tracking
cooldown_end_time = None

# Q-learning parameters
Q_table = {}
learning_rate = 0.1
discount_factor = 0.9
exploration_rate = 1.0
exploration_decay = 0.995
min_exploration_rate = 0.01

# Save and load Q-table
Q_table_file = 'Q_table.pkl'

def save_Q_table():
    with open(Q_table_file, 'wb') as file:
        pickle.dump(Q_table, file)

def load_Q_table():
    global Q_table
    if os.path.exists(Q_table_file):
        with open(Q_table_file, 'rb') as file:
            Q_table = pickle.load(file)

load_Q_table()

def minimax(board, depth, is_maximizing, alpha, beta, bot_player, player):
    def evaluate(board):
        for row in board:
            if row[0] == row[1] == row[2] != ' ':
                return 1 if row[0] == bot_player else -1
        for col in range(3):
            if board[0][col] == board[1][col] == board[2][col] != ' ':
                return 1 if board[0][col] == bot_player else -1
        if board[0][0] == board[1][1] == board[2][2] != ' ':
            return 1 if board[0][0] == bot_player else -1
        if board[0][2] == board[1][1] == board[2][0] != ' ':
            return 1 if board[0][2] == bot_player else -1
        return 0

    def is_moves_left(board):
        for row in board:
            if ' ' in row:
                return True
        return False

    score = evaluate(board)
    if score == 1:
        return score
    if score == -1:
        return score
    if not is_moves_left(board):
        return 0

    if is_maximizing:
        best = -float('inf')
        for i in range(3):
            for j in range(3):
                if board[i][j] == ' ':
                    board[i][j] = bot_player
                    best = max(best, minimax(board, depth + 1, not is_maximizing, alpha, beta, bot_player, player))
                    board[i][j] = ' '
                    alpha = max(alpha, best)
                    if beta <= alpha:
                        break
        return best
    else:
        best = float('inf')
        for i in range(3):
            for j in range(3):
                if board[i][j] == ' ':
                    board[i][j] = player
                    best = min(best, minimax(board, depth + 1, not is_maximizing, alpha, beta, bot_player, player))
                    board[i][j] = ' '
                    beta = min(beta, best)
                    if beta <= alpha:
                        break
        return best

def find_best_move(board, bot_player, player):
    best_val = -float('inf')
    best_move = (-1, -1)
    for i in range(3):
        for j in range(3):
            if board[i][j] == ' ':
                board[i][j] = bot_player
                move_val = minimax(board, 0, False, -float('inf'), float('inf'), bot_player, player)
                board[i][j] = ' '
                if move_val > best_val:
                    best_move = (i, j)
                    best_val = move_val
    return best_move

@bot.event
async def on_ready():
    print('MATSUDA IS ONLINE!')

@bot.event
async def on_message(message):
    global bot_muted, cooldown_end_time, exploration_rate

    state = None
    action = None
    reward = 0

    # Check if the message is from a bot, if so, ignore it
    if message.author.bot:
        return

    # Find the "clown" role case insensitively for both "clown" and "Clown"
    clown_role = next((role for role in message.guild.roles if role.name.lower() == "clown"), None)
    if clown_role and clown_role in message.author.roles:
        if any(mention in message.content for mention in ['@everyone', '@here']) or message.mentions:
            await message.delete()
            await message.channel.send(f"{message.author.mention} ***SHUT.***")
            return

    # Check if the bot is mentioned
    bot_mentioned = bot.user in message.mentions
    if bot_mentioned:
        if not bot_muted:
            recent_pings.append(message.author.id)
            if len(recent_pings) == 2:
                await message.channel.send("Okay, ha ha, you had your fun, now please stop.")
            elif len(recent_pings) == 3:
                await message.channel.send("""
                Alright, listen up. I can't believe I have to fucking say this: STOP FUCKING PINGING ME. Seriously, I'm not your damn servant. I'm not here to cater to your every random thought or meme. Just because you feel like sharing some dumb bullshit doesn't mean you need to drag me into it with a ping. Do you think my notifications exist for your fucking convenience? HELL NO.

I have a life outside of this damn server, believe it or not. Every time you ping me, my focus gets wrecked and my sanity takes another hit. Not to mention I could be blocking stuff for LITERALLY ANYONE ELSE. Imagine being in the middle of something important and then BAM, another "Hey, @me, check this out! GUHUHUHU!" like I'm just sitting here waiting for your summons. Fuck outta here with that bullshit.

So, here's a fucking novel idea: Use what you have left of your brain. Think for a second: is your message really worth a ping? Can it wait? Can you figure it out yourself? Because 99% of the time, the answer is a resounding YES. And if it's truly, absolutely, undeniably urgent, maybe, JUST MAYBE, talk to my dad about it.

Let's save the pings for other people or announcements, not your random bullshit. Thanks for coming to my TED Talk, and get fucked.
                """)

            elif len(recent_pings) == 4:
                await message.channel.send("Dafuq did I just say, you little shit?")

            elif len(recent_pings) == 5:
                # Timeout the user who pings for the fifth time
                try:
                    timeout_duration = timedelta(minutes=1)
                    await message.author.timeout(timeout_duration)
                    await message.channel.send(f"{message.author.mention} ***SINCE WHEN WERE YOU THE ONE IN CONTROL?***")
                except discord.Forbidden:
                    await message.channel.send("***I would time you out, but you're stronger than me...***")

            elif len(recent_pings) == 6:
                # Repeat timeouts
                try:
                    timeout_duration = timedelta(minutes=2)
                    await message.author.timeout(timeout_duration)
                    await message.channel.send(f"{message.author.mention} ***OH, WE GOT ANOTHER!***")
                except discord.Forbidden:
                    await message.channel.send("***I would time you out, but you're stronger than me...***")

            elif len(recent_pings) >= 7:
                # Repeat timeouts
                try:
                    timeout_duration = timedelta(minutes=3)
                    await message.author.timeout(timeout_duration)
                    await message.channel.send(f"{message.author.mention} ***YEET.***")
                except discord.Forbidden:
                    await message.channel.send("***I would time you out, but you're stronger than me...***")

            else:
                await message.channel.send("Don't ping me! >:(")
        return

    # Define a function to check for phrases
    def check_for_phrases(message_content, phrases):
        return any(phrase in message_content for phrase in phrases)

    # Clear recent pings if the bot is addressed but not mentioned
    bot_names = ['Matsuda', 'Matsu']
    message_content_lower = message.content.lower()
    bot_addressed = any(name.lower() in message_content_lower for name in bot_names)

    # Dictionary to store phrases and their corresponding check flags
    phrases_dict = {
        'day_of_week_phrases': ['what day is it', 'what day of the week is it', 'tell me the day', 'which day is it'],
        'joke_phrases': ['tell me a joke', 'give me a joke', 'i want to hear a joke', 'joke please', 'another joke', 'gimme a joke', 'joke, please'],
        'meme_phrases': ['me a meme', 'me a funny meme', 'me something from your meme collection', 'send a meme', 'show a meme', 'give a meme', 'another meme'],
        'poll_phrases': ['make a poll', 'create a poll', 'start a poll'],
        'documentation': ['show me your commands', 'show me your documentation on how you work'],
        'rps_phrases': ['let\'s play rps', 'let\'s play rock paper scissors', 'play rps with me', 'wanna play rps', 'play rock paper scissors with me', 'wanna play rock paper scissors', 'lets play rps', 'lets play rock paper scissors'],
        'tic-tac-toe': ['let\'s play tic tac toe', 'let\'s play tictactoe', 'lets play tic tac toe', 'lets play tictactoe', 'let\'s play ttt', 'lets play ttt', 'play tic tac toe with me', 'play tictactoe with me', 'play ttt with me']
    }
    admin_dict = {
        'announcements': ['make an announcement', 'make an announcement:']
    }
    convo_dict = {
        'night_phrases': ['good night', 'goodnight', 'nighty night']
    }
    # Check for phrases and set flags
    check_flags = {key: check_for_phrases(message_content_lower, phrases) for key, phrases in phrases_dict.items()}
    check_admin_flags = {key: check_for_phrases(message_content_lower, phrases) for key, phrases in admin_dict.items()}
    check_convo_flags = {key: check_for_phrases(message_content_lower, phrases) for key, phrases in convo_dict.items()}

    # Access specific flags as needed
    asked_for_day_of_week = check_flags['day_of_week_phrases']
    asked_for_joke = check_flags['joke_phrases']
    asked_for_meme = check_flags['meme_phrases']
    asked_for_poll = check_flags['poll_phrases']
    told_goodnight = check_convo_flags['night_phrases']
    asked_for_documentation = check_flags['documentation']
    asked_for_rps = check_flags['rps_phrases']
    asked_for_ttt = check_flags['tic-tac-toe']

    # Admin flags
    asked_for_announcement = check_admin_flags['announcements']

    if bot_addressed and not bot_muted:
        
        if '!help' in message_content_lower or 'what do you do' in message_content_lower or 'what can you do' in message_content_lower:
            help_message = """
            Here are some things I can do so far:
            ```txt
- Mention my name and I will respond. I won't respond if you don't say my name or are just wasting my time!

- Wanna know specific commands? just say \"Matsuda, show me your commands\" or \"Matsuda, show me your documentation on how you work\".

- Ask me "what day is it" or similar to know the current day of the week.

- Ask me to "tell me a joke" or similar to hear a joke.

- Ask me to "show me a meme" or similar to see something from my meme collection.

- Ask me to "make a poll" or similar to create a poll with several choices.

- "Wanna play a game? I got Rock Paper Scissors and Tic Tac Toe!"

- Please don't ping me, or I'll get mad!
            ```
            """
            await message.channel.send(help_message)
        
        elif asked_for_documentation:
            doc_message = "Sure thing!\n```py\n"
            for var_name, phrases in phrases_dict.items():
                doc_message += f"{var_name} = {phrases}\n\n"
            doc_message += "```"
            await message.channel.send(doc_message)
            await message.channel.send("All these are case-insensitive, by the way. For all I care, alternate between caps and lowercase or flame me.")
            await message.channel.send("Let me know if you have any questions!")

        elif asked_for_joke:
            # 1% chance to ping a random member
            if random.random() < 0.01:
                members = [member for member in message.guild.members if not member.bot]
                if members:
                    random_member = random.choice(members)
                    await message.channel.send(f"{random_member.mention}")
                else:
                    await message.channel.send("I couldn't find anyone to ping.")
            else:
                try:
                    response = requests.get('https://official-joke-api.appspot.com/random_joke')
                    joke = response.json()
                    joke_message = f"{joke['setup']} - {joke['punchline']}"
                    await message.channel.send(joke_message)
                except Exception as e:
                    print('Error fetching joke:', e)
                    await message.channel.send("I'm sorry, I can't think of any good jokes right now...")

        elif asked_for_day_of_week:
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

        elif asked_for_meme:
            try:
                username = os.getenv('IMGFLIP_USERNAME')
                password = os.getenv('IMGFLIP_PASSWORD')
                
                response = requests.get('https://api.imgflip.com/get_memes')
                memes = response.json().get('data', {}).get('memes', [])
                
                if memes:
                    meme = random.choice(memes)
                    meme_url = meme['url']
                    meme_id = meme['id']
                    
                    # Generate random text for the meme from the JSON dataset
                    top_text = random.choice(meme_texts['goofy_texts'])
                    bottom_text = random.choice(meme_texts['goofy_texts'])
                    extra_text = random.choice(meme_texts['goofy_texts'])
                    
                    # Create the meme with text
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

        elif asked_for_poll:
            # Use a regular expression to match "make a poll"
            match = re.search(r'make a poll:?\s*(.*)', message.content, re.IGNORECASE | re.DOTALL)
            if match:
                poll_content = match.group(1).strip()

                try:
                    poll_parts = poll_content.split('|')
                    poll_question = poll_parts[0].strip()
                    poll_options = [option.strip() for option in poll_parts[1:]]

                    if len(poll_options) < 2:
                        await message.channel.send("Please provide the poll question and options in the format: 'Matsuda, make a poll: Question | Option1 | Option2 | Option3 ...'")
                        return

                    if len(poll_options) > 10:
                        await message.channel.send("Sorry, You can provide a maximum of 10 options for the poll!")
                        return

                    # Send the poll message
                    poll_message = f"**{poll_question}**\n"
                    emoji_list = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
                    for i, option in enumerate(poll_options):
                        poll_message += f"{emoji_list[i]} {option}\n"

                    poll_msg = await message.channel.send(poll_message)

                    # Add reactions for voting
                    for i in range(len(poll_options)):
                        await poll_msg.add_reaction(emoji_list[i])
                except Exception as e:
                    print('Error creating poll:', e)
                    await message.channel.send("Ah frick, I can't make a poll right now. Sorry...")
            else:
                await message.channel.send("Please provide the poll question and options in the format: 'Matsuda, make a poll: Question | Option1 | Option2 | Option3 ...'")

        # Rock, paper, scissors
        elif asked_for_rps:
            await message.channel.send("Sure thing! After this message, just type one of the three! Rock, paper, scissors...")
            def check(msg):
                return msg.author == message.author and msg.channel == msg.channel and msg.content.lower() in ['rock', 'paper', 'scissors']
            try:
                user_choice = await bot.wait_for('message', timeout=30.0, check=check)
                user_choice = user_choice.content.lower()
            except asyncio.TimeoutError:
                await message.channel.send("Well, damn, just stand me up then.")
                return
            matsuda_choice = random.choice(['rock', 'paper', 'scissors'])
            await message.channel.send(matsuda_choice.capitalize())
            if (user_choice == 'rock' and matsuda_choice == 'scissors') or (user_choice == 'paper' and matsuda_choice == 'rock') or (user_choice == 'scissors' and matsuda_choice == 'paper'):
                await message.channel.send("Ah damn, ya got me...")
            elif user_choice == matsuda_choice:
                await message.channel.send("Ah, we tied...")
            else:
                await message.channel.send("HA, REKT, GG EZ + I'M JUST BETTER")

        # Tic Tac Toe
        elif asked_for_ttt:
            await message.channel.send("Sure, let's do that! Type your move as a grid position (e.g., '1 1' for top left, '3 3' for bottom right).")
            await message.channel.send("Wanna be X or O?")

            def check_player_choice(msg):
                return msg.author == message.author and msg.channel == msg.channel and msg.content.upper() in ['X', 'O']

            try:
                player_choice_msg = await bot.wait_for('message', timeout=30.0, check=check_player_choice)
                player_choice = player_choice_msg.content.upper()
            except asyncio.TimeoutError:
                await message.channel.send("You didn't choose a side. If you don't wanna play anymore, that's fine. Just ask me again when you wanna play!")
                return

            player = player_choice
            bot_player = 'O' if player == 'X' else 'X'

            await message.channel.send("Want me to be gentle, be fair, or kick your ass? (Choose difficulty: Easy, Normal, Lunatic)")

            def check_difficulty_choice(msg):
                return msg.author == message.author and msg.channel == msg.channel and msg.content.lower() in ['easy', 'normal', 'lunatic']

            try:
                difficulty_choice_msg = await bot.wait_for('message', timeout=30.0, check=check_difficulty_choice)
                difficulty = difficulty_choice_msg.content.lower()
            except asyncio.TimeoutError:
                await message.channel.send("You didn't choose a difficulty. If you don't wanna play anymore, that's fine. Just ask me again when you wanna play!")
                return

            board = [[' ' for _ in range(3)] for _ in range(3)]
            moves_made = 0
            game_over = False
            state_action_pairs = []

            def print_board():
                board_display = ""
                for i, row in enumerate(board):
                    board_display += "|".join([f" {cell} " for cell in row]) + "\n"
                    if i < 2:  # Only add separator for the first two rows
                        board_display += "---|---|---\n"
                return board_display

            def check_winner():
                # Check rows, columns, and diagonals
                for i in range(3):
                    if board[i][0] == board[i][1] == board[i][2] != ' ' or board[0][i] == board[1][i] == board[2][i] != ' ':
                        return True
                if board[0][0] == board[1][1] == board[2][2] != ' ' or board[0][2] == board[1][1] == board[2][0] != ' ':
                    return True
                return False

            def get_state(board):
                return ''.join([''.join(row) for row in board])

            def choose_action(state, possible_actions):
                if state not in Q_table:
                    Q_table[state] = np.zeros(len(possible_actions))

                if random.uniform(0, 1) < exploration_rate:
                    return random.choice(possible_actions)
                else:
                    return possible_actions[np.argmax(Q_table[state])]

            def update_Q_table(state, action, reward, next_state, done):
                if state not in Q_table:
                    Q_table[state] = np.zeros(9)

                if next_state not in Q_table:
                    Q_table[next_state] = np.zeros(9)

                best_next_action = np.argmax(Q_table[next_state])
                td_target = reward + discount_factor * Q_table[next_state][best_next_action] * (1 - done)
                td_error = td_target - Q_table[state][action]
                Q_table[state][action] += learning_rate * td_error

            await message.channel.send(f"Current board:\n```\n{print_board()}\n```")

            while moves_made < 9 and not game_over:
                if player == 'X' and moves_made % 2 == 0 or player == 'O' and moves_made % 2 != 0:
                    def check_move(msg):
                        return msg.author == message.author and msg.channel == msg.channel and re.match(r'^[1-3] [1-3]$', msg.content)

                    try:
                        move = await bot.wait_for('message', timeout=30.0, check=check_move)
                        x, y = map(int, move.content.split())
                        x -= 1
                        y -= 1

                        if board[x][y] != ' ':
                            await message.channel.send("There's already something there, dingus.")
                            continue

                        board[x][y] = player
                        state = get_state(board)
                        action = (x, y)
                        state_action_pairs.append((state, action))
                    except asyncio.TimeoutError:
                        await message.channel.send("Timeout! No move made.")
                        break
                else:
                    state = get_state(board)
                    if difficulty == 'easy':
                        action = random.choice([(i, j) for i in range(3) for j in range(3) if board[i][j] == ' '])
                    elif difficulty == 'normal':
                        empty_positions = [(i, j) for i in range(3) for j in range(3) if board[i][j] == ' ']
                        action = choose_action(state, empty_positions)
                    elif difficulty == 'lunatic':
                        action = find_best_move(board, bot_player, player)
                    x, y = action
                    board[x][y] = bot_player
                    state_action_pairs.append((state, (x, y)))

                moves_made += 1

                if check_winner():
                    game_over = True
                    await message.channel.send(f"Current board:\n```\n{print_board()}\n```")
                    await message.channel.send(f"Player {'X' if moves_made % 2 == 1 else 'O'} wins!")
                    reward = 1 if (moves_made % 2 == 1) else -1
                else:
                    await message.channel.send(f"Current board:\n```\n{print_board()}\n```")
                    reward = 0

                if moves_made == 9 and not game_over:
                    game_over = True
                    await message.channel.send(f"Current board:\n```\n{print_board()}\n```")
                    await message.channel.send("It's a draw!")
                    reward = 0.5

                next_state = get_state(board)
                update_Q_table(state, action[0] * 3 + action[1], reward, next_state, game_over)

            exploration_rate = max(min_exploration_rate, exploration_rate * exploration_decay)
            save_Q_table()

        elif told_goodnight:
            await message.channel.send("Nighty night!")

        #------------------------------------ADMIN ONLY
        elif asked_for_announcement:
            if message.author.guild_permissions.administrator:
                # Use a regular expression to match "make an announcement"
                match = re.search(r'make an announcement:?\s*(.*)', message.content, re.IGNORECASE | re.DOTALL)
                if match:
                    announcement = match.group(1).strip()
                    announcements_channel = discord.utils.get(message.guild.text_channels, name='announcements')
                    if announcements_channel:
                        await announcements_channel.send(f"📢 @everyone\n**ANNOUNCEMENT:**\n\n{announcement}")
                        await message.channel.send("Done!")
                    else:
                        await message.channel.send("Couldn't find an #announcements channel. Please create one and try again.")
                else:
                    await message.channel.send("Please provide the announcement content.")
            else:
                await message.channel.send("You do not have permission to make announcements.")
        #------------------------------------

        else:
            recent_pings.clear()
            bot_muted = False  # Unmute the bot when it is addressed without a ping
            current_time = datetime.now()
            if cooldown_end_time is None or current_time >= cooldown_end_time:
                await message.channel.send('Someone say my name?')
                cooldown_end_time = current_time + timedelta(minutes=15)
            return

# Load the token from env
bot.run(os.getenv('DISCORD_TOKEN'))