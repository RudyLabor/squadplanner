import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { COLORS } from '../shared/colors'
import { FONTS } from '../shared/fonts'
import { PhoneFrame } from '../shared/components/PhoneFrame'
import { StatusBar } from '../shared/components/StatusBar'
import { BackgroundEffects } from '../shared/components/BackgroundEffects'
import { Scene1Content } from './Scene1-DiscordChaos'
import { Scene2Content } from './Scene2-TransformUI'
import { Scene3Content } from './Scene3-SquadReady'
import { Scene4Content } from './Scene4-HeroLoop'

// ============================================================
// TIMELINE — 480 frames = 16s @ 30fps
// Single persistent phone with continuous 3D transforms.
// Content layers switch via opacity (no mount/unmount).
// ============================================================
// Scene 1 (Discord):    frames 0-120
// Scene 2 (SP UI):      frames 120-260
// Scene 3 (Confirmed):  frames 240-400
// Scene 4 (Logo):       frames 380-480
// ============================================================

const S1_END = 120
const S2_START = 120
const S3_START = 240
const S3_END = 400
const S4_START = 380
const CROSSFADE = 20

export const HeroVideo: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  // =====================================================
  // PHONE TRANSFORM TIMELINE (continuous for 480 frames)
  // =====================================================

  // Entrance: spring from below (frames 0-30)
  const entranceSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 18, stiffness: 100 },
  })
  const entranceY = interpolate(entranceSpring, [0, 1], [80, 0])

  // Continuous float bob
  const floatBob = Math.sin(frame * 0.04) * 3

  // Scene 4: phone pulls up and fades out
  const scene4PullUp = interpolate(frame, [S4_START, S4_START + 40], [0, -120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const phoneY = entranceY + floatBob + scene4PullUp

  // Rotation Y: tilt left (scene 1) -> sweep right (scene 2) -> settle (scene 3-4)
  const phoneRotateY = interpolate(
    frame,
    [0, S1_END, S2_START + 40, S3_START, S3_END, S4_START + 30],
    [-4, -3, 3, 2, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  // Rotation X: subtle downward tilt
  const phoneRotateX = interpolate(frame, [0, S2_START, S3_END], [2, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Scale: dominant at 1.4, zoom in during scene 3, scale down for scene 4
  const phoneScale = interpolate(
    frame,
    [0, S3_START, S3_START + 30, S3_END - 20, S4_START + 40],
    [1.4, 1.4, 1.5, 1.5, 0.7],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  // Phone opacity: fade in, dim during pivot text, fade out for scene 4
  const pivotDim = interpolate(
    frame,
    [S1_END - 15, S1_END, S1_END + 25, S1_END + 40],
    [1, 0.15, 0.15, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const phoneBaseOpacity = interpolate(frame, [0, 15, S4_START, S4_START + 35], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const phoneOpacity = phoneBaseOpacity * pivotDim

  // =====================================================
  // GLOW COLOR — evolves: Discord blue -> indigo -> green -> indigo
  // =====================================================
  const glowColorR = interpolate(
    frame,
    [0, S1_END, S2_START + 30, S3_START + 30, S4_START],
    [88, 99, 99, 52, 99],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const glowColorG = interpolate(
    frame,
    [0, S1_END, S2_START + 30, S3_START + 30, S4_START],
    [101, 102, 102, 211, 102],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const glowColorB = interpolate(
    frame,
    [0, S1_END, S2_START + 30, S3_START + 30, S4_START],
    [242, 241, 241, 153, 241],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const glowColor = `#${Math.round(glowColorR).toString(16).padStart(2, '0')}${Math.round(glowColorG).toString(16).padStart(2, '0')}${Math.round(glowColorB).toString(16).padStart(2, '0')}`

  const glowIntensity = interpolate(frame, [0, 30, S3_START + 40, S3_END], [0.1, 0.18, 0.28, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Glass reflection sweep during scene 2 transition
  const reflectionProgress = interpolate(frame, [S2_START + 20, S2_START + 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // =====================================================
  // CONTENT LAYER OPACITIES (opacity crossfade, not mount)
  // =====================================================

  const content1Opacity = interpolate(frame, [S1_END - 25, S1_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Scene 2 content: fade in after pivot text clears, blackout BEFORE scene 3
  const content2FadeIn = interpolate(frame, [S1_END + 25, S1_END + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  // Blackout: scene 2 fully out BEFORE scene 3 starts (no overlap)
  const content2FadeOut = interpolate(frame, [S3_START - 10, S3_START], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const content2Opacity = Math.min(content2FadeIn, content2FadeOut)

  // Scene 3 content: appears AFTER scene 2 is fully gone
  const content3FadeIn = interpolate(frame, [S3_START, S3_START + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const content3FadeOut = interpolate(frame, [S3_END - CROSSFADE, S3_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const content3Opacity = Math.min(content3FadeIn, content3FadeOut)

  // =====================================================
  // BACKGROUND EFFECTS — evolving colors per scene
  // =====================================================
  const bgGlow1 = frame < S2_START ? '#5865f2' : frame < S3_START ? '#6366f1' : '#34d399'
  const bgGlow2 = frame < S2_START ? '#f87171' : frame < S3_START ? '#06B6D4' : '#6366f1'
  const bgIntensity = interpolate(frame, [0, 30, S4_START, S4_START + 50], [0.5, 1, 1, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // =====================================================
  // FLOATING TEXT
  // =====================================================

  // "LE PROBLÈME" — scene 1 top label
  const labelProgress = spring({ frame, fps, config: { damping: 200 } })
  const labelFadeOut = interpolate(frame, [S1_END - 30, S1_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // "Personne ne joue." — scene 1 bottom result
  const resultProgress = spring({
    frame: frame - 78,
    fps,
    config: { damping: 200 },
  })
  const resultFadeOut = interpolate(frame, [S1_END - 25, S1_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // "Et si ta squad jouait vraiment ?" — shown ALONE, phone dimmed
  // Appears as Discord fades, disappears BEFORE SP UI content appears
  const pivotFadeIn = interpolate(frame, [S1_END - 15, S1_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const pivotFadeOut = interpolate(frame, [S1_END + 20, S1_END + 35], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const pivotScale = interpolate(pivotFadeIn, [0, 1], [0.85, 1])

  // "On joue." — scene 3 bottom result
  const onJoueProgress = spring({
    frame: frame - (S3_START + 65),
    fps,
    config: { damping: 200 },
  })
  const onJoueFadeOut = interpolate(frame, [S3_END - CROSSFADE, S3_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Scene 4 overlay — waits for phone to fully disappear (phone gone at S4_START+35)
  const scene4FadeIn = interpolate(frame, [S4_START + 30, S4_START + 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Fade to black for seamless loop
  const fadeToBlack = interpolate(frame, [durationInFrames - 30, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg.base }}>
      {/* === BACKGROUND EFFECTS === */}
      <BackgroundEffects
        frame={frame}
        glowColor1={bgGlow1}
        glowColor2={bgGlow2}
        intensity={bgIntensity}
        gridColor={frame < S3_START ? '#6366f1' : '#34d399'}
        gridOpacity={0.25}
        flareIntensity={
          // Lens flare during pivot text and scene 4 logo reveal
          Math.max(
            // Pivot text flare (frames 105-155)
            interpolate(frame, [S1_END - 15, S1_END, S1_END + 20, S1_END + 35], [0, 0.7, 0.7, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            // Scene 4 logo flare (frames 410-460)
            interpolate(
              frame,
              [S4_START + 30, S4_START + 45, S4_START + 70, S4_START + 85],
              [0, 0.5, 0.5, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )
          )
        }
        streakIntensity={
          // Radial light streaks fire during each scene transition
          Math.max(
            // Scene 1→2 transition (pivot moment)
            interpolate(
              frame,
              [S1_END - 10, S1_END + 5, S1_END + 25, S1_END + 40],
              [0, 0.8, 0.6, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            ),
            // Scene 2→3 transition
            interpolate(
              frame,
              [S3_START - 15, S3_START - 5, S3_START + 10, S3_START + 25],
              [0, 0.5, 0.4, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            ),
            // Scene 3→4 transition (logo reveal burst)
            interpolate(
              frame,
              [S4_START - 5, S4_START + 10, S4_START + 35, S4_START + 55],
              [0, 0.9, 0.5, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )
          )
        }
        dofBlur={
          // Progressive depth-of-field: blur edges when phone is focal point
          interpolate(
            frame,
            [
              0,
              30,
              S1_END - 20,
              S1_END,
              S1_END + 40,
              S3_START,
              S3_END - 30,
              S4_START + 5,
              S4_START + 45,
            ],
            [0, 0.4, 0.5, 0, 0.6, 0.65, 0.5, 0.3, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          )
        }
      />

      {/* === FLOATING TEXT: "LE PROBLÈME" (scene 1 top) === */}
      {frame < S1_END && (
        <div
          style={{
            position: 'absolute' as const,
            top: 30,
            left: 0,
            right: 0,
            textAlign: 'center' as const,
            opacity: labelProgress * labelFadeOut,
            transform: `translateY(${interpolate(labelProgress, [0, 1], [15, 0])}px)`,
            zIndex: 10,
          }}
        >
          <span
            style={{
              color: COLORS.text.tertiary,
              fontSize: 16,
              fontFamily: FONTS.body,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: 6,
            }}
          >
            Le problème
          </span>
        </div>
      )}

      {/* === FLOATING TEXT: "Personne ne joue." (scene 1 bottom) === */}
      {frame >= 78 && frame < S1_END && (
        <div
          style={{
            position: 'absolute' as const,
            bottom: 25,
            left: 0,
            right: 0,
            textAlign: 'center' as const,
            opacity: resultProgress * resultFadeOut,
            transform: `translateY(${interpolate(resultProgress, [0, 1], [10, 0])}px)`,
            zIndex: 10,
          }}
        >
          <span
            style={{
              color: COLORS.error,
              fontSize: 24,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            Personne ne joue. La squad meurt.
          </span>
        </div>
      )}

      {/* === FLOATING TEXT: "Et si ta squad jouait vraiment ?" (pivot, alone) === */}
      {frame >= S1_END - 15 && frame < S1_END + 40 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: pivotFadeIn * pivotFadeOut,
            transform: `scale(${pivotScale})`,
            zIndex: 15,
          }}
        >
          <span
            style={{
              color: COLORS.text.primary,
              fontSize: 100,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              letterSpacing: -4,
              textAlign: 'center' as const,
              lineHeight: 1.05,
              maxWidth: 1400,
              padding: '0 80px',
            }}
          >
            Et si ta squad <span style={{ color: COLORS.primary }}>jouait vraiment</span> ?
          </span>
        </AbsoluteFill>
      )}

      {/* === FLOATING TEXT: "On joue." (scene 3 bottom) === */}
      {frame >= S3_START + 50 && frame < S3_END && (
        <div
          style={{
            position: 'absolute' as const,
            bottom: 35,
            left: 0,
            right: 0,
            textAlign: 'center' as const,
            opacity: onJoueProgress * onJoueFadeOut,
            transform: `translateY(${interpolate(onJoueProgress, [0, 1], [15, 0])}px)`,
            zIndex: 10,
          }}
        >
          <span
            style={{
              color: COLORS.success,
              fontSize: 64,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            On joue.
          </span>
        </div>
      )}

      {/* === SINGLE PERSISTENT PHONE === */}
      <div
        style={{
          position: 'absolute' as const,
          top: '48%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${phoneY}px)`,
          opacity: phoneOpacity,
          zIndex: 5,
        }}
      >
        <PhoneFrame
          scale={phoneScale}
          rotateY={phoneRotateY}
          rotateX={phoneRotateX}
          glowColor={glowColor}
          glowIntensity={glowIntensity}
          reflectionProgress={
            reflectionProgress > 0 && reflectionProgress < 1 ? reflectionProgress : -1
          }
          floatOffset={0}
        >
          <StatusBar />

          {/* Content layers — stacked absolute, switched by opacity */}
          <div style={{ flex: 1, position: 'relative' as const }}>
            {/* Layer 1: Discord chat */}
            <div
              style={{
                position: 'absolute' as const,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: content1Opacity,
                pointerEvents: content1Opacity < 0.01 ? ('none' as const) : ('auto' as const),
              }}
            >
              <Scene1Content frame={frame} fps={fps} />
            </div>

            {/* Layer 2: Squad Planner UI */}
            <div
              style={{
                position: 'absolute' as const,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: content2Opacity,
                pointerEvents: content2Opacity < 0.01 ? ('none' as const) : ('auto' as const),
              }}
            >
              <Scene2Content frame={Math.max(0, frame - S2_START)} fps={fps} />
            </div>

            {/* Layer 3: Confirmation */}
            <div
              style={{
                position: 'absolute' as const,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: content3Opacity,
                pointerEvents: content3Opacity < 0.01 ? ('none' as const) : ('auto' as const),
              }}
            >
              <Scene3Content frame={Math.max(0, frame - S3_START)} fps={fps} />
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* === SCENE 4: Logo + Tagline overlay === */}
      {frame >= S4_START && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: scene4FadeIn * (1 - fadeToBlack),
            zIndex: 20,
          }}
        >
          <Scene4Content frame={Math.max(0, frame - S4_START - 30)} fps={fps} />
        </AbsoluteFill>
      )}

      {/* === FADE TO BLACK (seamless loop) === */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.bg.base,
          opacity: fadeToBlack,
          pointerEvents: 'none' as const,
          zIndex: 30,
        }}
      />
    </AbsoluteFill>
  )
}
