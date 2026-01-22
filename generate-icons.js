const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const toIco = require('to-ico');

async function generateIcons() {
  const svgPath = path.join(__dirname, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PNG icons...');
  
  // Main icon.png (256x256 for app window)
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(__dirname, 'icon.png'));
  console.log('Created icon.png (256x256)');

  // Large icon for build folder (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'build', 'icon.png'));
  console.log('Created build/icon.png (512x512)');

  // Generate multiple sizes for ICO (Windows needs multiple sizes embedded)
  console.log('Generating ICO file with multiple sizes...');
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    icoSizes.map(size => 
      sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  // Convert to ICO
  const icoBuffer = await toIco(pngBuffers);
  fs.writeFileSync(path.join(__dirname, 'icon.ico'), icoBuffer);
  console.log('Created icon.ico');

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
