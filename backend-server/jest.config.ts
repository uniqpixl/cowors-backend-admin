/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // Test environment
  testEnvironment: "node",

  // Module file extensions
  moduleFileExtensions: ["js", "json", "ts"],

  // Root directory
  rootDir: "src",

  // Test regex
  testRegex: ".*\\.spec\\.ts$",

  // Transform files
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },

  // Module name mapping for path aliases
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },

  // Setup files
  setupFilesAfterEnv: [],

  // Test timeout
  testTimeout: 30000
};

export default config;
