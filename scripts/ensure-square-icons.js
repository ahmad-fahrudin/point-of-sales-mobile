const Jimp = require('jimp');
const path = require('path');

async function makeSquare(srcPath, destPath) {
  const image = await Jimp.read(srcPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const size = Math.max(w, h);

  // Create a transparent background square
  const square = new Jimp(size, size, 0x00000000);

  const x = Math.floor((size - w) / 2);
  const y = Math.floor((size - h) / 2);

  square.composite(image, x, y);

  await square.writeAsync(destPath);
  console.log(`Saved square image: ${destPath}`);
}

async function main() {
  try {
    const root = path.resolve(__dirname, '..');
    const imagesDir = path.join(root, 'assets', 'images');

    const files = [
      { src: 'icon.png', dest: 'icon-square.png' },
      { src: 'favicon.png', dest: 'favicon-square.png' }
    ];

    for (const f of files) {
      const src = path.join(imagesDir, f.src);
      const dest = path.join(imagesDir, f.dest);
      await makeSquare(src, dest);
    }

    console.log('All done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
