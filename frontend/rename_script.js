const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('C:\\Users\\soumy\\OneDrive\\Desktop\\AI-Powered_Marketplace\\frontend');
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    if (content.includes('CraftHub')) {
        content = content.replace(/CraftHub/g, 'KalaSetu');
        changed = true;
    }
    
    if (content.includes('Artisan Marketplace')) {
        content = content.replace(/Artisan Marketplace/g, 'KalaSetu');
        changed = true;
    }
    
    if (content.includes('<h3 className="text-2xl font-bold text-primary">Artisan</h3>')) {
        content = content.replace(/<h3 className="text-2xl font-bold text-primary">Artisan<\/h3>/g, '<h3 className="text-2xl font-bold text-primary">KalaSetu</h3>');
        changed = true;
    }

    if (content.includes('<span className="navbar-logo-text">Artisan</span>')) {
        content = content.replace(/<span className="navbar-logo-text">Artisan<\/span>/g, '<span className="navbar-logo-text">KalaSetu</span>');
        changed = true;
    }
    
    // Check for "title: 'Artisan Marketplace'," -> already handled by Artisan Marketplace check above, wait let's be sure.
    // Replace "artisan marketplace" lowercase if there are any comments
    if (content.includes('artisan marketplace')) {
        content = content.replace(/artisan marketplace/g, 'KalaSetu');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        count++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Updated ${count} files.`);
