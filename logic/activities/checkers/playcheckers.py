# play.py
import discord
import asyncio
import re
from .game import CheckersGame
from .board import CheckersBoard

checkers_phrases = [
    "let's play checkers", "lets play checkers", "play checkers with me"
]

def check_phrases(message_content_lower):
    return {'checkers': any(phrase in message_content_lower for phrase in checkers_phrases)}

async def play_checkers(message, bot):
    game = CheckersGame()
    await message.channel.send("Sure, let's play Checkers! Type your move as 'start_col start_row end_col end_row' (e.g., 'a3 b4').")

    def check_move(msg):
        return msg.author == message.author and msg.channel == message.channel and re.match(r'^[a-h][1-8] [a-h][1-8]$', msg.content)

    while True:
        await message.channel.send(f"Current board:\n```\n{game.board.render()}\n```")
        await message.channel.send(f"{message.author.mention}, it's your turn ({'Red' if game.current_turn == CheckersBoard.RED_PIECE else 'Black'}).")

        try:
            move = await bot.wait_for('message', timeout=60.0, check=check_move)
            start, end = move.content.split()
            start_x, start_y = ord(start[0]) - ord('a'), int(start[1]) - 1
            end_x, end_y = ord(end[0]) - ord('a'), int(end[1]) - 1
            game.move_piece((start_x, start_y), (end_x, end_y))

            winner = game.check_winner()
            if winner:
                await message.channel.send(f"{winner} wins!")
                break

            if game.current_turn == CheckersBoard.BLACK_PIECE:
                game.bot_move()
                await message.channel.send(f"Bot moved. Current board:\n```\n{game.board.render()}\n```")

                winner = game.check_winner()
                if winner:
                    await message.channel.send(f"{winner} wins!")
                    break

        except asyncio.TimeoutError:
            await message.channel.send("Timeout! No move made.")
            break
