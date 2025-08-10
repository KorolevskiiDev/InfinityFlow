import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Read all type declaration files
const files = glob.sync('dist/**/*.d.ts');
let content = '';

// Combine all declarations into one file
for (const file of files) {
    if (file !== 'dist/index.d.ts') {
        content += fs.readFileSync(file, 'utf8') + '\n';
    }
}

// Write the combined declarations to index.d.ts
fs.writeFileSync('dist/index.d.ts', content);

// Clean up individual declaration files
for (const file of files) {
    if (file !== 'dist/index.d.ts') {
        fs.unlinkSync(file);
    }
}

// Remove empty directories
function removeEmptyDirectories(directory) {
    const files = fs.readdirSync(directory);
    let isEmpty = true;
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeEmptyDirectories(fullPath);
        } else {
            // If any file is not a .d.ts, directory is not empty
            if (!file.endsWith('.d.ts')) {
                isEmpty = false;
            }
        }
    }
    // After processing, check if directory only contains .d.ts files (which should be deleted already)
    const remaining = fs.readdirSync(directory);
    if (remaining.length === 0) {
        fs.rmdirSync(directory);
    }
}

// Start cleaning from dist directory
const typeDirs = glob.sync('dist/**/').filter(f => f !== 'dist/');
for (const dir of typeDirs) {
    try {
        removeEmptyDirectories(dir);
    } catch (e) {
    }
}
