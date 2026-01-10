import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const ANDROID_ASSETS_DIR = path.join(PROJECT_ROOT, 'android_app/app/src/main/assets');

console.log('🚀 Starting Mobile Build Process...');

// 1. Build Web Project
console.log('📦 Building Web Project...');
try {
    execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'inherit' });
} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
}

// 2. Prepare Android Assets Directory
console.log('🧹 Preparing Android Assets...');
if (fs.existsSync(ANDROID_ASSETS_DIR)) {
    fs.rmSync(ANDROID_ASSETS_DIR, { recursive: true, force: true });
}
fs.mkdirSync(ANDROID_ASSETS_DIR, { recursive: true });

// 3. Copy Assets
console.log('📂 Copying Assets to Android Project...');
function copyRecursive(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

try {
    copyRecursive(DIST_DIR, ANDROID_ASSETS_DIR);
    console.log('✅ Assets copied successfully!');
} catch (error) {
    console.error('❌ Failed to copy assets:', error);
    process.exit(1);
}

console.log('🎉 Mobile Update Ready! Open Android Studio and build APK.');
