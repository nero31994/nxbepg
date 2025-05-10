// merge-epg.js
import { gunzip } from 'zlib';
import { promisify } from 'util';
import { writeFileSync } from 'fs';
import fetch from 'node-fetch';

const gunzipAsync = promisify(gunzip);

const epgUrls = [
  "https://github.com/atone77721/CIGNAL_EPG/raw/refs/heads/main/merged_epg.xml.gz",
  "https://raw.githubusercontent.com/atone77721/CIGNAL_EPG/refs/heads/main/merged_epg.xml",
  "https://raw.githubusercontent.com/atone77721/CIGNAL_EPG/refs/heads/main/sky_epg.xml",
  "https://github.com/atone77721/CIGNAL_EPG/raw/refs/heads/main/sky_epg.xml.gz"
];

async function mergeEPGs() {
  const xmlParts = [];

  for (const url of epgUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let content;

      if (url.endsWith('.gz')) {
        content = await gunzipAsync(buffer);
        xmlParts.push(content.toString('utf-8'));
      } else {
        xmlParts.push(buffer.toString('utf-8'));
      }
    } catch (err) {
      console.warn(`Failed: ${url}`, err.message);
      continue;
    }
  }

  if (xmlParts.length === 0) throw new Error("No valid EPGs merged");

  let merged = '<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n';
  for (const xml of xmlParts) {
    const content = xml
      .replace(/<\?xml[^>]*\?>/, '')
      .replace(/<\/?tv>/g, '')
      .trim();
    merged += content + '\n';
  }
  merged += '</tv>';

  writeFileSync('public/merged_epg.xml', merged);
  console.log('Merged EPG saved to public/merged_epg.xml');
}

mergeEPGs().catch(err => {
  console.error("Error merging EPGs:", err);
  process.exit(1);
});
