// LocalStorage helpers
const Storage = {
  savePlayer(data) {
    localStorage.setItem('minesweeper_player', JSON.stringify(data));
  },

  loadPlayer() {
    const saved = localStorage.getItem('minesweeper_player');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      name: '',
      avatar: {
        bodyColor: '#3d5a80',
        eyes: 'dots',
        accessory: 'none'
      },
      color: '#5eb1bf'
    };
  },

  saveMuted(muted) {
    localStorage.setItem('minesweeper_muted', muted.toString());
  },

  loadMuted() {
    const saved = localStorage.getItem('minesweeper_muted');
    return saved === 'true';
  }
};
