# game.py

from .board import CheckersBoard
import random

class CheckersGame:
    def __init__(self):
        self.board = CheckersBoard()
        self.current_turn = CheckersBoard.RED_PIECE  # red starts

    def is_valid_move(self, start, end):
        sx, sy = start
        ex, ey = end
        piece = self.board.board[sx][sy]

        if piece == CheckersBoard.EMPTY:
            return False
        if self.board.board[ex][ey] != CheckersBoard.EMPTY:
            return False
        if piece == CheckersBoard.RED_PIECE:
            if (ex - sx, ey - sy) not in [(-1, -1), (-1, 1)]:
                return False
        elif piece == CheckersBoard.BLACK_PIECE:
            if (ex - sx, ey - sy) not in [(1, -1), (1, 1)]:
                return False
        return True

    def move_piece(self, start, end):
        if self.is_valid_move(start, end):
            self.board.move_piece(start, end)
            self.switch_turn()

    def switch_turn(self):
        self.current_turn = CheckersBoard.BLACK_PIECE if self.current_turn == CheckersBoard.RED_PIECE else CheckersBoard.RED_PIECE

    def check_winner(self):
        red_pieces = sum(row.count(CheckersBoard.RED_PIECE) for row in self.board.board)
        black_pieces = sum(row.count(CheckersBoard.BLACK_PIECE) for row in self.board.board)
        if red_pieces == 0:
            return 'Black'
        elif black_pieces == 0:
            return 'Red'
        return None

    def bot_move(self):
        possible_moves = []
        for i in range(8):
            for j in range(8):
                if self.board.board[i][j] == self.current_turn:
                    for dx, dy in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
                        if self.is_valid_move((i, j), (i+dx, j+dy)):
                            possible_moves.append(((i, j), (i+dx, j+dy)))
        if possible_moves:
            move = random.choice(possible_moves)
            self.move_piece(*move)
