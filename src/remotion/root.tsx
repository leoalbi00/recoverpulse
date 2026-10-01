import { Composition } from "remotion";

import { DEMO_VIDEO, VideoComposition } from "./video-composition";

export function RemotionRoot() {
  return (
    <Composition
      id={DEMO_VIDEO.id}
      component={VideoComposition}
      durationInFrames={DEMO_VIDEO.durationInFrames}
      fps={DEMO_VIDEO.fps}
      width={DEMO_VIDEO.width}
      height={DEMO_VIDEO.height}
    />
  );
}
