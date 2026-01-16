// Lobby screen logic
const LobbyScreen = {
  game: null,
  playerId: null,

  init(game, playerId) {
    this.game = game;
    this.playerId = playerId;
    this.render();
    this.setupControls();
  },

  update(game) {
    this.game = game;
    this.render();
  },

  render() {
    // Game code
    document.getElementById('game-code-display').textContent = this.game.code;

    // Player count
    document.getElementById('player-count').textContent = 
      `(${this.game.players.length}/${this.game.settings.maxPlayers})`;

    // Players list
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';

    this.game.players.forEach(player => {
      const item = document.createElement('div');
      item.className = 'player-item';

      // Avatar canvas
      const canvas = document.createElement('canvas');
      canvas.className = 'player-avatar-small';
      canvas.width = 40;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      Avatar.renderSmall(ctx, player.avatar, 0, 0);

      // Player name
      const nameSpan = document.createElement('span');
      nameSpan.className = 'player-name';
      nameSpan.textContent = player.name;

      // Player color indicator
      const colorDot = document.createElement('div');
      colorDot.className = 'player-dot';
      colorDot.style.backgroundColor = player.color;

      // Role
      const roleSpan = document.createElement('span');
      roleSpan.className = 'player-role';
      if (player.id === this.game.hostId) {
        roleSpan.textContent = '(HOST)';
      }
      if (player.id === this.playerId) {
        roleSpan.textContent += ' (YOU)';
      }

      item.appendChild(canvas);
      item.appendChild(colorDot);
      item.appendChild(nameSpan);
      item.appendChild(roleSpan);

      playersList.appendChild(item);
    });

    // Game settings
    document.getElementById('game-settings').textContent = 
      `${this.game.settings.width}×${this.game.settings.height}, ${this.game.settings.mines} mines`;

    // Start button (only for host)
    const startBtn = document.getElementById('start-game-btn');
    if (this.playerId === this.game.hostId && this.game.players.length >= 2) {
      startBtn.classList.remove('hidden');
      startBtn.disabled = false;
    } else {
      startBtn.classList.add('hidden');
    }
  },

  setupControls() {
    document.getElementById('copy-code-btn').addEventListener('click', () => {
      const url = `${window.location.origin}/?code=${this.game.code}`;
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copy-code-btn');
        const oldText = btn.textContent;
        btn.textContent = 'COPIED!';
        setTimeout(() => {
          btn.textContent = oldText;
        }, 2000);
      });
    });

    document.getElementById('start-game-btn').addEventListener('click', () => {
      Socket.startGame();
    });

    document.getElementById('leave-lobby-btn').addEventListener('click', () => {
      window.location.reload();
    });
  }
};
