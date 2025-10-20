import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';

export interface TypeGeneratorOptions {
  input: string;
  output: string;
  filter?: string;
  verbose?: boolean;
}

export async function generateTypes(options: TypeGeneratorOptions): Promise<void> {
  const { input, output, filter, verbose } = options;

  try {
    // Fetch OpenAPI spec
    let apiSpec: any;
    if (input.startsWith('http')) {
      const response = await axios.get(input);
      apiSpec = response.data;
    } else {
      const content = await fs.readFile(input, 'utf-8');
      apiSpec = JSON.parse(content);
    }

    // Ensure output directory exists
    await fs.ensureDir(output);

    // Generate TypeScript types from schemas
    const schemas = apiSpec.components?.schemas || {};
    const typeDefinitions = generateTypeDefinitions(schemas, filter);

    // Write types file
    const typesPath = path.join(output, 'types.ts');
    await fs.writeFile(typesPath, typeDefinitions);

    if (verbose) {
      console.log(`📝 Generated types: ${typesPath}`);
    }

  } catch (error) {
    throw new Error(`Type generation failed: ${error}`);
  }
}

function generateTypeDefinitions(schemas: Record<string, any>, filter?: string): string {
  const lines: string[] = [
    '// Auto-generated TypeScript types from OpenAPI specification',
    '// Do not edit manually',
    '',
  ];

  // Generate enum exports first
  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.enum) {
      lines.push(generateEnumType(name, schema));
    }
  }

  // Generate interface exports
  for (const [name, schema] of Object.entries(schemas)) {
    if (!schema.enum) {
      lines.push(generateInterfaceType(name, schema));
    }
  }

  return lines.join('\n');
}

function generateEnumType(name: string, schema: any): string {
  const values = schema.enum.map((val: any) => `  ${JSON.stringify(val)} = ${JSON.stringify(val)}`).join(',\n');
  return `
export enum ${name} {
${values}
}
`;
}

function generateInterfaceType(name: string, schema: any): string {
  if (!schema) {
    return `export type ${name} = any; // Schema is undefined\n`;
  }
  
  if (schema.type === 'object' && schema.properties) {
    const properties = Object.entries(schema.properties as Record<string, any>)
      .map(([propName, propSchema]) => {
        if (!propSchema) {
          return `  ${propName}?: any;`;
        }
        const optional = schema.required?.includes(propName) ? '' : '?';
        const type = getTypeScriptType(propSchema as any);
        return `  ${propName}${optional}: ${type};`;
      })
      .join('\n');

    return `
export interface ${name} {
${properties}
}
`;
  }

  return `export type ${name} = any; // Complex schema not fully supported yet\n`;
}

function getTypeScriptType(schema: any): string {
  if (!schema) {
    return 'any';
  }
  
  if (schema.type === 'string') {
    return 'string';
  } else if (schema.type === 'number' || schema.type === 'integer') {
    return 'number';
  } else if (schema.type === 'boolean') {
    return 'boolean';
  } else if (schema.type === 'array') {
    const itemType = schema.items ? getTypeScriptType(schema.items) : 'any';
    return `${itemType}[]`;
  } else if (schema.type === 'object') {
    return 'Record<string, any>';
  } else if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    return refName;
  }
  return 'any';
}