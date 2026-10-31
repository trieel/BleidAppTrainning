const path = require('path');
const sharp = require(path.join(__dirname, '..', 'bleid-web', 'node_modules', 'sharp'));
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'bleid-web', 'public');

// SVG definition with 100% full bleed solid background (no rx rounded corners, no transparent corners)
const fullBleedSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1914"/>
      <stop offset="100%" stop-color="#120E0B"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="25%" r="70%">
      <stop offset="0%" stop-color="#BB6C32" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#BB6C32" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Full bleed background - NO rounded corners, zero transparency -->
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  
  <!-- Subtle inner editorial border -->
  <rect x="24" y="24" width="464" height="464" rx="80" stroke="#BB6C32" stroke-opacity="0.35" stroke-width="3"/>
  
  <!-- Centered Athletic Monogram B (Strictly inside 80% safe zone) -->
  <path d="M172 136H276C320 136 352 158 352 198C352 226 332 246 302 256C338 266 358 290 358 322C358 368 320 390 274 390H172V136ZM230 186V236H272C294 236 304 226 304 211C304 196 294 186 272 186H230ZM230 286V340H274C298 340 310 328 310 313C310 296 298 286 274 286H230Z" fill="#FAF7F2"/>
  
  <!-- Gold Precision Dot -->
  <circle cx="360" cy="152" r="18" fill="#D4A359"/>
  <circle cx="360" cy="152" r="18" stroke="#1E1914" stroke-width="4"/>
</svg>`;

// Scaled version for maskable safe zone (circle of diameter 409px)
const maskableSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1914"/>
      <stop offset="100%" stop-color="#120E0B"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="25%" r="70%">
      <stop offset="0%" stop-color="#BB6C32" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#BB6C32" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Full bleed background - NO rounded corners, zero transparency -->
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  
  <!-- Centered Athletic Monogram B scaled slightly to guarantee 100% safe zone compliance -->
  <g transform="translate(256, 256) scale(0.82) translate(-256, -256)">
    <rect x="24" y="24" width="464" height="464" rx="80" stroke="#BB6C32" stroke-opacity="0.35" stroke-width="3.5"/>
    <path d="M172 136H276C320 136 352 158 352 198C352 226 332 246 302 256C338 266 358 290 358 322C358 368 320 390 274 390H172V136ZM230 186V236H272C294 236 304 226 304 211C304 196 294 186 272 186H230ZM230 286V340H274C298 340 310 328 310 313C310 296 298 286 274 286H230Z" fill="#FAF7F2"/>
    <circle cx="360" cy="152" r="18" fill="#D4A359"/>
    <circle cx="360" cy="152" r="18" stroke="#1E1914" stroke-width="4"/>
  </g>
</svg>`;

async function generate() {
  console.log('Generating crisp Bleid PWA icons...');
  
  // 1. apple-touch-icon.png (180x180, solid full bleed, zero transparency)
  await sharp(Buffer.from(fullBleedSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png (180x180) generated');

  // 1b. apple-touch-icon-precomposed.png (180x180)
  await sharp(Buffer.from(fullBleedSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
  console.log('✓ apple-touch-icon-precomposed.png (180x180) generated');

  // 2. icon-192x192.png
  await sharp(Buffer.from(fullBleedSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192x192.png'));
  console.log('✓ icon-192x192.png (192x192) generated');

  // 3. icon-512x512.png
  await sharp(Buffer.from(fullBleedSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512x512.png'));
  console.log('✓ icon-512x512.png (512x512) generated');

  // 4. icon-maskable-512x512.png (512x512, safe-zone compliant)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-maskable-512x512.png'));
  console.log('✓ icon-maskable-512x512.png (512x512) generated');

  // 5. Update SVGs in public/
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), fullBleedSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), fullBleedSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), fullBleedSvg);
  console.log('✓ icon.svg, icon-192.svg, icon-512.svg updated');
}

generate().catch(console.error);
