import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';

const SOURCE = process.argv[2];
const APP_DIR = path.resolve('src/app');

async function main() {
  console.log('🎨 Generating icons from:', SOURCE);

  // 1. favicon.ico (32x32)
  const png32 = await sharp(SOURCE)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const icoBuffer = await pngToIco([png32]);
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), icoBuffer);
  console.log('✅ favicon.ico (32x32)');

  // 2. icon.png (512x512) - for Next.js app icon
  await sharp(SOURCE)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(APP_DIR, 'icon.png'));
  console.log('✅ icon.png (512x512)');

  // 3. apple-icon.png (180x180) - Apple touch icon
  await sharp(SOURCE)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(APP_DIR, 'apple-icon.png'));
  console.log('✅ apple-icon.png (180x180)');

  // 4. Remove old icon.svg if exists
  const oldSvg = path.join(APP_DIR, 'icon.svg');
  if (fs.existsSync(oldSvg)) {
    fs.unlinkSync(oldSvg);
    console.log('🗑️  Removed old icon.svg');
  }

  // 5. Save original as logo in public folder
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  await sharp(SOURCE)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✅ public/logo.png (512x512)');

  console.log('\n🎉 All icons generated successfully!');
}

main().catch(console.error);
