import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { Extract } from 'unzipper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEONAMES_URL = 'https://download.geonames.org/export/dump/cities500.zip';
const DATA_DIR = path.join(__dirname, '../../data');

async function downloadAndExtract(url: string, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response
        .pipe(Extract({ path: outputDir }))
        .on('close', resolve)
        .on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    console.log('Downloading and extracting cities data...');
    await downloadAndExtract(GEONAMES_URL, DATA_DIR);
    
    // Rename the extracted file
    const extractedFile = path.join(DATA_DIR, 'cities500.txt');
    const targetFile = path.join(DATA_DIR, 'cities.txt');
    
    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
    }
    fs.renameSync(extractedFile, targetFile);
    
    console.log('Cities data downloaded and extracted successfully');
    
  } catch (error) {
    console.error('Error downloading cities data:', error);
    process.exit(1);
  }
}

main(); 