import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/background.ts", "src/ui/popup.ts"],
  bundle: true,
  outdir: "extension/dist",
});
