import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const processEnvValues = {
    'process.env': Object.entries(env).reduce((prev, [key, val]) => {
      return {
        ...prev,
        [key]: val,
      };
    }, {}),
  };
  return {
    define: processEnvValues,
    server: {
      proxy: {
        '^/api': {
          target: 'http://backend:8000/',
          changeOrigin: true,
          secure: false,
          ws: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
      watch: {
        usePolling: true,
      },
      host: true,
      port: 3000,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0].toString();
            }
          },
        },
      },
      outDir: 'build',
    },
    esbuild: {
      pure: mode === 'production' ? ['console.log'] : [],
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/vitest.setup.js'],
      coverage: {
        provider: 'istanbul',
        include: ['src/**/*.{js,jsx}'], // specify files to include
        exclude: ['src/generated/**/*.ts'], // specify files to exclude
        reporter: ['text', 'json', 'html'],
      },
      server: {
        deps: {
          inline: ['vitest-canvas-mock'],
        },
      },
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
      environmentOptions: {
        jsdom: {
          resources: 'usable',
        },
      },
    },
    plugins: [react()],
  };
});
