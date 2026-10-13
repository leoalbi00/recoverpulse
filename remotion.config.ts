// Configurazione della CLI Remotion (studio e render); Next non la usa.
import { Config } from "@remotion/cli/config";

// Gli asset dei video (audio generato da scripts/generate-spot-audio.mjs)
// stanno fuori da public/, così non finiscono nel deploy del sito.
Config.setPublicDir("./src/remotion/assets");
