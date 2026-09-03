/**
 * Money-Honey Automatic Local APK Synchronizer
 * Downloads the latest compiled release APK from GitHub Releases directly to the local project folder.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const REPO_OWNER = 'Rashedzz';
const REPO_NAME = 'money-honey';
const LOCAL_APK_NAME = 'Money-Honey.apk';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TARGET_PATH = path.join(PROJECT_ROOT, LOCAL_APK_NAME);
const APK_DIR_PATH = path.join(PROJECT_ROOT, 'apk');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Money-Honey-APK-Sync',
        Accept: 'application/vnd.github.v3+json',
      },
    };

    https.get(url, options, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(
      url,
      { headers: { 'User-Agent': 'Money-Honey-APK-Sync' } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download APK: HTTP status ${res.statusCode}`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        const fileStream = fs.createWriteStream(destPath);

        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
            const mb = (downloadedBytes / (1024 * 1024)).toFixed(1);
            const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
            process.stdout.write(`\rDownloading Money-Honey.apk: ${mb}MB / ${totalMb}MB (${pct}%)`);
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log('\n[SUCCESS] Download completed successfully!');
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }
    );

    req.on('error', reject);
  });
}

async function main() {
  console.log('====================================================');
  console.log('  MONEY-HONEY AUTOMATIC LOCAL APK SYNC');
  console.log('====================================================');
  console.log(`Checking latest APK release from ${REPO_OWNER}/${REPO_NAME}...`);

  try {
    const releases = await fetchJson(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`
    );

    if (!Array.isArray(releases) || releases.length === 0) {
      throw new Error('No releases found in the repository.');
    }

    const latestRelease = releases[0];
    console.log(`Found Release: ${latestRelease.name || latestRelease.tag_name}`);

    // Look for .apk asset
    const apkAsset = (latestRelease.assets || []).find((a) =>
      a.name.toLowerCase().endsWith('.apk')
    );

    if (!apkAsset) {
      throw new Error(
        `No APK asset found in release ${latestRelease.tag_name}. Build may still be compiling on GitHub Actions.`
      );
    }

    console.log(`Found APK Asset: ${apkAsset.name} (${(apkAsset.size / (1024 * 1024)).toFixed(1)} MB)`);
    console.log(`Saving to: ${TARGET_PATH}`);

    // Create apk/ directory if not exists
    if (!fs.existsSync(APK_DIR_PATH)) {
      fs.mkdirSync(APK_DIR_PATH, { recursive: true });
    }

    // Download to main project folder
    await downloadFile(apkAsset.browser_download_url, TARGET_PATH);

    // Also copy to apk/ folder
    const apkSubfolderPath = path.join(APK_DIR_PATH, LOCAL_APK_NAME);
    fs.copyFileSync(TARGET_PATH, apkSubfolderPath);

    console.log('\n----------------------------------------------------');
    console.log('  LOCAL APK READY FOR USE!');
    console.log(`  File Location 1: ${TARGET_PATH}`);
    console.log(`  File Location 2: ${apkSubfolderPath}`);
    console.log('  You can now drag & drop this file to Google Drive');
    console.log('  or transfer directly to any Android phone to install.');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('\n[ERROR] Sync failed:', err.message);
    process.exit(1);
  }
}

main();
