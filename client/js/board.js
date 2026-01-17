// Minesweeper board renderer
const Board = {
  canvas: null,
  ctx: null,
  board: null,
  settings: null,
  cellSize: 30,
  offsetX: 0,
  offsetY: 0,
  players: {},
  cursors: {},
  touchStart: null,
  longPressTimer: null,
  eventsInitialized: false,
  userZoomLevel: null,
  emotes: [], // Array of {x, y, value, startTime, color}
  localPlayerId: null,
  isInputLocked: false,
  renderRequested: false,
  
  COLORS: {
    1: '#5eb1bf',
    2: '#8ac926',
    3: '#cf6679',
    4: '#b388eb',
    5: '#f4a261',
    6: '#5eb1bf',
    7: '#1a1a1a',
    8: '#888888'
  },

  init(canvas, settings, players, localPlayerId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.settings = settings;
    this.players = {};
    this.localPlayerId = localPlayerId;
    players.forEach(p => {
      this.players[p.id] = p;
    });
    
    // Initialize empty board
    this.board = Array(settings.height).fill(null).map(() =>
      Array(settings.width).fill(null).map(() => ({ state: 'hidden' }))
    );

    this.calculateSize();
    this.setupEvents();
    this.requestRender();
  },

  calculateSize() {
    const isMobile = window.innerWidth < 768;
    const marginX = isMobile ? 10 : 100;
    const marginY = isMobile ? 140 : 300;

    const maxWidth = isMobile ? window.innerWidth - marginX : Math.min(window.innerWidth - marginX, 1300);
    const maxHeight = window.innerHeight - marginY;
    
    // If user has set a zoom level, use it
    if (this.userZoomLevel !== null) {
      this.cellSize = this.userZoomLevel;
    } else {
      const cellWidth = Math.floor(maxWidth / this.settings.width);
      const cellHeight = Math.floor(maxHeight / this.settings.height);
      
      // Calculate best fit size, but allow it to be larger on mobile (will scroll)
      let targetSize = Math.min(cellWidth, cellHeight);
      
      // Limits: Min 30px (desktop) / 34px (mobile), Max 40px (desktop) / 60px (mobile)
      const minSize = isMobile ? 34 : 30;
      const maxSize = isMobile ? 60 : 40;

      this.cellSize = Math.max(targetSize, minSize);
      this.cellSize = Math.min(this.cellSize, maxSize);
    }
    
    // Canvas is full board size (may exceed viewport)
    this.canvas.width = this.settings.width * this.cellSize;
    this.canvas.height = this.settings.height * this.cellSize;
    
    // Make canvas container scrollable if board is larger than viewport
    const container = this.canvas.parentElement;
    if (container) {
      // On mobile, allow the container to be wider if needed, but constrain to viewport for scrolling
      container.style.overflow = 'auto';
      container.style.maxWidth = isMobile ? '100vw' : `${Math.min(window.innerWidth - marginX, 1300)}px`;
      container.style.maxHeight = isMobile ? '70vh' : `${maxHeight}px`;
    }
    
    this.offsetX = 0;
    this.offsetY = 0;
    
    // Update slider if present
    const slider = document.getElementById('zoom-slider');
    if (slider) {
      slider.value = this.cellSize;
    }
  },

  setCellSize(size) {
    this.cellSize = size;
    this.userZoomLevel = size;
    
    // Recalculate canvas dimensions
    this.canvas.width = this.settings.width * this.cellSize;
    this.canvas.height = this.settings.height * this.cellSize;
    
    // Ensure container is still correct
    const isMobile = window.innerWidth < 768;
    const marginX = isMobile ? 10 : 100;
    const marginY = isMobile ? 140 : 300;
    const maxHeight = window.innerHeight - marginY;
    
    const container = this.canvas.parentElement;
    if (container) {
      container.style.overflow = 'auto';
      container.style.maxWidth = isMobile ? '100vw' : `${Math.min(window.innerWidth - marginX, 1300)}px`;
      container.style.maxHeight = isMobile ? '70vh' : `${maxHeight}px`;
    }

    this.render();
  },

  setupEvents() {
    if (this.eventsInitialized) return;

    // Mouse events (desktop)
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleRightClick(e);
    });
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    // Touch events (mobile)
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });

    this.eventsInitialized = true;
  },

  getCellFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = Math.floor((clientX - rect.left) * scaleX / this.cellSize);
    const y = Math.floor((clientY - rect.top) * scaleY / this.cellSize);
    
    return { x, y };
  },

  handleClick(e) {
    if (this.isInputLocked) return;
    const { x, y } = this.getCellFromEvent(e);
    if (x >= 0 && x < this.settings.width && y >= 0 && y < this.settings.height) {
      if (this.board[y][x].state === 'hidden') {
        Socket.reveal(x, y);
      }
    }
  },

  handleRightClick(e) {
    if (this.isInputLocked) return;
    e.preventDefault();
    const { x, y } = this.getCellFromEvent(e);
    if (x >= 0 && x < this.settings.width && y >= 0 && y < this.settings.height) {
      if (this.board[y][x].state !== 'revealed') {
        Socket.flag(x, y);
      }
    }
  },

  handleMouseMove(e) {
    if (this.isInputLocked) return;
    const { x, y } = this.getCellFromEvent(e);
    if (x >= 0 && x < this.settings.width && y >= 0 && y < this.settings.height) {
      Socket.cursor(x, y);
      // Update local cursor immediately for smoothness and self-visibility
      if (this.localPlayerId) {
        this.updateCursor(this.localPlayerId, x, y);
      }
    }
  },

  // Mobile touch handling: drag to pan, tap to reveal, long-press to flag
  handleTouchStart(e) {
    if (this.isInputLocked) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    
    const { x, y } = this.getCellFromEvent(e);
    
    this.touchStart = { 
      x, 
      y, 
      time: Date.now(),
      clientX: touch.clientX,
      clientY: touch.clientY,
      isPanning: false
    };
    
    // Start long-press timer
    this.longPressTimer = setTimeout(() => {
      if (this.touchStart && !this.touchStart.isPanning && 
          x >= 0 && x < this.settings.width && y >= 0 && y < this.settings.height) {
        if (this.board[y][x].state !== 'revealed') {
          Socket.flag(x, y);
          Audio.play('flag');
          this.touchStart.flagged = true;
        }
      }
    }, 500);
  },

  handleTouchEnd(e) {
    e.preventDefault();
    clearTimeout(this.longPressTimer);
    
    if (this.touchStart && !this.touchStart.isPanning && !this.touchStart.flagged) {
      const { x, y } = this.touchStart;
      const duration = Date.now() - this.touchStart.time;
      
      // Short tap = reveal
      if (duration < 500 && x >= 0 && x < this.settings.width && y >= 0 && y < this.settings.height) {
        if (this.board[y][x].state === 'hidden') {
          Socket.reveal(x, y);
        }
      }
    }
    
    this.touchStart = null;
  },

  handleTouchMove(e) {
    e.preventDefault();
    
    if (!this.touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStart.clientX;
    const deltaY = touch.clientY - this.touchStart.clientY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // If moved more than 10px, treat as panning
    if (distance > 10) {
      clearTimeout(this.longPressTimer);
      this.touchStart.isPanning = true;
      
      // Pan the container by scrolling it
      const container = this.canvas.parentElement;
      if (container) {
        container.scrollLeft -= deltaX;
        container.scrollTop -= deltaY;
      }
      
      // Update touch start position for continuous panning
      this.touchStart.clientX = touch.clientX;
      this.touchStart.clientY = touch.clientY;
    }
  },

  updateBoard(board) {
    this.board = board;
    this.requestRender();
  },

  updateCursor(playerId, x, y) {
    this.cursors[playerId] = { x, y };
    this.requestRender();
  },

  addEmote(playerId, value) {
    // Find player position (cursor or default center)
    let x, y;
    if (this.cursors[playerId]) {
      x = this.cursors[playerId].x * this.cellSize + this.cellSize / 2;
      y = this.cursors[playerId].y * this.cellSize;
    } else {
      // If no cursor data yet, use canvas center
      x = this.canvas.width / 2;
      y = this.canvas.height / 2;
    }

    const player = this.players[playerId];
    const color = player ? player.color : '#fff';

    this.emotes.push({
      x,
      y,
      value,
      startTime: Date.now(),
      color
    });
    
    // Trigger render loop if not running
    this.requestRender();
  },

  requestRender() {
    if (!this.renderRequested) {
      this.renderRequested = true;
      requestAnimationFrame(() => {
        this.renderRequested = false;
        this.render();
      });
    }
  },

  render() {
    const ctx = this.ctx;
    
    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw cells
    for (let y = 0; y < this.settings.height; y++) {
      for (let x = 0; x < this.settings.width; x++) {
        this.drawCell(x, y, this.board[y][x]);
      }
    }

    // Draw cursors
    for (const playerId in this.cursors) {
      const cursor = this.cursors[playerId];
      const player = this.players[playerId];
      if (player && cursor) {
        this.drawCursor(cursor.x, cursor.y, player.color);
      }
    }

    // Draw emotes
    const now = Date.now();
    this.emotes = this.emotes.filter(emote => now - emote.startTime < 3000);
    
    this.emotes.forEach(emote => {
      const age = now - emote.startTime;
      const opacity = 1 - (age / 3000);
      const lift = (age / 3000) * 50; // Move up 50px
      
      const ctx = this.ctx;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = emote.color;
      ctx.font = 'bold 24px sans-serif'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.lineWidth = 3;
      ctx.strokeText(emote.value, emote.x, emote.y - lift);
      ctx.shadowBlur = 0;
      
      ctx.fillText(emote.value, emote.x, emote.y - lift);
      ctx.globalAlpha = 1;
    });

    // Keep animating if there are emotes
    if (this.emotes.length > 0) {
      this.requestRender();
    }
  },

  drawCell(x, y, cell) {
    const ctx = this.ctx;
    const px = x * this.cellSize;
    const py = y * this.cellSize;

    // Cell background
    if (cell.state === 'revealed') {
      ctx.fillStyle = '#0a0a0a';
    } else {
      ctx.fillStyle = '#2a2a2a';
    }
    ctx.fillRect(px, py, this.cellSize, this.cellSize);

    // Border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, this.cellSize, this.cellSize);

    // Content
    if (cell.state === 'revealed') {
      if (cell.value === 'mine') {
        // Draw mine
        ctx.fillStyle = '#cf6679';
        ctx.beginPath();
        ctx.arc(px + this.cellSize / 2, py + this.cellSize / 2, this.cellSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (cell.value > 0) {
        // Draw number
        ctx.fillStyle = this.COLORS[cell.value] || '#888888';
        ctx.font = `bold ${this.cellSize * 0.6}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.value, px + this.cellSize / 2, py + this.cellSize / 2);
      }

      // Revealed by indicator (small dot in corner)
      if (cell.revealedBy && this.players[cell.revealedBy]) {
        ctx.fillStyle = this.players[cell.revealedBy].color;
        ctx.beginPath();
        ctx.arc(px + this.cellSize - 5, py + 5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (cell.state === 'flagged') {
      // Draw flag
      ctx.fillStyle = '#5eb1bf';
      ctx.font = `${this.cellSize * 0.6}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚑', px + this.cellSize / 2, py + this.cellSize / 2);
    }
  },

  drawCursor(x, y, color) {
    const ctx = this.ctx;
    const px = x * this.cellSize;
    const py = y * this.cellSize;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Board;
}
