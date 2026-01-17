// WebSocket client
const Socket = {
  ws: null,
  handlers: {},
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (this.handlers[message.type]) {
          this.handlers[message.type](message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  },

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), 2000);
    } else {
      console.error('Max reconnection attempts reached');
      alert('Connection lost. Please refresh the page.');
    }
  },

  on(type, handler) {
    this.handlers[type] = handler;
  },

  send(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    } else {
      console.error('WebSocket not connected');
    }
  },

  createGame(settings, player) {
    this.send('create', { settings, player });
  },

  joinGame(code, player) {
    this.send('join', { code, player });
  },

  startGame() {
    this.send('start');
  },

  reveal(x, y) {
    this.send('reveal', { x, y });
  },

  flag(x, y) {
    this.send('flag', { x, y });
  },

  cursor(x, y) {
    this.send('cursor', { x, y });
  },

  restart() {
    this.send('restart');
  },

  toLobby() {
    this.send('toLobby');
  },

  emote(value) {
    this.send('emote', { value });
  }
};
