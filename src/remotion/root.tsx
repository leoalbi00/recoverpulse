import { Composition } from "remotion";

import { OMNIREV_B2B, OmniRevB2B } from "./OmniRevB2B";
import { OMNIREV_DUNNING_SERVICE, OmniRevDunningService } from "./OmniRevDunningService";
import { OMNIREV_LINKEDIN, OmniRevLinkedIn } from "./OmniRevLinkedIn";
import { OMNIREV_REEL, OmniRevReel } from "./OmniRevReel";
import { OMNIREV_SPOT, OmniRevSpot } from "./OmniRevSpot";
import { OMNIREV_TV, OmniRevTV } from "./OmniRevTV";
import { DEMO_VIDEO, VideoComposition } from "./video-composition";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id={DEMO_VIDEO.id}
        component={VideoComposition}
        durationInFrames={DEMO_VIDEO.durationInFrames}
        fps={DEMO_VIDEO.fps}
        width={DEMO_VIDEO.width}
        height={DEMO_VIDEO.height}
      />
      <Composition
        id={OMNIREV_SPOT.id}
        component={OmniRevSpot}
        durationInFrames={OMNIREV_SPOT.durationInFrames}
        fps={OMNIREV_SPOT.fps}
        width={OMNIREV_SPOT.width}
        height={OMNIREV_SPOT.height}
      />
      <Composition
        id={OMNIREV_TV.id}
        component={OmniRevTV}
        durationInFrames={OMNIREV_TV.durationInFrames}
        fps={OMNIREV_TV.fps}
        width={OMNIREV_TV.width}
        height={OMNIREV_TV.height}
      />
      <Composition
        id={OMNIREV_REEL.id}
        component={OmniRevReel}
        durationInFrames={OMNIREV_REEL.durationInFrames}
        fps={OMNIREV_REEL.fps}
        width={OMNIREV_REEL.width}
        height={OMNIREV_REEL.height}
      />
      <Composition
        id={OMNIREV_LINKEDIN.id}
        component={OmniRevLinkedIn}
        durationInFrames={OMNIREV_LINKEDIN.durationInFrames}
        fps={OMNIREV_LINKEDIN.fps}
        width={OMNIREV_LINKEDIN.width}
        height={OMNIREV_LINKEDIN.height}
      />
      <Composition
        id={OMNIREV_B2B.id}
        component={OmniRevB2B}
        durationInFrames={OMNIREV_B2B.durationInFrames}
        fps={OMNIREV_B2B.fps}
        width={OMNIREV_B2B.width}
        height={OMNIREV_B2B.height}
      />
      <Composition
        id={OMNIREV_DUNNING_SERVICE.id}
        component={OmniRevDunningService}
        durationInFrames={OMNIREV_DUNNING_SERVICE.durationInFrames}
        fps={OMNIREV_DUNNING_SERVICE.fps}
        width={OMNIREV_DUNNING_SERVICE.width}
        height={OMNIREV_DUNNING_SERVICE.height}
      />
    </>
  );
}
