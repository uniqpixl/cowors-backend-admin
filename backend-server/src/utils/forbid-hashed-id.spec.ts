import fs from 'fs';
import path from 'path';

// This test enforces the rule: avoid hashed IDs throughout the project.
// It fails if any hashed ID generation patterns appear in runtime source.
// Allowed areas: migrations, tests, coverage, dist, tmp, tools (not part of runtime app code).

function listFilesRecursive(dir: string, ignoreDirs: string[]): string[] {
  const results: string[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoreDirs.some((ig) => fullPath.includes(ig))) continue;
      results.push(...listFilesRecursive(fullPath, ignoreDirs));
    } else if (entry.isFile()) {
      // Only check source-like files
      if (/(\.ts|\.tsx|\.js|\.jsx)$/i.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

describe('No hashed ID generation in runtime code', () => {
  it('should not contain hashed ID patterns in src', () => {
    const srcRoot = path.join(__dirname, '..');
    const ignore = [
      path.sep + 'database' + path.sep + 'migrations',
      path.sep + 'coverage',
      path.sep + 'test',
      path.sep + 'dist',
      path.sep + 'tmp',
      path.sep + 'tools',
      path.sep + 'worker',
      path.sep + 'scripts',
      path.sep + 'generated',
    ];

    const files = listFilesRecursive(srcRoot, ignore);
    const forbiddenPatterns: RegExp[] = [
      /toCoworsId\s*\(/, // direct hashed ID utility usage
      /from\s+['"]\.?\/?src\/(?:.*\/)?cowors-id\.util['"]/i, // importing the removed util
      /require\(.*cowors-id\.util.*\)/i, // CommonJS import of removed util
    ];

    const violations: {
      file: string;
      pattern: RegExp;
      line: number;
      content: string;
    }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(lines[i])) {
            violations.push({ file, pattern, line: i + 1, content: lines[i] });
          }
        }
      }
    }

    if (violations.length > 0) {
      const formatted = violations
        .map(
          (v) =>
            `${v.file}:${v.line} - matched ${v.pattern} -> ${v.content.trim()}`,
        )
        .join('\n');
      throw new Error(
        'Hashed ID usage detected in runtime code:\n' + formatted,
      );
    }
  });
});