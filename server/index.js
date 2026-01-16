const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const gameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Map to track connected clients
const clients = new Map(); // playerId -> { ws, gameCode, playerId }

// Broadcast to all players in a game
function broadcastToGame(gameCode, message, excludePlayerId = null) {
  for (const [playerId, client] of clients.entries()) {
    if (client.gameCode === gameCode && playerId !== excludePlayerId) {
      if (client.ws.readyState === 1) { // OPEN
        client.ws.send(JSON.stringify(message));
      }
    }
  }
}

// Send to specific player
function sendToPlayer(playerId, message) {
  const client = clients.get(playerId);
  if (client && client.ws.readyState === 1) {
    client.ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  let currentPlayerId = null;
  let currentGameCode = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'create': {
          const { settings, player } = message;
          const playerId = uuidv4();
          const playerData = { ...player, id: playerId };
          
          const game = gameManager.createGame(settings, playerData);
          
          currentPlayerId = playerId;
          currentGameCode = game.code;
          clients.set(playerId, { ws, gameCode: game.code, playerId });
          
          ws.send(JSON.stringify({
            type: 'created',
            code: game.code,
            playerId,
            game: game.toJSON()
          }));
          
          console.log(`Game ${game.code} created by ${player.name}`);
          break;
        }

        case 'join': {
          const { code, player } = message;
          const game = gameManager.getGame(code);
          
          if (!game) {
            ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
            break;
          }
          
          try {
            const playerId = uuidv4();
            const playerData = { ...player, id: playerId };
            game.addPlayer(playerData);
            
            currentPlayerId = playerId;
            currentGameCode = code;
            clients.set(playerId, { ws, gameCode: code, playerId });
            
            ws.send(JSON.stringify({
              type: 'joined',
              playerId,
              game: game.toJSON()
            }));
            
            broadcastToGame(code, {
              type: 'playerJoined',
              player: playerData
            }, playerId);
            
            console.log(`${player.name} joined game ${code}`);
          } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
          }
          break;
        }

        case 'start': {
          const game = gameManager.getGame(currentGameCode);
          if (!game) break;
          
          if (game.hostId !== currentPlayerId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Only host can start' }));
            break;
          }
          
          try {
            game.startGame();
            broadcastToGame(currentGameCode, {
              type: 'gameStarted',
              game: game.toJSON()
            });
            console.log(`Game ${currentGameCode} started`);
          } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
          }
          break;
        }

        case 'reveal': {
          const { x, y } = message;
          const game = gameManager.getGame(currentGameCode);
          if (!game || game.state !== 'playing') break;
          
          try {
            const result = game.reveal(x, y, currentPlayerId);
            
            broadcastToGame(currentGameCode, {
              type: 'revealed',
              cells: result.cells,
              by: currentPlayerId
            });
            
            if (result.gameOver) {
              broadcastToGame(currentGameCode, {
                type: 'gameOver',
                won: result.won,
                board: game.getMaskedState(),
                triggeredBy: result.triggeredBy
              });
              console.log(`Game ${currentGameCode} ended: ${result.won ? 'won' : 'lost'}`);
            }
          } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
          }
          break;
        }

        case 'flag': {
          const { x, y } = message;
          const game = gameManager.getGame(currentGameCode);
          if (!game || game.state !== 'playing') break;
          
          try {
            const result = game.toggleFlag(x, y, currentPlayerId);
            broadcastToGame(currentGameCode, {
              type: 'flagged',
              x,
              y,
              flagged: result.flagged,
              by: currentPlayerId,
              flagsRemaining: game.settings.mines - game.flaggedCells.size
            });
          } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
          }
          break;
        }

        case 'cursor': {
          const { x, y } = message;
          if (!currentGameCode || !currentPlayerId) break;
          
          broadcastToGame(currentGameCode, {
            type: 'cursor',
            playerId: currentPlayerId,
            x,
            y
          }, currentPlayerId);
          break;
        }

        case 'restart': {
          const game = gameManager.getGame(currentGameCode);
          if (!game) break;
          
          if (game.state !== 'won' && game.state !== 'lost') {
            ws.send(JSON.stringify({ type: 'error', message: 'Game is still in progress' }));
            break;
          }
          
          game.reset();
          broadcastToGame(currentGameCode, {
            type: 'gameStarted',
            game: game.toJSON()
          });
          console.log(`Game ${currentGameCode} restarted`);
          break;
        }

        case 'toLobby': {
          const game = gameManager.getGame(currentGameCode);
          if (!game) break;
          
          if (game.hostId !== currentPlayerId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Only host can return to lobby' }));
            break;
          }
          
          game.state = 'lobby';
          game.board = null;
          game.revealedCells.clear();
          game.flaggedCells.clear();
          game.startTime = null;
          
          broadcastToGame(currentGameCode, {
            type: 'toLobby',
            game: game.toJSON()
          });
          console.log(`Game ${currentGameCode} returned to lobby`);
          break;
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Server error' }));
    }
  });

  ws.on('close', () => {
    if (currentPlayerId && currentGameCode) {
      const game = gameManager.getGame(currentGameCode);
      if (game) {
        const isEmpty = game.removePlayer(currentPlayerId);
        
        if (isEmpty) {
          gameManager.deleteGame(currentGameCode);
          console.log(`Game ${currentGameCode} deleted (empty)`);
        } else {
          // Notify remaining players
          broadcastToGame(currentGameCode, {
            type: 'playerLeft',
            playerId: currentPlayerId
          });
          
          // If host changed, notify
          if (game.hostId !== currentPlayerId) {
            broadcastToGame(currentGameCode, {
              type: 'hostChanged',
              newHostId: game.hostId
            });
          }
        }
      }
      
      clients.delete(currentPlayerId);
      console.log(`Player ${currentPlayerId} disconnected from ${currentGameCode}`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Stats endpoint: http://localhost:${PORT}/stats`);
});

// Stats endpoint
app.get('/stats', (req, res) => {
  res.json(gameManager.getStats());
});
