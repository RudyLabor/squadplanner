import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';
import { PhoneFrame } from '../components/PhoneFrame';
import { HomeScreen } from '../components/screens/HomeScreen';
import { SquadScreen } from '../components/screens/SquadScreen';
import { PartyScreen } from '../components/screens/PartyScreen';
import { ProfileScreen } from '../components/screens/ProfileScreen';

// Each screen gets 75 frames (2.5s at 30fps)
const SCREEN_DURATION = 75;
const TRANSITION_DURATION = 10; // ~0.33s transition

const screens = [
  { id: 'home', Component: HomeScreen },
  { id: 'squad', Component: SquadScreen },
  { id: 'party', Component: PartyScreen },
  { id: 'profile', Component: ProfileScreen },
];

const ScreenTransition: React.FC<{
  children: React.ReactNode;
  startFrame: number;
  duration: number;
}> = ({ children, startFrame, duration }) => {
  const frame = useCurrentFrame();

  // Relative frame within this sequence
  const relativeFrame = frame;

  // Slide in from right at start
  const enterX = interpolate(relativeFrame, [0, TRANSITION_DURATION], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const enterOpacity = interpolate(relativeFrame, [0, TRANSITION_DURATION], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Slide out to left at end
  const exitStart = duration - TRANSITION_DURATION;
  const exitX = interpolate(relativeFrame, [exitStart, duration], [0, -30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitOpacity = interpolate(relativeFrame, [exitStart, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const x = relativeFrame < TRANSITION_DURATION ? enterX : exitX;
  const opacity = relativeFrame < TRANSITION_DURATION ? enterOpacity : exitOpacity;

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${x}px)`,
        opacity,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const HeroWalkthrough: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <PhoneFrame width={280} height={480}>
        {screens.map((screen, i) => {
          const startFrame = i * SCREEN_DURATION;
          return (
            <Sequence
              key={screen.id}
              from={startFrame}
              durationInFrames={SCREEN_DURATION}
              name={screen.id}
            >
              <ScreenTransition startFrame={startFrame} duration={SCREEN_DURATION}>
                <screen.Component />
              </ScreenTransition>
            </Sequence>
          );
        })}
      </PhoneFrame>
    </AbsoluteFill>
  );
};
