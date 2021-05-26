class gameClass {
  constructor() {
    this.stats = {
      X: 0,
      O: 0,
      T: 0,
    };
    this.board = new Array(9).fill(null);
    this.winCases = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    this.currentPlayer = "X";
    this.endGame = false;
    this.winner = null;
  }

  setMoove(index, symbol) {
    this.board[index] = symbol;
  }

  switchPlayer(symbol) {
    if (symbol === "X") {
      this.currentPlayer = "O";
    } else {
      this.currentPlayer = "X";
    }
  }

  setScores(symbol) {
    const { X, O, T } = this.stats;
    if (symbol === "X") {
      this.stats = { ...this.stats, X: X + 1, T: T + 1 };
    } else {
      this.stats = { ...this.stats, O: O + 1, T: T + 1 };
    }
  }

  checkWin(symbol) {
    return this.winCases.some((state) =>
      state.every((position) => this.board[position] === symbol)
    );
  }

  checkEnd() {
    return this.board.every((state) => state !== null);
  }

  setEndGame(symbol) {
    this.endGame = true;
    this.winner = symbol;
    if (symbol) {
      this.setScores(symbol);
    }
  }

  reset() {
    this.board = new Array(9).fill(null);
    this.endGame = false;
    this.winner = null;
  }
}

module.exports = gameClass;
