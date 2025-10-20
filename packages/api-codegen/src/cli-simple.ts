#!/usr/bin/env node

import { Command } from 'commander';
import { generateZodClient } from './generators/zod-client-generator';
import { generateTypes } from './generators/type-generator';
import { validateOpenApiSpec } from './utils/validator';

const program = new Command();

program
  .name('@cowors/api-codegen')
  .description('OpenAPI to Zod schema generator for Cowors SDKs')
  .version('1.0.0')
  .requiredOption('-i, --input <url>', 'OpenAPI spec URL or file path')
  .requiredOption('-o, --output <path>', 'Output directory path')
  .requiredOption('-n, --name <name>', 'API client name (e.g., AdminAPI, UserAPI)')
  .option('-f, --filter <tag>', 'Filter endpoints by OpenAPI tag (e.g., admin, user, partner)')
  .option('--no-client', 'Skip API client generation, only generate schemas')
  .option('--no-types', 'Skip TypeScript type generation')
  .option('--no-validation', 'Skip OpenAPI spec validation')
  .option('-v, --verbose', 'Verbose logging')
  .action(async (options: any) => {
    try {
      console.log(`🚀 Generating ${options.name} from ${options.input}`);
      
      if (!options.noValidation) {
        console.log('📋 Validating OpenAPI specification...');
        await validateOpenApiSpec(options.input);
        console.log('✅ OpenAPI specification is valid');
      }

      if (!options.noTypes) {
        console.log('🔧 Generating TypeScript types...');
        await generateTypes({
          input: options.input,
          output: options.output,
          filter: options.filter,
          verbose: options.verbose
        });
        console.log('✅ TypeScript types generated');
      }

      if (!options.noClient) {
        console.log('⚡ Generating Zod schemas and API client...');
        await generateZodClient({
          input: options.input,
          output: options.output,
          name: options.name,
          filter: options.filter,
          verbose: options.verbose
        });
        console.log('✅ Zod client generated successfully');
      }

      console.log(`🎉 ${options.name} generation completed!`);
      console.log(`📁 Output: ${options.output}`);
      
    } catch (error) {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    }
  });

program.parse();