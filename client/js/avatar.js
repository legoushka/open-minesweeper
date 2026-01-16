// Avatar creator and renderer
const Avatar = {
  BODY_COLORS: [
    { id: 'blue', hex: '#3d5a80' },
    { id: 'lightblue', hex: '#98c1d9' },
    { id: 'rose', hex: '#e56b6f' },
    { id: 'purple', hex: '#6d6875' },
    { id: 'mauve', hex: '#b5838d' },
    { id: 'gray', hex: '#e0e0e0' }
  ],

  EYES: [
    { id: 'dots', label: '••' },
    { id: 'lines', label: '──' },
    { id: 'crosses', label: '✕✕' },
    { id: 'hollow', label: '◯◯' },
    { id: 'squint', label: '⌃⌃' }
  ],

  ACCESSORIES: [
    { id: 'none', label: '∅' },
    { id: 'antenna', label: '⎺' },
    { id: 'halo', label: '○' },
    { id: 'horns', label: '⌃⌃' }
  ],

  render(ctx, avatar, x, y, size) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size * 0.4;

    // Body (circle)
    ctx.fillStyle = avatar.bodyColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#1a1a1a';
    const eyeY = centerY - radius * 0.15;
    const eyeSpacing = radius * 0.4;

    switch (avatar.eyes) {
      case 'dots':
        ctx.beginPath();
        ctx.arc(centerX - eyeSpacing, eyeY, radius * 0.12, 0, Math.PI * 2);
        ctx.arc(centerX + eyeSpacing, eyeY, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'lines':
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - eyeSpacing - radius * 0.15, eyeY);
        ctx.lineTo(centerX - eyeSpacing + radius * 0.15, eyeY);
        ctx.moveTo(centerX + eyeSpacing - radius * 0.15, eyeY);
        ctx.lineTo(centerX + eyeSpacing + radius * 0.15, eyeY);
        ctx.stroke();
        break;

      case 'crosses':
        ctx.lineWidth = 2;
        const crossSize = radius * 0.12;
        // Left cross
        ctx.beginPath();
        ctx.moveTo(centerX - eyeSpacing - crossSize, eyeY - crossSize);
        ctx.lineTo(centerX - eyeSpacing + crossSize, eyeY + crossSize);
        ctx.moveTo(centerX - eyeSpacing + crossSize, eyeY - crossSize);
        ctx.lineTo(centerX - eyeSpacing - crossSize, eyeY + crossSize);
        // Right cross
        ctx.moveTo(centerX + eyeSpacing - crossSize, eyeY - crossSize);
        ctx.lineTo(centerX + eyeSpacing + crossSize, eyeY + crossSize);
        ctx.moveTo(centerX + eyeSpacing + crossSize, eyeY - crossSize);
        ctx.lineTo(centerX + eyeSpacing - crossSize, eyeY + crossSize);
        ctx.stroke();
        break;

      case 'hollow':
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX - eyeSpacing, eyeY, radius * 0.12, 0, Math.PI * 2);
        ctx.arc(centerX + eyeSpacing, eyeY, radius * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'squint':
        ctx.lineWidth = 3;
        const squintSize = radius * 0.15;
        ctx.beginPath();
        // Left squint (upward arc)
        ctx.moveTo(centerX - eyeSpacing - squintSize, eyeY);
        ctx.quadraticCurveTo(centerX - eyeSpacing, eyeY - squintSize * 0.5, centerX - eyeSpacing + squintSize, eyeY);
        // Right squint
        ctx.moveTo(centerX + eyeSpacing - squintSize, eyeY);
        ctx.quadraticCurveTo(centerX + eyeSpacing, eyeY - squintSize * 0.5, centerX + eyeSpacing + squintSize, eyeY);
        ctx.stroke();
        break;
    }

    // Accessory
    ctx.strokeStyle = '#1a1a1a';
    ctx.fillStyle = '#1a1a1a';
    ctx.lineWidth = 2;

    switch (avatar.accessory) {
      case 'antenna':
        const antennaY = centerY - radius - radius * 0.3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX, antennaY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX, antennaY, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'halo':
        const haloY = centerY - radius - radius * 0.3;
        ctx.beginPath();
        ctx.arc(centerX, haloY, radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'horns':
        const hornY = centerY - radius;
        const hornX = radius * 0.6;
        ctx.beginPath();
        // Left horn
        ctx.moveTo(centerX - hornX, hornY);
        ctx.lineTo(centerX - hornX * 1.2, hornY - radius * 0.4);
        // Right horn
        ctx.moveTo(centerX + hornX, hornY);
        ctx.lineTo(centerX + hornX * 1.2, hornY - radius * 0.4);
        ctx.stroke();
        break;
    }
  },

  renderSmall(ctx, avatar, x, y) {
    this.render(ctx, avatar, x, y, 40);
  }
};
