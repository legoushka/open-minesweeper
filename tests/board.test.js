const Board = require('../client/js/board.js');

describe('Board Calculation Logic', () => {
  // Mock DOM elements
  let mockCanvas;
  let mockContainer;

  beforeEach(() => {
    // Reset window dimensions
    window.innerWidth = 1920;
    window.innerHeight = 1080;

    // Mock HTML elements
    mockCanvas = document.createElement('canvas');
    mockContainer = document.createElement('div');
    mockContainer.appendChild(mockCanvas);
    
    // Mock getContext
    mockCanvas.getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
    }));

    // Mock document.getElementById for slider
    document.getElementById = jest.fn().mockReturnValue(null);
  });

  test('should calculate correct max width for Expert board on Large Desktop', () => {
    // Expert Settings: 30x16
    const settings = { width: 30, height: 16, mines: 99 };
    
    Board.canvas = mockCanvas;
    Board.settings = settings;
    
    // This calls calculateSize internally
    // We pass empty players array
    Board.init(mockCanvas, settings, []);

    // 1. Check Container Width Limit
    // Logic: Math.min(1920 - 100, 1300) = 1300px max width
    // With 30 columns, we want to see if it fits comfortably
    
    // Let's check the calculated cell size
    // cellSize = Math.floor(1300 / 30) = 43px. 
    // BUT it is clamped to max 40px in the code (Board.js line 67: Math.min(this.cellSize, maxSize); maxSize=40)
    
    expect(Board.cellSize).toBe(40);
    
    // Total board width = 30 * 40 = 1200px
    expect(Board.canvas.width).toBe(1200);
    
    // Ensure container max-width was set to allowing up to 1300px
    expect(mockContainer.style.maxWidth).toBe('1300px');
  });

  test('should scale down on smaller screens', () => {
    // Simulate smaller laptop screen
    window.innerWidth = 1000; 
    
    const settings = { width: 30, height: 16, mines: 99 };
    Board.init(mockCanvas, settings, []);

    // Available width = 1000 - 100 (margin) = 900px
    // Expected cell size = 900 / 30 = 30px
    expect(Board.cellSize).toBe(30);
    expect(Board.canvas.width).toBe(900);
  });
});
