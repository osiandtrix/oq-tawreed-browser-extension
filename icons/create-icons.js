// Node.js script to generate PNG icons from SVG
// Run with: node create-icons.js

const fs = require('fs');
const path = require('path');

// Simple PNG creation function (creates basic icons)
function createSimplePNG(size) {
    // This creates a very basic PNG with the extension concept
    // For production, you'd want to use a proper image library like sharp or canvas
    
    const canvas = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#2c5aa0" stroke="#1e3d6f" stroke-width="1"/>
        <rect x="${size*0.25}" y="${size*0.22}" width="${size*0.5}" height="${size*0.375}" rx="2" fill="white" stroke="#2c5aa0" stroke-width="1"/>
        <line x1="${size*0.25}" y1="${size*0.31}" x2="${size*0.75}" y2="${size*0.31}" stroke="#2c5aa0" stroke-width="0.5"/>
        <line x1="${size*0.25}" y1="${size*0.41}" x2="${size*0.75}" y2="${size*0.41}" stroke="#2c5aa0" stroke-width="0.5"/>
        <line x1="${size*0.375}" y1="${size*0.22}" x2="${size*0.375}" y2="${size*0.595}" stroke="#2c5aa0" stroke-width="0.5"/>
        <line x1="${size*0.5}" y1="${size*0.22}" x2="${size*0.5}" y2="${size*0.595}" stroke="#2c5aa0" stroke-width="0.5"/>
        <line x1="${size*0.625}" y1="${size*0.22}" x2="${size*0.625}" y2="${size*0.595}" stroke="#2c5aa0" stroke-width="0.5"/>
        <circle cx="${size/2}" cy="${size*0.72}" r="${size*0.125}" fill="#28a745" stroke="#1e7e34" stroke-width="1"/>
        <path d="M${size/2} ${size*0.66} L${size/2} ${size*0.78} M${size*0.47} ${size*0.735} L${size/2} ${size*0.78} L${size*0.53} ${size*0.735}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`;
    
    return canvas;
}

// Create SVG files for each size
const sizes = [16, 48, 128];

sizes.forEach(size => {
    const svgContent = createSimplePNG(size);
    fs.writeFileSync(path.join(__dirname, `icon${size}.svg`), svgContent);
    console.log(`Created icon${size}.svg`);
});

console.log('\nSVG icons created! To convert to PNG:');
console.log('1. Open generate-icons.html in a web browser');
console.log('2. Download the PNG files');
console.log('3. Or use an online SVG to PNG converter');
console.log('4. Or use a tool like Inkscape or ImageMagick');

// Instructions for manual conversion
const instructions = `
# Converting SVG to PNG

## Option 1: Use the HTML generator
1. Open icons/generate-icons.html in your web browser
2. Click the download buttons to get PNG files

## Option 2: Online converter
1. Go to https://convertio.co/svg-png/
2. Upload the SVG files
3. Download the PNG versions

## Option 3: Command line (if you have ImageMagick)
magick icon16.svg icon16.png
magick icon48.svg icon48.png
magick icon128.svg icon128.png

## Option 4: Inkscape command line
inkscape icon16.svg --export-type=png --export-filename=icon16.png
inkscape icon48.svg --export-type=png --export-filename=icon48.png
inkscape icon128.svg --export-type=png --export-filename=icon128.png
`;

fs.writeFileSync(path.join(__dirname, 'CONVERSION_INSTRUCTIONS.md'), instructions);
console.log('\nCreated CONVERSION_INSTRUCTIONS.md with detailed steps');
