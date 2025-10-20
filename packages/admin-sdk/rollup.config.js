import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const external = ['axios', 'zod', '@cowors/shared-types'];

const createConfig = (input, output, format) => ({
  input,
  output: {
    file: output,
    format,
    exports: 'named',
  },
  external,
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
    }),
  ],
});

const createDtsConfig = (input, output) => ({
  input,
  output: {
    file: output,
    format: 'es',
  },
  external,
  plugins: [dts()],
});

export default [
  // Main bundle
  createConfig('src/index.ts', 'dist/index.js', 'cjs'),
  createConfig('src/index.ts', 'dist/index.esm.js', 'es'),
  createDtsConfig('src/index.ts', 'dist/index.d.ts'),

  // Client bundle
  createConfig('src/client/index.ts', 'dist/client/index.js', 'cjs'),
  createConfig('src/client/index.ts', 'dist/client/index.esm.js', 'es'),
  createDtsConfig('src/client/index.ts', 'dist/client/index.d.ts'),

  // Services bundle
  createConfig('src/services/index.ts', 'dist/services/index.js', 'cjs'),
  createConfig('src/services/index.ts', 'dist/services/index.esm.js', 'es'),
  createDtsConfig('src/services/index.ts', 'dist/services/index.d.ts'),

  // Auth bundle
  createConfig('src/auth/index.ts', 'dist/auth/index.js', 'cjs'),
  createConfig('src/auth/index.ts', 'dist/auth/index.esm.js', 'es'),
  createDtsConfig('src/auth/index.ts', 'dist/auth/index.d.ts'),
  
  // Generated bundle
  createConfig('src/generated/index.ts', 'dist/generated/index.js', 'cjs'),
  createConfig('src/generated/index.ts', 'dist/generated/index.esm.js', 'es'),
  createDtsConfig('src/generated/index.ts', 'dist/generated/index.d.ts'),
];