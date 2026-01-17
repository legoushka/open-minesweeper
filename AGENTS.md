# Agent Guide

This repository contains the `open-minesweeper` project, a real-time co-op Minesweeper game.
It consists of a Node.js/Express backend (`server/`) and a vanilla JavaScript frontend (`client/`).

## 1. Build, Lint, and Test Commands

### Server (`server/`)

*   **Install Dependencies:**
    ```bash
    npm install
    ```
    *Note: Run this inside the `server/` directory.*

*   **Start Server:**
    ```bash
    npm start
    # OR
    node index.js
    ```
    Runs on port 3000 by default.

*   **Development Mode:**
    ```bash
    npm run dev
    ```
    Uses `nodemon` for hot reloading (must be installed as devDependency).

### Client (`client/`)

*   **Build:**
    No build step required. The client is served as static files by the backend.
*   **Run:**
    Start the server, then navigate to `http://localhost:3000` in your browser.

### Testing & Linting

*   **Status:** Currently, there are **no** automated testing (Jest/Mocha) or linting (ESLint) configurations set up in this repository.
*   **Recommendation for Agents:**
    *   **Tests:** If asked to run tests, check for `package.json` scripts first. If missing, inform the user or propose adding a test framework like `jest`.
        *   If adding tests, prefer **Jest**.
        *   To run a single test file (if Jest were installed): `npx jest path/to/file.test.js`.
    *   **Linting:** No linter is currently active. If asked to fix style, follow the guidelines below manually.
        *   If adding a linter, prefer **ESLint** with a standard config.
        *   To lint (if ESLint were installed): `npx eslint .`.

## 2. Code Style Guidelines

### General

*   **Indentation:** 2 spaces (soft tabs).
*   **Quotes:** Single quotes (`'`) preferred for strings and imports.
*   **Semicolons:** Always use semicolons at the end of statements.
*   **Variables:** Use `const` for immutables and `let` for mutables. Avoid `var`.
*   **Comments:** Sparse. Comment *why* something is done, not *what*.

### Server-Side (Node.js)

*   **Module System:** CommonJS (`require`, `module.exports`).
*   **Async Handling:** Uses callbacks and event listeners (e.g., `ws.on('message', ...)`). `async/await` is acceptable if modernizing or for new logic.
*   **Structure:**
    *   `index.js`: Entry point, HTTP/WebSocket setup.
    *   `gameManager.js`: Logic for managing multiple game instances.
    *   `game.js`: Class representing a single game session.
*   **Logging:** Use `console.log` for info and `console.error` for errors.
*   **Path Resolution:** Use `path.join(__dirname, ...)` for cross-platform file paths.

### Client-Side (Vanilla JS)

*   **Module System:** Global objects/namespaces (e.g., `App`, `Socket`, `Board`) loaded via `<script>` tags in `index.html`.
    *   *Note:* Not using ES6 modules (`import/export`) in the browser currently.
*   **DOM Manipulation:** Use standard DOM APIs (`document.getElementById`, `classList.add`, `document.querySelectorAll`).
*   **Event Handling:** `addEventListener` or explicit method calls from UI events.

### Naming Conventions

*   **Variables/Functions:** `camelCase` (e.g., `broadcastToGame`, `currentPlayerId`).
*   **Classes/Singletons:** `PascalCase` (e.g., `App`, `WebSocketServer`, `Game`).
*   **Constants:** `UPPER_CASE` (e.g., `PORT`).
*   **Filenames:** `camelCase.js` (e.g., `gameManager.js`, `socket.js`).

### Error Handling

*   **Server:**
    *   Wrap JSON parsing and critical game logic in `try...catch` blocks.
    *   Send error messages back to the client via WebSocket using a standard error message format: `{ type: 'error', message: 'Description' }`.
*   **Client:**
    *   Handle WebSocket errors via `socket.on('error')`.
    *   Use `alert()` for critical failures or display UI notifications if available.

### Best Practices

1.  **State Management:**
    *   **Server Authority:** The server is the source of truth for game state (board, scores, players).
    *   **Client Mirror:** The client mirrors state but should not calculate core game logic (like mine placement) independently to prevent cheating.
2.  **Performance:**
    *   **Broadcasting:** Broadcast updates only to relevant players (`broadcastToGame`).
    *   **Data Minimization:** Filter sensitive data (like hidden mine locations) before sending to client unless the game is over or the cell is explicitly revealed.
3.  **Security:**
    *   Do not trust client input. Validate all WebSocket messages (e.g., coordinates within bounds, player turn).

### Git & Tooling Rules

*   **Git:** Do not commit `node_modules` or `package-lock.json` conflicts.
*   **Environment:** Respect `process.env.PORT` if available.
