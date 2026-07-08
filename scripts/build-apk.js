import { execSync } from 'child_process';
import { copyFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const androidDir = path.join(__dirname, '..', 'android');
const gradlew = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

execSync(`"${gradlew}" assembleDebug`, { cwd: androidDir, stdio: 'inherit', shell: true });

const apkDir = path.join(__dirname, '..', 'apk');
mkdirSync(apkDir, { recursive: true });
copyFileSync(
  path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
  path.join(apkDir, 'padelhub-debug.apk')
);

console.log('APK actualizado en apk/padelhub-debug.apk');
