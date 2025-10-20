import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { z } from 'zod';
import * as _ from 'lodash';

export interface ZodClientGeneratorOptions {
  input: string;
  output: string;
  name: string;
  filter?: string;
  verbose?: boolean;
}

export async function generateZodClient(options: ZodClientGeneratorOptions): Promise<void> {
  const { input, output, name, filter, verbose } = options;

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

    // Filter endpoints if specified
    const filteredPaths = filterPaths(apiSpec.paths, filter);
    
    // Generate Zod schemas
    const zodSchemas = generateZodSchemas(apiSpec.components?.schemas || {});
    
    // Generate API client
    const clientCode = generateApiClient(name, filteredPaths, zodSchemas, apiSpec);
    
    // Write files
    const schemasPath = path.join(output, 'schemas.ts');
    const clientPath = path.join(output, 'client.ts');
    const indexPath = path.join(output, 'index.ts');

    await fs.writeFile(schemasPath, zodSchemas);
    await fs.writeFile(clientPath, clientCode);
    await fs.writeFile(indexPath, generateIndexFile(name));

    if (verbose) {
      console.log(`📦 Generated Zod schemas: ${schemasPath}`);
      console.log(`🔌 Generated API client: ${clientPath}`);
      console.log(`📋 Generated index: ${indexPath}`);
    }

  } catch (error) {
    throw new Error(`Zod client generation failed: ${error}`);
  }
}

function filterPaths(paths: Record<string, any>, filter?: string): Record<string, any> {
  if (!filter) return paths;

  const filtered: Record<string, any> = {};
  
  for (const [path, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (operation && typeof operation === 'object' && 'tags' in operation && Array.isArray(operation.tags)) {
        const tags = operation.tags as string[];
        if (tags.some((tag: string) => tag.toLowerCase().includes(filter.toLowerCase()))) {
          if (!filtered[path]) filtered[path] = {};
          filtered[path][method] = operation;
        }
      }
    }
  }
  
  return filtered;
}

function generateZodSchemas(schemas: Record<string, any>): string {
  const lines: string[] = [
    "import { z } from 'zod';",
    '',
    '// Auto-generated Zod schemas from OpenAPI specification',
    '// Do not edit manually',
    '',
  ];

  // Generate enum schemas first
  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.enum) {
      lines.push(generateZodEnum(name, schema));
    }
  }

  // Generate object schemas
  for (const [name, schema] of Object.entries(schemas)) {
    if (!schema.enum) {
      lines.push(generateZodSchema(name, schema));
    }
  }

  // Export all schemas
  const schemaNames = Object.keys(schemas).map(name => 
    `  ${name}Schema,\n  ${name}: ${name}Schema,`
  ).join('\n');

  lines.push(`
export const schemas = {
${schemaNames}
};

export type Schemas = typeof schemas;
`);

  return lines.join('\n');
}

function generateZodEnum(name: string, schema: any): string {
  const values = schema.enum.map((val: any) => JSON.stringify(val)).join(', ');
  return `
export const ${name}Schema = z.enum([${values}]);
export type ${name} = z.infer<typeof ${name}Schema>;
`;
}

function generateZodSchema(name: string, schema: any): string {
  if (!schema) {
    return `
export const ${name}Schema = z.any(); // Schema is undefined
export type ${name} = z.infer<typeof ${name}Schema>;
`;
  }
  
  if (schema.type === 'object' && schema.properties) {
    const properties = Object.entries(schema.properties as Record<string, any>)
      .map(([propName, propSchema]) => {
        if (!propSchema) {
          return `  ${propName}: z.any().optional(),`;
        }
        const zodType = getZodType(propSchema as any);
        const optional = schema.required?.includes(propName) ? '' : '.optional()';
        return `  ${propName}: ${zodType}${optional},`;
      })
      .join('\n');

    return `
export const ${name}Schema = z.object({
${properties}
});
export type ${name} = z.infer<typeof ${name}Schema>;
`;
  }

  return `
export const ${name}Schema = z.any(); // Complex schema not fully supported yet
export type ${name} = z.infer<typeof ${name}Schema>;
`;
}

