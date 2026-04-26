const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '..', 'images', 'help', 'raw');
const OUTPUT_DIR = path.join(__dirname, '..', 'images', 'help');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const files = fs.readdirSync(INPUT_DIR).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

if (files.length === 0) {
  console.log('images/help/raw/ klasöründe işlenecek fotoğraf bulunamadı.');
  process.exit(0);
}

(async () => {
  for (const file of files) {
    const input = path.join(INPUT_DIR, file);
    const output = path.join(OUTPUT_DIR, path.parse(file).name + '.png');
    await sharp(input)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: false })
      .png({ quality: 90 })
      .toFile(output);
    console.log('✓', file, '→', path.basename(output));
  }
  console.log('\nTamamlandı. Fotoğraflar:', OUTPUT_DIR);
})();
