import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, renderStill } from '@remotion/renderer';
import path from 'path';

const compositions = [
  { id: 'HeroWalkthrough', outputFile: 'hero-walkthrough' },
  // Future compositions:
  // { id: 'PillarVoice', outputFile: 'pillar-voice' },
  // { id: 'PillarPlanning', outputFile: 'pillar-planning' },
  // { id: 'PillarReliability', outputFile: 'pillar-reliability' },
  // { id: 'SocialProof', outputFile: 'social-proof' },
  // { id: 'OnboardingVideo', outputFile: 'onboarding' },
];

async function renderAll() {
  console.log('Bundling Remotion project...');
  const bundled = await bundle({
    entryPoint: path.resolve('./src/index.ts'),
    onProgress: (progress: number) => {
      if (Math.round(progress * 100) % 25 === 0) {
        console.log(`  Bundling: ${Math.round(progress * 100)}%`);
      }
    },
  });

  const outputDir = path.resolve('../public/videos');

  for (const comp of compositions) {
    console.log(`\nRendering ${comp.id}...`);

    const composition = await selectComposition({
      serveUrl: bundled,
      id: comp.id,
    });

    // Render WebM (VP9 — smaller, better quality)
    console.log(`  Rendering WebM...`);
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'vp9',
      crf: 30,
      outputLocation: path.join(outputDir, `${comp.outputFile}.webm`),
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 25 === 0) {
          console.log(`    WebM: ${Math.round(progress * 100)}%`);
        }
      },
    });

    // Render MP4 (H.264 — Safari fallback)
    console.log(`  Rendering MP4...`);
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      crf: 23,
      outputLocation: path.join(outputDir, `${comp.outputFile}.mp4`),
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 25 === 0) {
          console.log(`    MP4: ${Math.round(progress * 100)}%`);
        }
      },
    });

    // Render poster (first frame as PNG, then convert to WebP manually)
    console.log(`  Rendering poster...`);
    await renderStill({
      composition,
      serveUrl: bundled,
      output: path.join(outputDir, `${comp.outputFile}-poster.png`),
      frame: 30, // Frame at 1 second (after initial animations)
      imageFormat: 'png',
    });

    console.log(`  Done: ${comp.outputFile}`);
  }

  console.log('\nAll renders complete!');
}

renderAll().catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});
