import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  // Development mode: serve the example
  if (mode === "development") {
    return {
      root: "./example",
      server: {
        port: 3000,
        open: "/v2.html",
      },
    };
  }

  // Production mode: build the library
  return {
    build: {
      minify: false,
      lib: {
        entry: resolve(__dirname, "src/nanotext.ts"),
        name: "Nanotext",
        fileName: (format) => `nanotext.${format}.js`,
        formats: ["es", "umd"],
      },
      rollupOptions: {
        output: {
          assetFileNames: "nanotext.[ext]",
        },
      },
    },
  };
});
