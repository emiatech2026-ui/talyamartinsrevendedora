const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  
  // Replace array literals containing O Boticário and Eudora
  content = content.replace(/\['O Boticário', 'Eudora'\]/g, "['O Boticário', 'Eudora', 'Natura']");
  
  // Also string matches
  content = content.replace(/'O Boticário', 'Eudora'/g, "'O Boticário', 'Eudora', 'Natura'");
  content = content.replace(/'O Boticário e Eudora'/g, "'O Boticário, Eudora e Natura'");
  
  // Add Natura to switch/cases or ternary checks related to Eudora
  // e.g. brand.name.toLowerCase().includes('eudora')
  content = content.replace(/(isEudora = [^;]+;)/g, "$1\n  const isNatura = $1.replace('eudora', 'natura');");
  
  // Hardcoded defaults for Eudora being duplicated for Natura
  // This is tricky, let's just do it directly.
  content = content.replace(/\{ name: 'Eudora', commission:([^}]+)\}/g, "{ name: 'Eudora', commission:$1}, { name: 'Natura', commission:$1}");
  
  // Replace "O Boticário   Eudora" with "O Boticário   Eudora   Natura"
  content = content.replace(/'O Boticário   Eudora'/g, "'O Boticário   Eudora   Natura'");
  
  if(content !== original) {
    fs.writeFileSync(f, content, 'utf8');
  }
});
