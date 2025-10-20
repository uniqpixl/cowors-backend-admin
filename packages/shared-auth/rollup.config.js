import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const external = (id) => {
  // Keep all next-auth modules as external (including providers)
  if (id.startsWith('next-auth')) {
    return true
  }
  
  // Standard external dependencies
  return !id.startsWith('.') && !id.startsWith('/')
}

const config = [
  // Main ESM and CJS builds
  {
    input: 'src/index.ts',
    external,
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
  },
  // Client ESM and CJS builds
  {
    input: 'src/client.ts',
    external,
    output: [
      {
        file: 'dist/client.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/client.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
  },
  // Main type definitions
  {
    input: 'src/index.ts',
    external,
    output: {
      file: pkg.types,
      format: 'esm',
    },
    plugins: [dts()],
  },
  // Client type definitions
  {
    input: 'src/client.ts',
    external,
    output: {
      file: 'dist/client.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
  // NextAuth ESM and CJS builds
  {
    input: 'src/nextauth.ts',
    external,
    output: [
      {
        file: 'dist/nextauth/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/nextauth/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
  },
  // NextAuth type definitions
  {
    input: 'src/nextauth.ts',
    external,
    output: {
      file: 'dist/nextauth/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
];

export default config;