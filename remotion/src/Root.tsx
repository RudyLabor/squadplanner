import React from 'react';
import { Composition } from 'remotion';
import { HeroWalkthrough } from './compositions/HeroWalkthrough';

// Future compositions will be added here as they are built
// import { PillarVoice } from './compositions/PillarVoice';
// import { PillarPlanning } from './compositions/PillarPlanning';
// import { PillarReliability } from './compositions/PillarReliability';
// import { SocialProof } from './compositions/SocialProof';
// import { OnboardingVideo } from './compositions/OnboardingVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroWalkthrough"
        component={HeroWalkthrough}
        durationInFrames={300}
        width={540}
        height={960}
        fps={30}
      />

      {/* Future compositions:
      <Composition
        id="PillarVoice"
        component={PillarVoice}
        durationInFrames={150}
        width={480}
        height={320}
        fps={30}
      />
      <Composition
        id="PillarPlanning"
        component={PillarPlanning}
        durationInFrames={150}
        width={480}
        height={320}
        fps={30}
      />
      <Composition
        id="PillarReliability"
        component={PillarReliability}
        durationInFrames={180}
        width={480}
        height={320}
        fps={30}
      />
      <Composition
        id="SocialProof"
        component={SocialProof}
        durationInFrames={150}
        width={960}
        height={240}
        fps={30}
      />
      <Composition
        id="OnboardingVideo"
        component={OnboardingVideo}
        durationInFrames={540}
        width={720}
        height={1280}
        fps={30}
      />
      */}
    </>
  );
};
