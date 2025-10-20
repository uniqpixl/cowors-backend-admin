const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript files in src directory
const findTsFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findTsFiles(filePath));
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      results.push(filePath);
    }
  });
  
  return results;
};

// Uncomment Swagger decorators in a file
const uncommentSwaggerDecorators = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern to match commented Swagger decorators
    const patterns = [
      // Match multi-line commented @ApiProperty decorators
      /\/\/ (@ApiProperty(?:Optional)?\({[\s\S]*?\}\))/g,
      // Match single-line commented @ApiProperty decorators
      /\/\/ (@ApiProperty(?:Optional)?\([^\n]*\))/g
    ];
    
    patterns.forEach(pattern => {
      const newContent = content.replace(pattern, (match, decorator) => {
        modified = true;
        return decorator;
      });
      content = newContent;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
};

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files`);
console.log('Uncommenting Swagger decorators...');

let modifiedCount = 0;
tsFiles.forEach(file => {
  if (uncommentSwaggerDecorators(file)) {
    modifiedCount++;
  }
});

console.log(`\n🎉 Successfully processed ${modifiedCount} files`);
console.log('All Swagger decorators have been uncommented!');