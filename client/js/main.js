// Main application logic
const App = {
  currentScreen: 'home',
  playerId: null,
  currentGame: null,

  init() {
    Audio.init();
    Socket.connect();
    this.setupSocketHandlers();
    
    // Check for join code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      document.getElementById('join-code').value = code;
      document.getElementById('join-section').classList.remove('hidden');
    }

    this.showScreen('home');
    HomeScreen.init();
  },

  showScreen(screen) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    
    // Show target screen
    document.getElementById(`${screen}-screen`).classList.remove('hidden');
    this.currentScreen = screen;
  },

  setupSocketHandlers() {
    Socket.on('created', (data) => {
      this.playerId = data.playerId;
      this.currentGame = data.game;
      this.showScreen('lobby');
      LobbyScreen.init(data.game, data.playerId);
      Audio.play('join');
    });

    Socket.on('joined', (data) => {
      this.playerId = data.playerId;
      this.currentGame = data.game;
      
      if (data.game.state === 'lobby') {
        this.showScreen('lobby');
        LobbyScreen.init(data.game, data.playerId);
      } else if (data.game.state === 'playing') {
        // Mid-game join
        this.showScreen('game');
        GameScreen.init(data.game, data.playerId);
      }
      
      Audio.play('join');
    });

    Socket.on('playerJoined', (data) => {
      this.currentGame.players.push(data.player);
      if (this.currentScreen === 'lobby') {
        LobbyScreen.update(this.currentGame);
      }
      Audio.play('join');
    });

    Socket.on('playerLeft', (data) => {
      this.currentGame.players = this.currentGame.players.filter(p => p.id !== data.playerId);
      if (this.currentScreen === 'lobby') {
        LobbyScreen.update(this.currentGame);
      }
    });

    Socket.on('hostChanged', (data) => {
      this.currentGame.hostId = data.newHostId;
      if (this.currentScreen === 'lobby') {
        LobbyScreen.update(this.currentGame);
      }
    });

    Socket.on('gameStarted', (data) => {
      this.currentGame = data.game;
      this.showScreen('game');
      GameScreen.init(data.game, this.playerId);
    });

    Socket.on('revealed', (data) => {
      // Update board with revealed cells
      data.cells.forEach(cell => {
        Board.board[cell.y][cell.x] = {
          state: 'revealed',
          value: cell.value,
          revealedBy: data.by
        };
      });
      Board.render();
      Audio.play('reveal');
    });

    Socket.on('flagged', (data) => {
      if (data.flagged) {
        Board.board[data.y][data.x] = { state: 'flagged' };
        Audio.play('flag');
      } else {
        Board.board[data.y][data.x] = { state: 'hidden' };
        Audio.play('unflag');
      }
      Board.render();
      
      // Update flags counter
      this.currentGame.flagsRemaining = data.flagsRemaining;
      document.getElementById('flags-remaining').textContent = data.flagsRemaining;
    });

    Socket.on('cursor', (data) => {
      Board.updateCursor(data.playerId, data.x, data.y);
    });

    Socket.on('gameOver', (data) => {
      // Update board with final state
      if (data.board) {
        Board.updateBoard(data.board);
      }
      
      this.currentGame.state = data.won ? 'won' : 'lost';
      GameScreen.showGameOver(data.won, data.triggeredBy);
    });

    Socket.on('toLobby', (data) => {
      this.currentGame = data.game;
      this.showScreen('lobby');
      LobbyScreen.init(data.game, this.playerId);
    });

    Socket.on('error', (data) => {
      alert('Error: ' + data.message);
    });
  }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
