# CO-OP MINESWEEPER

A real-time multiplayer minesweeper game with a Radiohead Kid A inspired aesthetic.

## Features

- **Real-time Co-op Gameplay**: 2-8 players working together on the same board
- **Custom Avatars**: Create your own abstract character with colors, eyes, and accessories
- **Multiple Board Sizes**: Beginner, Intermediate, Expert, and custom configurations
- **Mobile Support**: Touch controls with long-press to flag
- **Live Cursors**: See where other players are clicking in real-time
- **Atmospheric Audio**: Web Audio API synthesized sounds
- **Kid A Aesthetic**: Dark, minimal design inspired by Radiohead's Kid A album

## Tech Stack

- **Backend**: Node.js + Express + WebSocket (ws)
- **Frontend**: Vanilla JavaScript + HTML5 Canvas
- **Styling**: Custom CSS with Grotesque MT and BD Plakat fonts
- **Audio**: Web Audio API (no external files)

## Installation

```bash
# Install dependencies
cd server
npm install

# Start the server
npm start
```

The server will run on port 3000 by default.

## How to Play

1. Open the app in your browser
2. Create your avatar and choose a unique cursor color
3. Create a new game or join with a code
4. Wait for at least 2 players in the lobby
5. Host starts the game
6. Click/tap to reveal cells, right-click/long-press to flag
7. Work together to reveal all safe cells!

## Game Controls

### Desktop
- **Left Click**: Reveal cell
- **Right Click**: Toggle flag

### Mobile
- **Tap**: Reveal cell
- **Long Press (500ms)**: Toggle flag

## Development

```bash
# Run with auto-reload
cd server
npm run dev
```

## Deployment

Deploy to your VDS:

```bash
# Upload files
# Install Node.js if not present
# Install dependencies
cd server
npm install

# Run with PM2 (recommended)
pm2 start index.js --name minesweeper

# Or run directly
npm start
```

Access via `http://YOUR_IP:3000`

## License

MIT
