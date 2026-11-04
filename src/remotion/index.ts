// Entry point per la CLI Remotion (`npm run video:render`): registra le
// composizioni definite in root.tsx.
import { registerRoot } from "remotion";

import { RemotionRoot } from "./root";

registerRoot(RemotionRoot);
