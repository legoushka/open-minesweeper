const Game = require('./game');

class GameManager {
  constructor() {
    this.games = new Map(); // code -> Game
    this.startCleanup();
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.games.has(code));
    return code;
  }

  createGame(settings, hostPlayer) {
    const code = this.generateCode();
    const game = new Game(code, settings, hostPlayer);
    this.games.set(code, game);
    return game;
  }

  getGame(code) {
    return this.games.get(code);
  }

  deleteGame(code) {
    this.games.delete(code);
  }

  startCleanup() {
    // Clean up stale games every 10 minutes
    setInterval(() => {
      const now = Date.now();
      const staleTime = 60 * 60 * 1000; // 1 hour

      for (const [code, game] of this.games.entries()) {
        if (now - game.lastActivity > staleTime) {
          console.log(`Cleaning up stale game: ${code}`);
          this.games.delete(code);
        }
      }
    }, 10 * 60 * 1000);
  }

  getStats() {
    return {
      totalGames: this.games.size,
      activeGames: Array.from(this.games.values()).filter(g => g.state === 'playing').length,
      lobbyGames: Array.from(this.games.values()).filter(g => g.state === 'lobby').length
    };
  }
}

module.exports = new GameManager();
