const { v4: uuidv4 } = require('uuid');

class Game {
  constructor(code, settings, hostPlayer) {
    this.code = code;
    this.settings = settings; // { width, height, mines, maxPlayers }
    this.players = [hostPlayer]; // Array of { id, name, avatar, color }
    this.hostId = hostPlayer.id;
    this.state = 'lobby'; // 'lobby', 'playing', 'won', 'lost'
    this.board = null; // Will be initialized on first reveal
    this.startTime = null;
    this.revealedCells = new Set(); // Set of "x,y" strings
    this.flaggedCells = new Set(); // Set of "x,y" strings
    this.lastActivity = Date.now();
  }

  addPlayer(player) {
    if (this.players.length >= this.settings.maxPlayers) {
      throw new Error('Game is full');
    }
    
    // Check for color conflicts
    const colorTaken = this.players.some(p => p.color === player.color);
    if (colorTaken) {
      throw new Error('Color already taken');
    }
    
    this.players.push(player);
    this.lastActivity = Date.now();
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    this.lastActivity = Date.now();
    
    // Transfer host if needed
    if (playerId === this.hostId && this.players.length > 0) {
      this.transferHost();
    }
    
    return this.players.length === 0; // Return true if game should be deleted
  }

  transferHost() {
    if (this.players.length > 0) {
      this.hostId = this.players[0].id;
      return this.players[0];
    }
    return null;
  }

  startGame() {
    if (this.players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }
    this.state = 'playing';
    this.startTime = Date.now();
    this.lastActivity = Date.now();
  }

  generateBoard(firstClickX, firstClickY) {
    const { width, height, mines } = this.settings;
    
    // Initialize empty board
    this.board = Array(height).fill(null).map(() => 
      Array(width).fill(null).map(() => ({ 
        isMine: false, 
        count: 0,
        revealedBy: null 
      }))
    );

    // Place mines (avoiding first click and its neighbors)
    const forbidden = new Set();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = firstClickX + dx;
        const ny = firstClickY + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          forbidden.add(`${nx},${ny}`);
        }
      }
    }

    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const key = `${x},${y}`;
      
      if (!forbidden.has(key) && !this.board[y][x].isMine) {
        this.board[y][x].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate counts
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!this.board[y][x].isMine) {
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height && this.board[ny][nx].isMine) {
                count++;
              }
            }
          }
          this.board[y][x].count = count;
        }
      }
    }
  }

  reveal(x, y, playerId) {
    const { width, height } = this.settings;
    
    if (x < 0 || x >= width || y < 0 || y >= height) {
      throw new Error('Invalid coordinates');
    }

    const key = `${x},${y}`;
    
    // Check if already revealed or flagged
    if (this.revealedCells.has(key) || this.flaggedCells.has(key)) {
      return { cells: [], gameOver: false };
    }

    // Generate board on first reveal
    if (!this.board) {
      this.generateBoard(x, y);
    }

    const cell = this.board[y][x];
    const revealedCells = [];

    // Hit a mine - game over
    if (cell.isMine) {
      this.state = 'lost';
      // Reveal all mines
      for (let cy = 0; cy < height; cy++) {
        for (let cx = 0; cx < width; cx++) {
          if (this.board[cy][cx].isMine) {
            revealedCells.push({ x: cx, y: cy, value: 'mine' });
          }
        }
      }
      this.lastActivity = Date.now();
      return { cells: revealedCells, gameOver: true, won: false, triggeredBy: playerId };
    }

    // Flood fill reveal
    const toReveal = [[x, y]];
    const visited = new Set([key]);

    while (toReveal.length > 0) {
      const [cx, cy] = toReveal.shift();
      const ckey = `${cx},${cy}`;
      
      if (!this.revealedCells.has(ckey)) {
        this.revealedCells.add(ckey);
        const cell = this.board[cy][cx];
        cell.revealedBy = playerId;
        revealedCells.push({ x: cx, y: cy, value: cell.count });

        // If count is 0, reveal neighbors
        if (cell.count === 0) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = cx + dx;
              const ny = cy + dy;
              const nkey = `${nx},${ny}`;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height && 
                  !visited.has(nkey) && !this.flaggedCells.has(nkey)) {
                visited.add(nkey);
                toReveal.push([nx, ny]);
              }
            }
          }
        }
      }
    }

    // Check win condition
    const totalCells = width * height;
    const safeCells = totalCells - this.settings.mines;
    if (this.revealedCells.size === safeCells) {
      this.state = 'won';
      this.lastActivity = Date.now();
      return { cells: revealedCells, gameOver: true, won: true };
    }

    this.lastActivity = Date.now();
    return { cells: revealedCells, gameOver: false };
  }

  toggleFlag(x, y, playerId) {
    const { width, height } = this.settings;
    
    if (x < 0 || x >= width || y < 0 || y >= height) {
      throw new Error('Invalid coordinates');
    }

    const key = `${x},${y}`;
    
    // Can't flag revealed cells
    if (this.revealedCells.has(key)) {
      return { flagged: false };
    }

    if (this.flaggedCells.has(key)) {
      this.flaggedCells.delete(key);
      this.lastActivity = Date.now();
      return { flagged: false };
    } else {
      this.flaggedCells.add(key);
      this.lastActivity = Date.now();
      return { flagged: true };
    }
  }

  getMaskedState() {
    if (!this.board) {
      return null;
    }

    const { width, height } = this.settings;
    const masked = [];

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        
        if (this.revealedCells.has(key)) {
          const cell = this.board[y][x];
          row.push({ 
            state: 'revealed', 
            value: cell.isMine ? 'mine' : cell.count,
            revealedBy: cell.revealedBy
          });
        } else if (this.flaggedCells.has(key)) {
          row.push({ state: 'flagged' });
        } else {
          row.push({ state: 'hidden' });
        }
      }
      masked.push(row);
    }

    return masked;
  }

  reset() {
    this.board = null;
    this.revealedCells.clear();
    this.flaggedCells.clear();
    this.state = 'playing';
    this.startTime = Date.now();
    this.lastActivity = Date.now();
  }

  toJSON() {
    return {
      code: this.code,
      settings: this.settings,
      players: this.players,
      hostId: this.hostId,
      state: this.state,
      board: this.getMaskedState(),
      flagsRemaining: this.settings.mines - this.flaggedCells.size,
      elapsedTime: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0
    };
  }
}

module.exports = Game;
