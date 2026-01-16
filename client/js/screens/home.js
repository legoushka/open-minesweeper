// Home screen logic
const HomeScreen = {
  currentAvatar: null,
  currentColor: null,

  PLAYER_COLORS: [
    { id: 'blue', hex: '#5eb1bf', name: 'Ice' },
    { id: 'coral', hex: '#cf6679', name: 'Coral' },
    { id: 'green', hex: '#8ac926', name: 'Moss' },
    { id: 'orange', hex: '#f4a261', name: 'Amber' },
    { id: 'purple', hex: '#b388eb', name: 'Haze' },
    { id: 'white', hex: '#f7f7f7', name: 'Ghost' },
    { id: 'yellow', hex: '#ffca3a', name: 'Gold' },
    { id: 'gray', hex: '#6c757d', name: 'Steel' }
  ],

  PRESETS: {
    beginner: { width: 9, height: 9, mines: 10 },
    intermediate: { width: 16, height: 16, mines: 40 },
    expert: { width: 30, height: 16, mines: 99 }
  },

  init() {
    const saved = Storage.loadPlayer();
    this.currentAvatar = saved.avatar;
    this.currentColor = saved.color;

    this.setupAvatarCreator();
    this.setupControls();
    this.updatePreview();
  },

  setupAvatarCreator() {
    const nameInput = document.getElementById('player-name');
    nameInput.value = Storage.loadPlayer().name;
    nameInput.addEventListener('input', () => this.updatePreview());

    // Body colors
    const bodyColors = document.getElementById('body-colors');
    Avatar.BODY_COLORS.forEach(color => {
      const div = document.createElement('div');
      div.className = 'color-option';
      div.style.backgroundColor = color.hex;
      if (color.hex === this.currentAvatar.bodyColor) {
        div.classList.add('selected');
      }
      div.addEventListener('click', () => {
        document.querySelectorAll('#body-colors .color-option').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        this.currentAvatar.bodyColor = color.hex;
        this.updatePreview();
      });
      bodyColors.appendChild(div);
    });

    // Eyes
    const eyesPicker = document.getElementById('eyes-picker');
    Avatar.EYES.forEach(eye => {
      const div = document.createElement('div');
      div.className = 'option-btn';
      div.textContent = eye.label;
      if (eye.id === this.currentAvatar.eyes) {
        div.classList.add('selected');
      }
      div.addEventListener('click', () => {
        document.querySelectorAll('#eyes-picker .option-btn').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        this.currentAvatar.eyes = eye.id;
        this.updatePreview();
      });
      eyesPicker.appendChild(div);
    });

    // Accessories
    const accessoryPicker = document.getElementById('accessory-picker');
    Avatar.ACCESSORIES.forEach(acc => {
      const div = document.createElement('div');
      div.className = 'option-btn';
      div.textContent = acc.label;
      if (acc.id === this.currentAvatar.accessory) {
        div.classList.add('selected');
      }
      div.addEventListener('click', () => {
        document.querySelectorAll('#accessory-picker .option-btn').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        this.currentAvatar.accessory = acc.id;
        this.updatePreview();
      });
      accessoryPicker.appendChild(div);
    });

    // Player colors
    const playerColors = document.getElementById('player-colors');
    this.PLAYER_COLORS.forEach(color => {
      const div = document.createElement('div');
      div.className = 'color-option';
      div.style.backgroundColor = color.hex;
      if (color.hex === this.currentColor) {
        div.classList.add('selected');
      }
      div.addEventListener('click', () => {
        document.querySelectorAll('#player-colors .color-option').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        this.currentColor = color.hex;
      });
      playerColors.appendChild(div);
    });
  },

  setupControls() {
    document.getElementById('create-btn').addEventListener('click', () => {
      document.getElementById('join-section').classList.add('hidden');
      document.getElementById('create-section').classList.toggle('hidden');
    });

    document.getElementById('join-btn').addEventListener('click', () => {
      document.getElementById('create-section').classList.add('hidden');
      document.getElementById('join-section').classList.toggle('hidden');
    });

    document.getElementById('preset-select').addEventListener('change', (e) => {
      const custom = document.getElementById('custom-settings');
      if (e.target.value === 'custom') {
        custom.classList.remove('hidden');
      } else {
        custom.classList.add('hidden');
      }
    });

    document.getElementById('join-submit-btn').addEventListener('click', () => {
      this.joinGame();
    });

    document.getElementById('join-code').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.joinGame();
      }
    });

    document.getElementById('create-submit-btn').addEventListener('click', () => {
      this.createGame();
    });
  },

  updatePreview() {
    const canvas = document.getElementById('avatar-preview');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Avatar.render(ctx, this.currentAvatar, 0, 0, 120);
  },

  getPlayerData() {
    const name = document.getElementById('player-name').value.trim() || 'Anonymous';
    return {
      name,
      avatar: this.currentAvatar,
      color: this.currentColor
    };
  },

  createGame() {
    const player = this.getPlayerData();
    Storage.savePlayer(player);

    const preset = document.getElementById('preset-select').value;
    let settings;

    if (preset === 'custom') {
      settings = {
        width: parseInt(document.getElementById('custom-width').value),
        height: parseInt(document.getElementById('custom-height').value),
        mines: parseInt(document.getElementById('custom-mines').value),
        maxPlayers: parseInt(document.getElementById('max-players').value)
      };
    } else {
      settings = {
        ...this.PRESETS[preset],
        maxPlayers: parseInt(document.getElementById('max-players').value)
      };
    }

    // Validate settings
    if (settings.mines >= settings.width * settings.height) {
      alert('Too many mines for the board size!');
      return;
    }

    Socket.createGame(settings, player);
  },

  joinGame() {
    const code = document.getElementById('join-code').value.trim().toUpperCase();
    if (code.length !== 6) {
      alert('Game code must be 6 characters');
      return;
    }

    const player = this.getPlayerData();
    Storage.savePlayer(player);

    Socket.joinGame(code, player);
  }
};
