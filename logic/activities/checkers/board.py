# board.py

class CheckersBoard:
    EMPTY = '⬜'
    BLACK_PIECE = '⚫'
    RED_PIECE = '🔴'
    WHITE_SQUARE = '⬛'

    def __init__(self):
        self.board = self.create_board()

    def create_board(self):
        board = [[self.EMPTY for _ in range(8)] for _ in range(8)]
        for i in range(8):
            for j in range(8):
                if (i + j) % 2 != 0:
                    if i < 3:
                        board[i][j] = self.BLACK_PIECE
                    elif i > 4:
                        board[i][j] = self.RED_PIECE
                    else:
                        board[i][j] = self.WHITE_SQUARE
        return board

    def render(self):
        columns = '  a b c d e f g h\n'
        board_display = columns
        for i, row in enumerate(self.board):
            board_display += f"{i+1} " + " ".join(row) + f" {i+1}\n"
        board_display += columns
        return board_display

    def move_piece(self, start, end):
        sx, sy = start
        ex, ey = end
        self.board[ex][ey] = self.board[sx][sy]
        self.board[sx][sy] = self.EMPTY
