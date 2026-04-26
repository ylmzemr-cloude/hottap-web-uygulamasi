const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'images', 'help', 'raw');
const OUT_DIR = path.join(__dirname, '..', 'images', 'help');

// No → dahili dosya adı eşleşmesi (yardim-icerikleri.md tablosundan)
const INDEX_MAP = {
  1:  'proje_no.png',
  2:  'operasyon_tarihi.png',
  3:  'pipe_od.png',
  4:  'cutter_od.png',
  5:  'cutter_et.png',
  6:  'olcu_A.png',
  7:  'olcu_B.png',
  8:  'olcu_Ref1.png',
  9:  'olcu_D.png',
  10: 'olcu_Ref2.png',
  11: 'olcu_G.png',
  12: 'olcu_H.png',
  13: 'olcu_Y.png',
  14: 'olcu_F.png',
  15: 'olcu_KKM.png',
  16: 'olcu_TS.png',
  17: 'olcu_M.png',
  18: 'olcu_N.png',
};

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(RAW_DIR).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

if (files.length === 0) {
  console.log('images/help/raw/ klasöründe fotoğraf bulunamadı.');
  process.exit(0);
}

(async () => {
  for (const file of files) {
    const no = parseInt(path.parse(file).name);
    if (!INDEX_MAP[no]) {
      console.log('⚠ Tanımsız numara, atlandı:', file);
      continue;
    }
    const input  = path.join(RAW_DIR, file);
    const output = path.join(OUT_DIR, INDEX_MAP[no]);
    await sharp(input)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: false })
      .png({ quality: 90 })
      .toFile(output);
    console.log('✓', file, '→', INDEX_MAP[no]);
  }
  console.log('\nTamamlandı.');
})();
