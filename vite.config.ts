import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

/**
 * Build-time prerendering of the public marketing routes.
 *
 * Runs after the normal client build: builds src/prerender.tsx as an SSR
 * bundle, renders each public route to HTML, and writes a static file per
 * route into the client output directory. The app still hydrates as a normal
 * SPA; only the initial HTML payload changes.
 *
 * Any route that fails is logged and skipped — the build never fails because
 * of prerendering.
 */
function prerenderPlugin(): Plugin {
  return {
    name: "chiq-prerender",
    apply: "build",
    enforce: "post",
    async closeBundle() {
      // Skip when this is the nested SSR build itself.
      if (process.env.CHIQ_PRERENDER_SSR === "1") return;

      const outDir = path.resolve(__dirname, "dist");
      const templatePath = path.join(outDir, "index.html");
      if (!fs.existsSync(templatePath)) {
        console.warn("[prerender] dist/index.html not found — skipping prerender.");
        return;
      }

      const ssrOutDir = path.resolve(__dirname, "node_modules/.chiq-prerender");
      let renderModule: {
        render: (url: string) => { html: string; head: string };
        PRERENDER_ROUTES: readonly string[];
      };

      try {
        const { build } = await import("vite");
        process.env.CHIQ_PRERENDER_SSR = "1";
        await build({
          configFile: false,
          logLevel: "warn",
          resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
          plugins: [react()],
          build: {
            ssr: path.resolve(__dirname, "src/prerender.tsx"),
            outDir: ssrOutDir,
            emptyOutDir: true,
            rollupOptions: { output: { entryFileNames: "prerender.mjs" } },
          },
        });
        renderModule = await import(
          /* @vite-ignore */ `file://${path.join(ssrOutDir, "prerender.mjs")}`
        );
      } catch (err) {
        console.warn("[prerender] SSR bundle failed — shipping SPA-only HTML.", err);
        return;
      } finally {
        delete process.env.CHIQ_PRERENDER_SSR;
      }

      const template = fs.readFileSync(templatePath, "utf-8");
      let succeeded = 0;

      for (const route of renderModule.PRERENDER_ROUTES) {
        try {
          const { html, head } = renderModule.render(route);
          if (!html || html.trim().length === 0) {
            console.warn(`[prerender] ${route} rendered empty markup — skipped.`);
            continue;
          }

          let page = template;

          // Remove the generic defaults that the per-page Helmet tags replace,
          // so crawlers see exactly one title/description per page.
          if (head) {
            page = page
              .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
              .replace(
                /<meta\s+[^>]*(?:name|property)=["'](?:description|og:title|og:description|og:type|twitter:title|twitter:description|twitter:card)["'][^>]*>\s*/gi,
                ""
              );
            page = page.replace("</head>", `  ${head}\n  </head>`);
          }

          page = page.replace(
            '<div id="root"></div>',
            `<div id="root">${html}</div>`
          );

          const dir =
            route === "/" ? outDir : path.join(outDir, ...route.split("/").filter(Boolean));
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, "index.html"), page, "utf-8");
          succeeded += 1;
        } catch (err) {
          console.warn(`[prerender] ${route} failed — skipped.`, err);
        }
      }

      console.log(
        `[prerender] ${succeeded}/${renderModule.PRERENDER_ROUTES.length} public routes prerendered.`
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    prerenderPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