function getZodType(schema: any): string {
  if (!schema) {
    return 'z.any()';
  }
  
  if (schema.type === 'string') {
    if (schema.format === 'date-time') return 'z.string().datetime()';
    if (schema.format === 'date') return 'z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)';
    if (schema.format === 'email') return 'z.string().email()';
    if (schema.format === 'uuid') return 'z.string().uuid()';
    return 'z.string()';
  } else if (schema.type === 'number') {
    return 'z.number()';
  } else if (schema.type === 'integer') {
    return 'z.number().int()';
  } else if (schema.type === 'boolean') {
    return 'z.boolean()';
  } else if (schema.type === 'array') {
    const itemType = schema.items ? getZodType(schema.items) : 'z.any()';
    return `z.array(${itemType})`;
  } else if (schema.type === 'object') {
    return 'z.record(z.any())';
  } else if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    return `${refName}Schema`;
  }
  return 'z.any()';
}

function generateApiClient(name: string, paths: Record<string, any>, zodSchemas: string, apiSpec: any): string {
  const endpoints = generateEndpoints(paths);
  
  return `import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { schemas } from './schemas';

export interface ${name}Config {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class ${name} {
  private client: AxiosInstance;

  constructor(config: ${name}Config) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      timeout: config.timeout || 30000,
    });

    // Request interceptor for auth tokens
    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = \`Bearer \${token}\`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // Override this method to provide authentication token
    return null;
  }

  // API Endpoints
${endpoints}
}

export default ${name};
`;
}

function generateEndpoints(paths: Record<string, any>): string {
  const endpoints: string[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (operation && typeof operation === 'object' && 'operationId' in operation) {
        const endpoint = generateEndpoint(path, method, operation as any);
        endpoints.push(endpoint);
      }
    }
  }

  return endpoints.join('\n\n');
}

function generateEndpoint(path: string, method: string, operation: any): string {
  const methodName = operation.operationId || _.camelCase(`${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`);
  const pathParams = extractPathParams(path);
  const queryParams = operation.parameters?.filter((p: any) => p.in === 'query') || [];
  const bodyParam = operation.requestBody;

  let params = '';
  let pathParamsStr = '';
  let queryParamsStr = '';
  let bodyStr = '';

  // Path parameters
  if (pathParams.length > 0) {
    pathParamsStr = pathParams.map(p => `${p}: string`).join(', ');
    params += pathParamsStr;
  }

  // Query parameters
  if (queryParams.length > 0) {
    const queryType = queryParams.map((p: any) => 
      `${p.name}${p.required ? '' : '?'}: ${getTypeFromParam(p)}`
    ).join('; ');
    queryParamsStr = `query?: { ${queryType} }`;
    if (params) params += ', ';
    params += queryParamsStr;
  }

  // Body parameter
  if (bodyParam) {
    bodyStr = 'data: any';
    if (params) params += ', ';
    params += bodyStr;
  }

  // Request config
  if (params) params += ', ';
  params += 'config?: AxiosRequestConfig';

  const pathWithParams = path.replace(/{([^}]+)}/g, '${$1}');

  return `  async ${methodName}(${params}): Promise<AxiosResponse<any>> {
    return this.client.${method}(\`${pathWithParams}\`${bodyParam ? ', data' : ''}${queryParams.length > 0 ? ', { ...config, params: query }' : ', config'});
  }`;
}

function extractPathParams(path: string): string[] {
  const matches = path.match(/{([^}]+)}/g);
  return matches ? matches.map(m => m.slice(1, -1)) : [];
}

function getTypeFromParam(param: any): string {
  if (param.schema?.type === 'string') return 'string';
  if (param.schema?.type === 'number' || param.schema?.type === 'integer') return 'number';
  if (param.schema?.type === 'boolean') return 'boolean';
  return 'any';
}

function generateIndexFile(name: string): string {
  return `export { ${name}, type ${name}Config } from './client';
export { schemas } from './schemas';
export * from './schemas';
export * from './types';
`;
}