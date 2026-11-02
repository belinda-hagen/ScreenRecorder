const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const toIco = require('to-ico');
const png2icons = require('png2icons');

// All app and packaging icons come from the same editable vector source.
async function generateIcons() {
  const assetsDir = path.join(__dirname, 'assets', 'icons');
  const buildDir = path.join(__dirname, 'build');
  const buildIconsDir = path.join(buildDir, 'icons');
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.mkdirSync(buildIconsDir, { recursive: true });

  const svgBuffer = fs.readFileSync(path.join(assetsDir, 'icon.svg'));
  const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
  const pngs = new Map();

  for (const size of sizes) {
    const png = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    pngs.set(size, png);
    fs.writeFileSync(path.join(buildIconsDir, `${size}x${size}.png`), png);
  }

  fs.writeFileSync(path.join(assetsDir, 'icon.png'), pngs.get(256));
  fs.writeFileSync(path.join(assetsDir, 'icon-256.png'), pngs.get(256));
  fs.writeFileSync(path.join(assetsDir, 'icon-1024.png'), pngs.get(1024));
  fs.writeFileSync(path.join(buildDir, 'icon.png'), pngs.get(512));
  fs.writeFileSync(path.join(buildIconsDir, 'icon.png'), pngs.get(512));

  const ico = await toIco([16, 24, 32, 48, 64, 128, 256].map(size => pngs.get(size)));
  for (const directory of [assetsDir, buildDir, buildIconsDir]) {
    fs.writeFileSync(path.join(directory, 'icon.ico'), ico);
  }

  const icns = png2icons.createICNS(pngs.get(1024), png2icons.BICUBIC, 0);
  if (!icns) throw new Error('Could not generate the macOS icon');
  fs.writeFileSync(path.join(buildIconsDir, 'icon.icns'), icns);
  console.log('Generated app, Windows, macOS, and Linux icons from assets/icons/icon.svg.');
}

generateIcons().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
