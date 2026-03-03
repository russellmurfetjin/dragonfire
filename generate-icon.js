#!/usr/bin/env node
// Renders the in-game dragon to PNG files at all sizes needed for a macOS .icns icon,
// then assembles them into build/icon.icns using iconutil.

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function drawDragon(ctx, size) {
  const s = size;
  const pad = s * 0.1; // padding so wings/tail don't clip
  const t = s - pad * 2; // tile size within padding

  const x = pad;
  const y = pad;

  // Background circle (dark, like the game floor)
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2);
  ctx.fill();

  // Subtle ring
  ctx.strokeStyle = '#ff660044';
  ctx.lineWidth = s * 0.02;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2);
  ctx.stroke();

  // --- Dragon (front-facing, wings spread) ---
  const facingX = 0, facingY = -1;

  // Body
  ctx.fillStyle = '#3a7d44';
  ctx.fillRect(x + t * 0.2, y + t * 0.3, t * 0.6, t * 0.5);

  // Belly
  ctx.fillStyle = '#6abf69';
  ctx.fillRect(x + t * 0.3, y + t * 0.42, t * 0.4, t * 0.32);

  // Head
  const hx = x + t * 0.5 + facingX * t * 0.2;
  const hy = y + t * 0.3 + facingY * t * 0.15;
  ctx.fillStyle = '#3a7d44';
  ctx.beginPath();
  ctx.arc(hx, hy, t * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#ff4444';
  const ex1 = hx + facingX * t * 0.06 - facingY * t * 0.08;
  const ey1 = hy + facingY * t * 0.06 + facingX * t * 0.08;
  const ex2 = hx + facingX * t * 0.06 + facingY * t * 0.08;
  const ey2 = hy + facingY * t * 0.06 - facingX * t * 0.08;
  ctx.beginPath(); ctx.arc(ex1, ey1, t * 0.045, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex2, ey2, t * 0.045, 0, Math.PI * 2); ctx.fill();

  // Wings (spread, front-facing)
  ctx.fillStyle = '#6a3d7d';
  ctx.beginPath();
  ctx.moveTo(x + t * 0.15, y + t * 0.35);
  ctx.lineTo(x - t * 0.05, y + t * 0.18);
  ctx.lineTo(x + t * 0.2, y + t * 0.52);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + t * 0.85, y + t * 0.35);
  ctx.lineTo(x + t * 1.05, y + t * 0.18);
  ctx.lineTo(x + t * 0.8, y + t * 0.52);
  ctx.fill();

  // Tail (curving down)
  ctx.strokeStyle = '#3a7d44';
  ctx.lineWidth = Math.max(2, t * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + t * 0.5 - facingX * t * 0.3, y + t * 0.72 - facingY * t * 0.2);
  ctx.quadraticCurveTo(
    x + t * 0.5 - facingX * t * 0.55, y + t * 0.82 - facingY * t * 0.3,
    x + t * 0.5 - facingX * t * 0.45, y + t * 0.92 - facingY * t * 0.15
  );
  ctx.stroke();

  // Horns
  ctx.fillStyle = '#c4a35a';
  ctx.beginPath();
  ctx.moveTo(hx - t * 0.08, hy - t * 0.12);
  ctx.lineTo(hx - t * 0.04, hy - t * 0.26);
  ctx.lineTo(hx + t * 0.02, hy - t * 0.12);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx + t * 0.04, hy - t * 0.12);
  ctx.lineTo(hx + t * 0.1, hy - t * 0.26);
  ctx.lineTo(hx + t * 0.14, hy - t * 0.12);
  ctx.fill();

  // Small fire breath (facing up)
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.moveTo(hx - t * 0.06, hy - t * 0.2);
  ctx.quadraticCurveTo(hx, hy - t * 0.42, hx + t * 0.06, hy - t * 0.2);
  ctx.fill();
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.moveTo(hx - t * 0.03, hy - t * 0.2);
  ctx.quadraticCurveTo(hx, hy - t * 0.34, hx + t * 0.03, hy - t * 0.2);
  ctx.fill();
}

// Sizes needed for macOS .icns (iconutil requires these exact names/sizes)
const iconsetSizes = [16, 32, 64, 128, 256, 512, 1024];

const iconsetDir = path.join(__dirname, 'build', 'icon.iconset');
fs.mkdirSync(iconsetDir, { recursive: true });

// Also generate a build/icon.png for electron-builder (256x256)
for (const size of iconsetSizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawDragon(ctx, size);
  const buf = canvas.toBuffer('image/png');

  // Standard res
  if (size <= 512) {
    fs.writeFileSync(path.join(iconsetDir, `icon_${size}x${size}.png`), buf);
  }
  // @2x versions (iconutil needs these)
  if (size >= 32 && size <= 1024) {
    const half = size / 2;
    fs.writeFileSync(path.join(iconsetDir, `icon_${half}x${half}@2x.png`), buf);
  }
}

// Generate the main icon.png (512x512) for electron-builder fallback
const mainCanvas = createCanvas(512, 512);
drawDragon(mainCanvas.getContext('2d'), 512);
fs.writeFileSync(path.join(__dirname, 'build', 'icon.png'), mainCanvas.toBuffer('image/png'));

console.log('Generated iconset PNGs in build/icon.iconset/');

// Use macOS iconutil to create .icns
try {
  execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(__dirname, 'build', 'icon.icns')}"`);
  console.log('Created build/icon.icns');
} catch (e) {
  console.error('iconutil failed:', e.message);
  console.log('You can manually convert the iconset to .icns using: iconutil -c icns build/icon.iconset');
}

console.log('Done!');
