import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // UnoCSS — 原子化 CSS 引擎，需在 React 插件之前
    UnoCSS(),
    react(),
    electron({
      main: {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            rollupOptions: {
              output: {
                // 禁止 code splitting，确保所有代码在同一文件
                inlineDynamicImports: true,
                // 注入 ESM → CJS 兼容 polyfill（require / __dirname / __filename）
                banner: [
                  'import { createRequire } from "node:module";',
                  'import { fileURLToPath as __fileURLToPath } from "node:url";',
                  'import { dirname as __pathDirname } from "node:path";',
                  'const require = createRequire(import.meta.url);',
                  'const __filename = __fileURLToPath(import.meta.url);',
                  'const __dirname = __pathDirname(__filename);',
                ].join('\n'),
              },
              // 主进程的 node_modules 运行时加载，不打包
              external: [
                '@node-rs/jieba',
                '@node-rs/jieba/dict.js',
                '@lancedb/lancedb',
                'electron-updater',
                'tesseract.js',
                'word-extractor',
                'ollama',
                'openai',
                'pdfjs-dist',
                'unzipper',
                'iconv-lite',
                '@modelcontextprotocol/sdk',
                '@modelcontextprotocol/sdk/client/index.js',
                '@modelcontextprotocol/sdk/client/stdio.js',
                '@modelcontextprotocol/sdk/client/sse.js',
                '@modelcontextprotocol/sdk/types.js',
              ],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'src/preload/index.ts'),
      },
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
  // 路径别名，方便 import
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
    },
  },
})
