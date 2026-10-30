import { Composition } from "remotion";
import {
  EthvanityPreview,
  PREVIEW_DURATION_IN_FRAMES,
  PREVIEW_FPS,
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
} from "./EthvanityPreview";

export function RemotionRoot() {
  return (
    <Composition
      id="EthvanityPreview"
      component={EthvanityPreview}
      durationInFrames={PREVIEW_DURATION_IN_FRAMES}
      fps={PREVIEW_FPS}
      width={PREVIEW_WIDTH}
      height={PREVIEW_HEIGHT}
    />
  );
}
