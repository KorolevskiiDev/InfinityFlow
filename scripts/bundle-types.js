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

    if (files.length > 0) {
        files.forEach(file => {
            const fullPath = path.join(directory, file);
            if (fs.statSync(fullPath).isDirectory()) {
                removeEmptyDirectories(fullPath);
            }
        });

        // Check again after processing subdirectories
        if (fs.readdirSync(directory).length === 0) {
            fs.rmdirSync(directory);
        }
    } else {
        fs.rmdirSync(directory);
    }
}

// Start cleaning from dist directory
const typeDirs = glob.sync('dist/**/').filter(f => f !== 'dist/');
for (const dir of typeDirs) {
    try {
        removeEmptyDirectories(dir);
    } catch (e) {
        // Ignore errors
    }
}
