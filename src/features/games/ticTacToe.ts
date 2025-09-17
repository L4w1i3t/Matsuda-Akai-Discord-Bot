import { Message } from "discord.js";
import {
  checkPhrases,
  getRandomElement,
  shouldRespond,
  safeChannelSend,
} from "../../utils/helpers";

const TTT_PHRASES = [
  "let's play tic tac toe",
  "let's play tictactoe",
  "lets play tic tac toe",
  "lets play tictactoe",
  "let's play ttt",
  "lets play ttt",
  "play tic tac toe with me",
  "play tictactoe with me",
  "play ttt with me",
  "tic tac toe",
  "tictactoe",
  "ttt",
  "tic tac toe game",
  "tictactoe game",
  "ttt game",
  "tic tac toe match",
  "tictactoe match",
  "ttt match",
  "wanna play tic tac toe",
  "wanna play tictactoe",
  "wanna play ttt",
  "want to play tic tac toe",
  "want to play tictactoe",
  "want to play ttt",
  "up for tic tac toe",
  "up for tictactoe",
  "up for ttt",
  "fancy tic tac toe",
  "fancy tictactoe",
  "fancy ttt",
  "tic tac toe challenge",
  "tictactoe challenge",
  "ttt challenge",
  "challenge me to tic tac toe",
  "challenge me to tictactoe",
  "challenge me to ttt",
  "tic tac toe time",
  "tictactoe time",
  "ttt time",
  "how about tic tac toe",
  "how about tictactoe",
  "how about ttt",
];

type Player = "X" | "O";
type BoardCell = Player | " ";
type Board = BoardCell[][];
type Difficulty = "easy" | "normal" | "lunatic";

export class TicTacToeHandler {
  static checkPhrases(messageContent: string): { ttt: boolean } {
    return {
      ttt: checkPhrases(messageContent, TTT_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    try {
      if (!("awaitMessages" in message.channel)) {
        await safeChannelSend(
          message.channel,
          "Sorry, can't play Tic-Tac-Toe in this type of channel!",
        );
        return;
      }

      await safeChannelSend(
        message.channel,
        "Sure, let's do that! Type your move as a grid position (e.g., '1 1' for top left, '3 3' for bottom right).",
      );
      await safeChannelSend(message.channel, "Wanna be X or O?");

      // Wait for player choice (X or O)
      const playerChoiceFilter = (msg: Message) => {
        return (
          msg.author.id === message.author.id &&
          msg.channel.id === message.channel.id &&
          ["X", "O"].includes(msg.content.toUpperCase())
        );
      };

      try {
        const playerChoiceCollection = await message.channel.awaitMessages({
          filter: playerChoiceFilter,
          max: 1,
          time: 30000,
          errors: ["time"],
        });

        const playerChoiceMsg = playerChoiceCollection.first();
        if (!playerChoiceMsg) return;

        const player = playerChoiceMsg.content.toUpperCase() as Player;
        const botPlayer = player === "X" ? "O" : "X";

        if ("send" in message.channel) {
          await message.channel.send(
            "Want me to be gentle, be fair, or kick your ass? (Choose difficulty: Easy, Normal, Lunatic)",
          );
        }

        // Wait for difficulty choice
        const difficultyFilter = (msg: Message) => {
          return (
            msg.author.id === message.author.id &&
            msg.channel.id === message.channel.id &&
            ["easy", "normal", "lunatic"].includes(msg.content.toLowerCase())
          );
        };

        const difficultyCollection = await message.channel.awaitMessages({
          filter: difficultyFilter,
          max: 1,
          time: 30000,
          errors: ["time"],
        });

        const difficultyMsg = difficultyCollection.first();
        if (!difficultyMsg) return;

        const difficulty = difficultyMsg.content.toLowerCase() as Difficulty;

        // Start the game
        await this.playGame(message, player, botPlayer, difficulty);
      } catch (error) {
        if ("send" in message.channel) {
          await message.channel.send(
            "You didn't choose a side or difficulty. If you don't wanna play anymore, that's fine. Just ask me again when you wanna play!",
          );
        }
      }
    } catch (error) {
      console.error("Error in Tic Tac Toe game:", error);
      if ("send" in message.channel) {
        await message.channel.send(
          "Something went wrong with our game. Wanna try again?",
        );
      }
    }
  }

  private static async playGame(
    message: Message,
    player: Player,
    botPlayer: Player,
    difficulty: Difficulty,
  ): Promise<void> {
    const board: Board = [
      [" ", " ", " "],
      [" ", " ", " "],
      [" ", " ", " "],
    ];

    let currentPlayer = "X" as Player;
    let gameOver = false;

    if ("send" in message.channel && "awaitMessages" in message.channel) {
      while (!gameOver) {
        // Display board
        await message.channel.send(`\`\`\`\n${this.printBoard(board)}\n\`\`\``);

        if (currentPlayer === player) {
          // Player's turn
          await message.channel.send(
            "Your turn! Enter your move (row col, e.g., '1 1' for top left):",
          );

          const moveFilter = (msg: Message) => {
            return (
              msg.author.id === message.author.id &&
              msg.channel.id === message.channel.id &&
              /^[1-3] [1-3]$/.test(msg.content)
            );
          };

          try {
            const moveCollection = await message.channel.awaitMessages({
              filter: moveFilter,
              max: 1,
              time: 30000,
              errors: ["time"],
            });

            const moveMsg = moveCollection.first();
            if (!moveMsg) break;

            const [x, y] = moveMsg.content
              .split(" ")
              .map((n) => parseInt(n) - 1);

            if (board[x][y] !== " ") {
              await message.channel.send(
                "There's already something there, dingus.",
              );
              continue;
            }

            board[x][y] = player;
          } catch (error) {
            await message.channel.send("Timeout! No move made.");
            break;
          }
        } else {
          // Bot's turn
          const move = this.getBotMove(board, botPlayer, player, difficulty);
          if (move) {
            board[move.row][move.col] = botPlayer;
            await message.channel.send(
              `My move: ${move.row + 1} ${move.col + 1}`,
            );
          }
        }

        // Check for win/draw
        const winner = this.checkWinner(board);
        if (winner) {
          await message.channel.send(
            `\`\`\`\n${this.printBoard(board)}\n\`\`\``,
          );
          if (winner === player) {
            await message.channel.send("Congrats! You won!");
          } else {
            await message.channel.send("I win! Better luck next time!");
          }
          gameOver = true;
        } else if (this.isBoardFull(board)) {
          await message.channel.send(
            `\`\`\`\n${this.printBoard(board)}\n\`\`\``,
          );
          await message.channel.send("It's a draw!");
          gameOver = true;
        }

        // Switch players
        currentPlayer = currentPlayer === "X" ? "O" : "X";
      }
    }
  }

  private static printBoard(board: Board): string {
    let display = "";
    for (let i = 0; i < board.length; i++) {
      display += board[i].map((cell) => ` ${cell} `).join("|") + "\n";
      if (i < 2) {
        display += "---|---|---\n";
      }
    }
    return display;
  }

  private static getBotMove(
    board: Board,
    botPlayer: Player,
    humanPlayer: Player,
    difficulty: Difficulty,
  ): { row: number; col: number } | null {
    switch (difficulty) {
      case "easy":
        return this.getRandomMove(board);
      case "normal":
        // Mix of random and smart moves
        return Math.random() < 0.7
          ? this.getBestMove(board, botPlayer, humanPlayer)
          : this.getRandomMove(board);
      case "lunatic":
        return this.getBestMove(board, botPlayer, humanPlayer);
      default:
        return this.getRandomMove(board);
    }
  }

  private static getRandomMove(
    board: Board,
  ): { row: number; col: number } | null {
    const availableMoves: { row: number; col: number }[] = [];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === " ") {
          availableMoves.push({ row: i, col: j });
        }
      }
    }

