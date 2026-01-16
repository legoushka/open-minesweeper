// Game screen logic
const GameScreen = {
  game: null,
  playerId: null,
  timerInterval: null,

  init(game, playerId) {
    this.game = game;
    this.playerId = playerId;

    const canvas = document.getElementById('game-canvas');
    Board.init(canvas, game.settings, game.players);

    if (game.board) {
      Board.updateBoard(game.board);
    }

    this.render();
    this.setupControls();
    this.startTimer();
  },

  update(game) {
    this.game = game;
    this.render();
  },

  render() {
    // Flags remaining
    document.getElementById('flags-remaining').textContent = this.game.flagsRemaining || this.game.settings.mines;

    // Players bar
    const playersBar = document.getElementById('players-bar');
    playersBar.innerHTML = '';

    this.game.players.forEach(player => {
      const indicator = document.createElement('div');
      indicator.className = 'player-indicator';

      const dot = document.createElement('div');
      dot.className = 'player-dot';
      dot.style.backgroundColor = player.color;

      const name = document.createElement('span');
      name.textContent = player.name;
      name.style.fontSize = '0.9rem';

      indicator.appendChild(dot);
      indicator.appendChild(name);
      playersBar.appendChild(indicator);
    });
  },

  setupControls() {
    document.getElementById('leave-game-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to leave?')) {
        window.location.reload();
      }
    });

    const muteBtn = document.getElementById('mute-btn');
    muteBtn.textContent = Audio.muted ? 'SOUND: OFF' : 'SOUND: ON';
    muteBtn.addEventListener('click', () => {
      const muted = Audio.toggle();
      muteBtn.textContent = muted ? 'SOUND: OFF' : 'SOUND: ON';
    });

    document.getElementById('play-again-btn').addEventListener('click', () => {
      Socket.restart();
      this.hideGameOver();
    });

    document.getElementById('back-to-lobby-btn').addEventListener('click', () => {
      Socket.toLobby();
      this.hideGameOver();
    });
  },

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.game.state === 'playing') {
        const elapsed = this.game.elapsedTime + 1;
        this.game.elapsedTime = elapsed;
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent = 
          `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  showGameOver(won, triggeredBy) {
    this.stopTimer();

    const overlay = document.getElementById('game-over-overlay');
    const result = document.getElementById('game-result');
    const detail = document.getElementById('game-result-detail');

    if (won) {
      result.textContent = 'VICTORY';
      result.style.color = '#5eb1bf';
      detail.textContent = 'All mines cleared!';
      Audio.play('win');
    } else {
      result.textContent = 'DEFEAT';
      result.style.color = '#cf6679';
      
      if (triggeredBy) {
        const player = this.game.players.find(p => p.id === triggeredBy);
        if (player) {
          detail.textContent = `${player.name} hit a mine`;
        } else {
          detail.textContent = 'A mine was hit';
        }
      } else {
        detail.textContent = 'A mine was hit';
      }
      
      Audio.play('mine');
    }

    overlay.classList.remove('hidden');

    // Show restart button only for host
    const playAgainBtn = document.getElementById('play-again-btn');
    const backToLobbyBtn = document.getElementById('back-to-lobby-btn');
    
    if (this.playerId === this.game.hostId) {
      playAgainBtn.classList.remove('hidden');
      backToLobbyBtn.classList.remove('hidden');
    } else {
      playAgainBtn.classList.add('hidden');
      backToLobbyBtn.classList.add('hidden');
      detail.textContent += '\nWaiting for host...';
    }
  },

  hideGameOver() {
    document.getElementById('game-over-overlay').classList.add('hidden');
    this.startTimer();
  }
};
