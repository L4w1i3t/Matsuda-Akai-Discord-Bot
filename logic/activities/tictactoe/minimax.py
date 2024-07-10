#minimax.py
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
