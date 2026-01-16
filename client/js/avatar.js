// Avatar image system
const Avatar = {
  availableAvatars: [],
  
  async init() {
    // Load available avatar images from JSON manifest
    try {
      const response = await fetch('assets/avatars/avatars.json');
      const filenames = await response.json();
      this.availableAvatars = filenames.map(f => `assets/avatars/${f}`);
    } catch (e) {
      console.error('Failed to load avatars:', e);
      this.availableAvatars = [];
    }
    
    // Fallback if no avatars found
    if (this.availableAvatars.length === 0) {
      console.warn('No avatars available. Add images to client/assets/avatars/ and run ./scripts/update-avatars.sh');
    }
  },
  
  renderInElement(element, avatarSrc, size = 80) {
    element.innerHTML = '';
    element.style.position = 'relative';
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.overflow = 'hidden';
    
    const img = document.createElement('img');
    img.src = avatarSrc;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    
    // Add scanline overlay
    const scanlines = document.createElement('div');
    scanlines.className = 'scanline-overlay';
    
    element.appendChild(img);
    element.appendChild(scanlines);
  },
  
  // For canvas rendering in lobby/game (fallback)
  renderOnCanvas(ctx, avatarSrc, x, y, size) {
    const img = new Image();
    img.src = avatarSrc;
    img.onload = () => {
      ctx.save();
      
      // Clip to square
      ctx.beginPath();
      ctx.rect(x, y, size, size);
      ctx.clip();
      
      // Draw image (cover behavior)
      ctx.drawImage(img, x, y, size, size);
      
      // Draw scanlines on top
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.15)';
      ctx.lineWidth = 1;
      for (let i = y; i < y + size; i += 2) {
        ctx.beginPath();
        ctx.moveTo(x, i);
        ctx.lineTo(x + size, i);
        ctx.stroke();
      }
      
      ctx.restore();
    };
  }
};
