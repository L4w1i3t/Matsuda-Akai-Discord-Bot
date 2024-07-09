import discord
import asyncio
import re
import random

# Import necessary functions from qlearn and minimax modules
from .qlearn import Q_table, update_Q_table, get_state, choose_action, save_Q_table, load_Q_table
from .minimax import find_best_move

# List of phrases to trigger tic-tac-toe game
tic_tac_toe_phrases = [
    'let\'s play tic tac toe', 'let\'s play tictactoe', 'lets play tic tac toe', 'lets play tictactoe',
    'let\'s play ttt', 'lets play ttt', 'play tic tac toe with me', 'play tictactoe with me', 'play ttt with me'
]

# Function to check if the message content contains any tic-tac-toe phrases
def check_phrases(message_content_lower):
    return {'tic-tac-toe': any(phrase in message_content_lower for phrase in tic_tac_toe_phrases)}

# Async function to handle the tic-tac-toe game
async def play_ttt(message, bot):
    # Initial message to start the game
    await message.channel.send("Sure, let's do that! Type your move as a grid position (e.g., '1 1' for top left, '3 3' for bottom right).")
    await message.channel.send("Wanna be X or O?")

    # Function to check the player's choice of X or O
    def check_player_choice(msg):
        return msg.author == message.author and msg.channel == message.channel and msg.content.upper() in ['X', 'O']

    try:
        # Wait for the player's choice
        player_choice_msg = await bot.wait_for('message', timeout=30.0, check=check_player_choice)
        player_choice = player_choice_msg.content.upper()
    except asyncio.TimeoutError:
        await message.channel.send("You didn't choose a side. If you don't wanna play anymore, that's fine. Just ask me again when you wanna play!")
        return

    player = player_choice
    bot_player = 'O' if player == 'X' else 'X'

    await message.channel.send("Want me to be gentle, be fair, or kick your ass? (Choose difficulty: Easy, Normal, Lunatic)")

    # Function to check the difficulty choice
    def check_difficulty_choice(msg):
        return msg.author == message.author and msg.channel == message.channel and msg.content.lower() in ['easy', 'normal', 'lunatic']

    try:
        # Wait for the difficulty choice
        difficulty_choice_msg = await bot.wait_for('message', timeout=30.0, check=check_difficulty_choice)
        difficulty = difficulty_choice_msg.content.lower()
    except asyncio.TimeoutError:
        await message.channel.send("You didn't choose a difficulty. If you don't wanna play anymore, that's fine. Just ask me again when you wanna play!")
        return

    # Initialize the game board and other variables
    board = [[' ' for _ in range(3)] for _ in range(3)]
    moves_made = 0
    game_over = False
    state_action_pairs = []

    # Function to print the current board state
    def print_board():
        board_display = ""
        for i, row in enumerate(board):
            board_display += "|".join([f" {cell} " for cell in row]) + "\n"
            if i < 2:  # Only add separator for the first two rows
                board_display += "---|---|---\n"
        return board_display

    # Function to check for a winner
    def check_winner():
        for i in range(3):
            if board[i][0] == board[i][1] == board[i][2] != ' ':
                return board[i][0]
            if board[0][i] == board[1][i] == board[2][i] != ' ':
                return board[0][i]
        if board[0][0] == board[1][1] == board[2][2] != ' ':
            return board[0][0]
        if board[0][2] == board[1][1] == board[2][0] != ' ':
            return board[0][2]
        return None

    # Show the initial board
    await message.channel.send(f"Current board:\n```\n{print_board()}\n```")

    # Main game loop
    while moves_made < 9 and not game_over:
        # Check if it's the player's turn
        if (player == 'X' and moves_made % 2 == 0) or (player == 'O' and moves_made % 2 != 0):
            def check_move(msg):
                return msg.author == message.author and msg.channel == message.channel and re.match(r'^[1-3] [1-3]$', msg.content)

            try:
                # Wait for the player's move
                move = await bot.wait_for('message', timeout=30.0, check=check_move)
                x, y = map(int, move.content.split())
                x -= 1
                y -= 1

                # Check if the chosen cell is empty
                if board[x][y] != ' ':
                    await message.channel.send("There's already something there, dingus.")
                    continue

                # Update the board with the player's move
                board[x][y] = player
                state = get_state(board)
                action = (x, y)
                state_action_pairs.append((state, action))
            except asyncio.TimeoutError:
                await message.channel.send("Timeout! No move made.")
                break
        else:
            # Bot's turn to move
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

        # Check for a winner after each move
        winner = check_winner()
        if winner:
            game_over = True
            await message.channel.send(f"Current board:\n```\n{print_board()}\n```")
            if winner == player:
                await message.channel.send("Well crap, I lost.")
            else:
                await message.channel.send("HAHA! I win!")
            reward = 1 if winner == bot_player else -1
        else:
            await message.channel.send(f"Current board:\n```\n{print_board()}\n```")
            reward = 0

        if moves_made == 9 and not game_over:
            game_over = True
            await message.channel.send("Looks like we tied.")
            reward = 0.5

        # Update the Q-table with the results of the move
        next_state = get_state(board)
        update_Q_table(state, action[0] * 3 + action[1], reward, next_state, game_over)

    # Save the updated Q-table
    save_Q_table(Q_table)

# Ensure the Q-table is loaded at the start
load_Q_table()
