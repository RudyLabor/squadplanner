import { Composition, Folder } from 'remotion'
import { HeroVideo } from './video1-hero/HeroVideo'

// Total duration calculation for Hero Video:
// Scenes: 120 + 140 + 170 + 110 = 540
// Transitions: 20 + 20 + 20 = 60
// Total: 540 - 60 = 480 frames
const HERO_DURATION = 480

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Squad-Planner">
        <Composition
          id="HeroVideo"
          component={HeroVideo}
          durationInFrames={HERO_DURATION}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  )
}