    return availableMoves.length > 0 ? getRandomElement(availableMoves) : null;
  }

  private static getBestMove(
    board: Board,
    botPlayer: Player,
    humanPlayer: Player,
  ): { row: number; col: number } | null {
    let bestScore = -Infinity;
    let bestMove: { row: number; col: number } | null = null;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === " ") {
          board[i][j] = botPlayer;
          const score = this.minimax(board, 0, false, botPlayer, humanPlayer);
          board[i][j] = " ";

          if (score > bestScore) {
            bestScore = score;
            bestMove = { row: i, col: j };
          }
        }
      }
    }

    return bestMove;
  }

  private static minimax(
    board: Board,
    depth: number,
    isMaximizing: boolean,
    botPlayer: Player,
    humanPlayer: Player,
  ): number {
    const winner = this.checkWinner(board);

    if (winner === botPlayer) return 10 - depth;
    if (winner === humanPlayer) return depth - 10;
    if (this.isBoardFull(board)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[i][j] === " ") {
            board[i][j] = botPlayer;
            const score = this.minimax(
              board,
              depth + 1,
              false,
              botPlayer,
              humanPlayer,
            );
            board[i][j] = " ";
            bestScore = Math.max(score, bestScore);
          }
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[i][j] === " ") {
            board[i][j] = humanPlayer;
            const score = this.minimax(
              board,
              depth + 1,
              true,
              botPlayer,
              humanPlayer,
            );
            board[i][j] = " ";
            bestScore = Math.min(score, bestScore);
          }
        }
      }
      return bestScore;
    }
  }

  private static checkWinner(board: Board): Player | null {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (
        board[i][0] !== " " &&
        board[i][0] === board[i][1] &&
        board[i][1] === board[i][2]
      ) {
        return board[i][0] as Player;
      }
    }

    // Check columns
    for (let j = 0; j < 3; j++) {
      if (
        board[0][j] !== " " &&
        board[0][j] === board[1][j] &&
        board[1][j] === board[2][j]
      ) {
        return board[0][j] as Player;
      }
    }

    // Check diagonals
    if (
      board[0][0] !== " " &&
      board[0][0] === board[1][1] &&
      board[1][1] === board[2][2]
    ) {
      return board[0][0] as Player;
    }
    if (
      board[0][2] !== " " &&
      board[0][2] === board[1][1] &&
      board[1][1] === board[2][0]
    ) {
      return board[0][2] as Player;
    }

    return null;
  }

  private static isBoardFull(board: Board): boolean {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === " ") {
          return false;
        }
      }
    }
    return true;
  }
}
