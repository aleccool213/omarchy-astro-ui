import { defineConfig } from "astro/config";

export default defineConfig({
  // @omarchy/ui ships TypeScript and .astro source rather than a build output,
  // so Vite has to compile it instead of treating it as an external package.
  vite: {
    ssr: { noExternal: ["@omarchy/ui"] },
  },
});
