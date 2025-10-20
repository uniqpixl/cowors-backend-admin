import * as fs from 'fs-extra';
import axios from 'axios';

export interface ValidationOptions {
  verbose?: boolean;
}

export async function validateOpenApiSpec(input: string, options: ValidationOptions = {}): Promise<any> {
  try {
    if (options.verbose) {
      console.log(`🔍 Validating OpenAPI spec from: ${input}`);
    }

    let apiSpec: any;
    
    if (input.startsWith('http')) {
      // Fetch from URL
      const response = await axios.get(input);
      apiSpec = response.data;
    } else {
      // Read from file
      const content = await fs.readFile(input, 'utf-8');
      apiSpec = JSON.parse(content);
    }

    // Basic validation
    if (!apiSpec.openapi && !apiSpec.swagger) {
      throw new Error('Not a valid OpenAPI/Swagger specification');
    }

    if (!apiSpec.paths) {
      throw new Error('OpenAPI spec must contain paths');
    }

    if (options.verbose) {
      console.log(`✅ Spec validated: ${apiSpec.info?.title} v${apiSpec.info?.version}`);
      console.log(`📊 Found ${Object.keys(apiSpec.paths || {}).length} endpoints`);
    }

    return apiSpec;
  } catch (error) {
    throw new Error(`OpenAPI validation failed: ${error}`);
  }
}