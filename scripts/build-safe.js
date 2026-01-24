import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('Starting safe build (no output to avoid stream errors)...');
try {
    execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'ignore' });
    console.log('Build completed successfully!');
} catch (error) {
    console.error('Build failed.');
    process.exit(1);
}
