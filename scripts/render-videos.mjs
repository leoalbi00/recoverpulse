// Renderizza i video OmniRev in out/ e normalizza la loudness dell'audio per
// la destinazione (misura + correzione lineare in due passaggi, loudnorm):
//   TV          −23 LUFS, true peak −1 dBTP (EBU R128, richiesto dalle emittenti)
//   social      −14 LUFS (Instagram, TikTok, LinkedIn, YouTube)
//   web/demo    −16 LUFS
// Uso:
//   node scripts/render-videos.mjs                 # tutti
//   node scripts/render-videos.mjs OmniRevTV30     # solo alcuni
// Richiede l'audio generato: node scripts/generate-spot-audio.mjs
import { spawnSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";

const VIDEOS = {
  OmniRevTV30: { file: "omnirev-tv-30s", loudness: -23 },
  OmniRevSpot: { file: "omnirev-spot-15s", loudness: -16 },
  OmniRevReel: { file: "omnirev-reel-15s-9x16", loudness: -14 },
  OmniRevLinkedIn: { file: "omnirev-linkedin-20s-1x1", loudness: -14 },
  OmniRevB2B: { file: "omnirev-presentazione-70s", loudness: -16 },
  OmniRevDunningService: { file: "omnirev-dunning-servizio-25s", loudness: -16 },
};
const TRUE_PEAK = -1;

const requested = process.argv.slice(2);
const unknown = requested.filter((id) => !(id in VIDEOS));
if (unknown.length > 0) {
  console.error(`Composizioni sconosciute: ${unknown.join(", ")}. Disponibili: ${Object.keys(VIDEOS).join(", ")}`);
  process.exit(1);
}
const ids = requested.length > 0 ? requested : Object.keys(VIDEOS);

/** Esegue `npx …`; fallisce con l'output del comando se l'exit code non è 0. */
function npx(args, { quiet = false } = {}) {
  const result = spawnSync("npx", args, { encoding: "utf8", stdio: quiet ? "pipe" : ["ignore", "inherit", "inherit"] });
  if (result.status !== 0) {
    if (quiet) process.stderr.write(result.stderr ?? "");
    throw new Error(`Comando fallito: npx ${args.join(" ")}`);
  }
  return result;
}

/** Ultimo oggetto JSON stampato da loudnorm (print_format=json, su stderr). */
function measure(file, target) {
  const { stderr } = npx(["remotion", "ffmpeg", "-hide_banner", "-i", file, "-vn", "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"], {
    quiet: true,
  });
  return JSON.parse(stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1));
}

await mkdir("out", { recursive: true });

for (const id of ids) {
  const { file, loudness } = VIDEOS[id];
  const raw = `out/.${file}.raw.mp4`;
  const final = `out/${file}.mp4`;
  const target = `I=${loudness}:TP=${TRUE_PEAK}:LRA=11`;
  console.log(`\n▶ ${id} → ${final}`);

  npx(["remotion", "render", "src/remotion/index.ts", id, raw, "--codec=h264", "--crf=16"]);

  // 1° passaggio: misura; 2° passaggio: correzione lineare con i valori misurati.
  const m = measure(raw, target);
  const correction = `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  npx(
    ["remotion", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-c:v", "copy", "-af", correction, "-ar", "48000", "-c:a", "aac", "-b:a", "320k", final],
    { quiet: true },
  );
  await rm(raw);

  const check = measure(final, target);
  console.log(`  audio: ${check.input_i} LUFS, true peak ${check.input_tp} dBTP (obiettivo ${loudness} LUFS, ≤ ${TRUE_PEAK} dBTP)`);
}
