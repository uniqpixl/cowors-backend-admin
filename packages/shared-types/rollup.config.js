const typescript = require('@rollup/plugin-typescript').default;
const dts = require('rollup-plugin-dts').default;

const external = ['typescript'];

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

module.exports = [
  // Main bundle
  createConfig('src/index.ts', 'dist/index.js', 'cjs'),
  createConfig('src/index.ts', 'dist/index.esm.js', 'es'),
  createDtsConfig('src/index.ts', 'dist/index.d.ts'),

  // User types
  createConfig('src/user/index.ts', 'dist/user/index.js', 'cjs'),
  createConfig('src/user/index.ts', 'dist/user/index.esm.js', 'es'),
  createDtsConfig('src/user/index.ts', 'dist/user/index.d.ts'),

  // Booking types
  createConfig('src/booking/index.ts', 'dist/booking/index.js', 'cjs'),
  createConfig('src/booking/index.ts', 'dist/booking/index.esm.js', 'es'),
  createDtsConfig('src/booking/index.ts', 'dist/booking/index.d.ts'),

  // Payment types
  createConfig('src/payment/index.ts', 'dist/payment/index.js', 'cjs'),
  createConfig('src/payment/index.ts', 'dist/payment/index.esm.js', 'es'),
  createDtsConfig('src/payment/index.ts', 'dist/payment/index.d.ts'),

  // Space types
  createConfig('src/space/index.ts', 'dist/space/index.js', 'cjs'),
  createConfig('src/space/index.ts', 'dist/space/index.esm.js', 'es'),
  createDtsConfig('src/space/index.ts', 'dist/space/index.d.ts'),

  // API types
  createConfig('src/api/index.ts', 'dist/api/index.js', 'cjs'),
  createConfig('src/api/index.ts', 'dist/api/index.esm.js', 'es'),
  createDtsConfig('src/api/index.ts', 'dist/api/index.d.ts'),
];