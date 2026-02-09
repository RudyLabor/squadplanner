/**
 * Image optimization script - converts static images to AVIF/WebP formats.
 * Run with: node scripts/optimize-images.mjs
 *
 * Requires: npm install --save-dev sharp
 *
 * This script:
 * - Finds all PNG/JPG images in public/
 * - Generates AVIF and WebP variants
 * - Preserves original files
 * - Reports size savings
 */
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const PUBLIC_DIR = 'public';
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

async function findImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const images = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      images.push(...await findImages(fullPath));
    } else if (IMAGE_EXTENSIONS.includes(extname(entry.name).toLowerCase())) {
      images.push(fullPath);
    }
  }

  return images;
}

async function optimizeImages() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('sharp is not installed. Run: npm install --save-dev sharp');
    process.exit(1);
  }

  const images = await findImages(PUBLIC_DIR);

  if (images.length === 0) {
    console.log('No images found to optimize.');
    return;
  }

  console.log(`Found ${images.length} images to optimize...\n`);
  let totalSaved = 0;

  for (const imagePath of images) {
    const name = basename(imagePath, extname(imagePath));
    const dir = imagePath.substring(0, imagePath.lastIndexOf('/') || imagePath.lastIndexOf('\\'));
    const originalSize = (await stat(imagePath)).size;

    try {
      // Generate WebP
      const webpPath = join(dir, `${name}.webp`);
      await sharp(imagePath)
        .webp({ quality: 80 })
        .toFile(webpPath);
      const webpSize = (await stat(webpPath)).size;

      // Generate AVIF
      const avifPath = join(dir, `${name}.avif`);
      await sharp(imagePath)
        .avif({ quality: 65 })
        .toFile(avifPath);
      const avifSize = (await stat(avifPath)).size;

      const saved = originalSize - avifSize;
      totalSaved += saved;

      console.log(`${basename(imagePath)}: ${(originalSize / 1024).toFixed(1)}KB -> WebP: ${(webpSize / 1024).toFixed(1)}KB, AVIF: ${(avifSize / 1024).toFixed(1)}KB (saved ${(saved / 1024).toFixed(1)}KB)`);
    } catch (err) {
      console.error(`Error processing ${imagePath}:`, err.message);
    }
  }

  console.log(`\nTotal saved: ${(totalSaved / 1024).toFixed(1)}KB`);
}

optimizeImages();
