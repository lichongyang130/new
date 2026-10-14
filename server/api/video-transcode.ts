import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

export async function transcodeWebMToMp4(input: Uint8Array): Promise<Uint8Array> {
  if (input.byteLength < 16 || input.byteLength > 100 * 1024 * 1024) throw new Error("Video must be between 16 bytes and 100 MB.");
  const directory = await mkdtemp(join(tmpdir(), "designbuddy-video-"));
  const source = join(directory, "input.webm");
  const target = join(directory, "output.mp4");
  try {
    await writeFile(source, input);
    await new Promise<void>((resolve, reject) => {
      const binary = process.env.FFMPEG_PATH || "ffmpeg";
      const child = spawn(binary, ["-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", source, "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", target], { stdio: ["ignore", "ignore", "pipe"] });
      let errorOutput = "";
      const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("Video transcode timed out after 90 seconds.")); }, 90_000);
      child.stderr.on("data", (chunk: Buffer) => { errorOutput = (errorOutput + chunk.toString()).slice(-3000); });
      child.once("error", (error) => { clearTimeout(timer); reject(new Error(("code" in error && error.code === "ENOENT") ? "FFmpeg is not installed or FFMPEG_PATH is invalid." : error.message)); });
      child.once("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg failed (${code}): ${errorOutput.trim().slice(-1200) || "unknown error"}`));
      });
    });
    return new Uint8Array(await readFile(target));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
