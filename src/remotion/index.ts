// Entry point per la CLI Remotion (`npm run video:render`): registra le
// composizioni definite in root.tsx. Il player della landing
// (src/components/landing/demo-video.tsx) importa invece direttamente
// video-composition.tsx, senza passare da qui.
import { registerRoot } from "remotion";

import { RemotionRoot } from "./root";

registerRoot(RemotionRoot);
