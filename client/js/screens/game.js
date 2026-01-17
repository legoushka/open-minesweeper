// Game screen logic
const GameScreen = {
  game: null,
  playerId: null,
  timerInterval: null,
  controlsInitialized: false,

  init(game, playerId) {
    this.game = game;
    this.playerId = playerId;

    // Ensure game over screen is hidden and timer is reset
    document.getElementById('game-over-overlay').classList.add('hidden');
    this.stopTimer();

    const canvas = document.getElementById('game-canvas');
    Board.init(canvas, game.settings, game.players, playerId);

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

      const avatarContainer = document.createElement('div');
      // Inline style for mini avatar container since we don't have a class for it yet
      avatarContainer.style.marginRight = '5px';
      Avatar.renderInElement(avatarContainer, player.avatar, 24);

      const dot = document.createElement('div');
      dot.className = 'player-dot';
      dot.style.backgroundColor = player.color;

      const name = document.createElement('span');
      name.textContent = player.name;
      name.style.fontSize = '0.9rem';

      indicator.appendChild(avatarContainer);
      indicator.appendChild(dot);
      indicator.appendChild(name);
      playersBar.appendChild(indicator);
    });
  },

  setupControls() {
    if (this.controlsInitialized) return;

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

    const zoomSlider = document.getElementById('zoom-slider');
    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        const size = parseInt(e.target.value);
        Board.setCellSize(size);
      });
    }

    // Emote system
    const emoteBtn = document.getElementById('emote-btn');
    const emoteMenu = document.getElementById('emote-menu');
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Track mouse
    document.addEventListener('mousemove', (e) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });
    
    // Toggle menu (Grid Mode - Click)
    const toggleEmoteMenu = (e) => {
      e.stopPropagation();
      emoteMenu.classList.remove('radial-mode');
      emoteMenu.style.top = '';
      emoteMenu.style.left = '';
      emoteMenu.style.transform = '';
      
      const isHidden = emoteMenu.classList.toggle('hidden');
      Board.isInputLocked = !isHidden; // Lock input when menu is open
    };

    emoteBtn.addEventListener('click', toggleEmoteMenu);
    
    // PC hotkey 'E' (Radial Mode)
    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      
      // Use e.code instead of e.key to support all keyboard layouts (e.g. Russian)
      if (this.game && this.game.state === 'playing' && e.code === 'KeyE') {
        if (document.activeElement.tagName !== 'INPUT') {
          e.preventDefault(); // Prevent typing 'e'
          
          if (emoteMenu.classList.contains('hidden')) {
            // Open in radial mode at cursor
            emoteMenu.classList.remove('hidden');
            emoteMenu.classList.add('radial-mode');
            emoteMenu.style.top = `${lastMouseY}px`;
            emoteMenu.style.left = `${lastMouseX}px`;
            Board.isInputLocked = true;
          } else {
            // Close if already open
            emoteMenu.classList.add('hidden');
            Board.isInputLocked = false;
          }
        }
      }
    });

    // Handle emote selection
    document.querySelectorAll('.emote-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const value = e.target.textContent;
        Socket.emote(value);
        emoteMenu.classList.add('hidden');
        Board.isInputLocked = false;
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!emoteMenu.contains(e.target) && e.target !== emoteBtn) {
        if (!emoteMenu.classList.contains('hidden')) {
          emoteMenu.classList.add('hidden');
          Board.isInputLocked = false;
        }
      }
    });

    this.controlsInitialized = true;
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
    
    playAgainBtn.classList.remove('hidden');
    if (this.playerId === this.game.hostId) {
        backToLobbyBtn.classList.remove('hidden');
    } else {
      backToLobbyBtn.classList.add('hidden');
}
  },

  hideGameOver() {
    document.getElementById('game-over-overlay').classList.add('hidden');
    this.startTimer();
  }
};
