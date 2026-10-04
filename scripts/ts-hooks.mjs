// Node ESM resolve hooks so plain `node --import ./scripts/ts-hooks.mjs file.ts` can run the
// project's TypeScript generators (lib/world/*) outside Next: resolves "@/..." and extensionless imports.
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

registerHooks({
  resolve(specifier, context, next) {
    let spec = specifier;
    if (spec.startsWith("@/")) spec = pathToFileURL(ROOT + spec.slice(2)).href;
    const tryExts = (base) => {
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        const p = base + ext;
        try {
          if (fs.statSync(new URL(p)).isFile()) return p;
        } catch {}
      }
      return null;
    };
    if (spec.startsWith("file:") || spec.startsWith(".")) {
      const base = spec.startsWith(".") ? new URL(spec, context.parentURL).href : spec;
      const found = tryExts(base);
      if (found) return next(found, context);
    }
    return next(spec, context);
  },
});
