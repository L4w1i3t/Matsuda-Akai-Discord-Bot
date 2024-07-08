import discord
import asyncio
import re
import random

from logic.qlearn import Q_table, update_Q_table, get_state, choose_action
from logic.minimax import find_best_move
from logic.helper import save_Q_table

tic_tac_toe_phrases = ['let\'s play tic tac toe', 'let\'s play tictactoe', 'lets play tic tac toe', 'lets play tictactoe', 'let\'s play ttt', 'lets play ttt', 'play tic tac toe with me', 'play tictactoe with me', 'play ttt with me']

def check_phrases(message_content_lower):
    return {'tic-tac-toe': any(phrase in message_content_lower for phrase in tic_tac_toe_phrases)}

async def play_ttt(message, bot):
    await message.channel.send("Sure, let's do that! Type your move as a grid position (e.g., '1 1' for top left, '3 3' for bottom right).")
    await message.channel.send("Wanna be X or O?")

    def check_player_choice(msg):
        return msg.author == message.author and msg.channel == message.channel and msg.content.upper() in ['X', 'O']

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
        return msg.author == message.author and msg.channel == message.channel and msg.content.lower() in ['easy', 'normal', 'lunatic']

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
        for i in range(3):
            if board[i][0] == board[i][1] == board[i][2] != ' ' or board[0][i] == board[1][i] == board[2][i] != ' ':
                return board[i][0] if board[i][0] != ' ' else board[0][i]
        if board[0][0] == board[1][1] == board[2][2] != ' ' or board[0][2] == board[1][1] == board[2][0] != ' ':
            return board[0][0] if board[0][0] != ' ' else board[0][2]
        return None

    await message.channel.send(f"Current board:\n```\n{print_board()}\n```")

    while moves_made < 9 and not game_over:
        if player == 'X' and moves_made % 2 == 0 or player == 'O' and moves_made % 2 != 0:
            def check_move(msg):
                return msg.author == message.author and msg.channel == message.channel and re.match(r'^[1-3] [1-3]$', msg.content)

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

        next_state = get_state(board)
        update_Q_table(state, action[0] * 3 + action[1], reward, next_state, game_over)

    save_Q_table(Q_table)
