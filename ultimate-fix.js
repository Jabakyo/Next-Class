const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Remove any line that contains lucide-react or sonner import
    const lines = content.split('\n');
    const cleanLines = lines.filter(line => {
      // Remove any line that imports from lucide-react or sonner
      if (line.includes('from "lucide-react"') || line.includes("from 'lucide-react'")) {
        console.log(`Removing lucide-react import: ${line.trim()}`);
        return false;
      }
      if (line.includes('from "sonner"') || line.includes("from 'sonner'")) {
        console.log(`Removing sonner import: ${line.trim()}`);
        return false;
      }
      // Also remove multi-line imports
      if (line.includes('lucide-react') || line.includes('sonner')) {
        console.log(`Removing line with lucide-react/sonner: ${line.trim()}`);
        return false;
      }
      return true;
    });
    
    content = cleanLines.join('\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    let processedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        processedCount += walkDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        if (processFile(filePath)) {
          processedCount++;
        }
      }
    });
    
    return processedCount;
  } catch (error) {
    console.log(`Error reading directory ${dir}:`, error.message);
    return 0;
  }
}

console.log('🧹 ULTIMATE CLEAN: Physically removing ALL lucide-react and sonner imports...');

let totalProcessed = 0;
totalProcessed += walkDirectory('./app');
totalProcessed += walkDirectory('./components');
totalProcessed += walkDirectory('./lib');

console.log(`\n🎉 ULTIMATE CLEAN COMPLETE! Processed ${totalProcessed} files.`);

// Also verify no imports remain
console.log('\n🔍 Verifying no imports remain...');
const result = require('child_process').execSync('grep -r "from.*lucide-react\\|from.*sonner" . --include="*.tsx" --include="*.ts" || echo "No imports found!"', {encoding: 'utf8'});
console.log(result);