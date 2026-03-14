import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/devkit/',
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        root: resolve(__dirname, 'index.html'),
        main: resolve(__dirname, 'pages/index.html'),
        json: resolve(__dirname, 'pages/json/index.html'),
        base64: resolve(__dirname, 'pages/base64/index.html'),
        'url-codec': resolve(__dirname, 'pages/url-codec/index.html'),
        jwt: resolve(__dirname, 'pages/jwt/index.html'),
        regex: resolve(__dirname, 'pages/regex/index.html'),
        timestamp: resolve(__dirname, 'pages/timestamp/index.html'),
        uuid: resolve(__dirname, 'pages/uuid/index.html'),
        hash: resolve(__dirname, 'pages/hash/index.html'),
        color: resolve(__dirname, 'pages/color/index.html'),
        markdown: resolve(__dirname, 'pages/markdown/index.html'),
        cron: resolve(__dirname, 'pages/cron/index.html'),
        'text-diff': resolve(__dirname, 'pages/text-diff/index.html'),
        'code-formatter': resolve(__dirname, 'pages/code-formatter/index.html'),
        'sql-formatter': resolve(__dirname, 'pages/sql-formatter/index.html'),
        password: resolve(__dirname, 'pages/password/index.html'),
        'number-base': resolve(__dirname, 'pages/number-base/index.html'),
        'unit-converter': resolve(__dirname, 'pages/unit-converter/index.html'),
        yaml: resolve(__dirname, 'pages/yaml/index.html'),
        'image-compress': resolve(__dirname, 'pages/image-compress/index.html'),
      },
    },
  },
});
