#!/usr/bin/env node
/**
 * Batch fix og:title + og:description for all HTML pages
 * Reads existing <title> and <meta name="description"> to generate og tags
 */
const fs = require('fs');
const path = require('path');


const pagesDir = path.join(__dirname, '..', 'pages');
let fixed = 0, skipped = 0, errors = [];

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findHtmlFiles(full));
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

const files = findHtmlFiles(pagesDir);

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  
  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (!titleMatch) { skipped++; continue; }
  const title = titleMatch[1].trim();
  
  // Extract description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  const desc = descMatch ? descMatch[1].trim() : title;
  
  let changed = false;
  
  // Add og:title if missing
  if (!html.includes('og:title')) {
    html = html.replace('</title>', `</title>\n<meta property="og:title" content="${title}">`);
    changed = true;
  }
  
  // Add og:description if missing
  if (!html.includes('og:description')) {
    html = html.replace(/<meta property="og:title"[^>]+>/, 
      match => match + `\n<meta property="og:description" content="${desc}">`);
    changed = true;
  }
  
  // Add og:image if missing (use default)
  if (!html.includes('og:image')) {
    html = html.replace(/<meta property="og:description"[^>]+>/,
      match => match + `\n<meta property="og:image" content="https://l-s-c.github.io/devkit/og-image.png">`);
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, html);
    fixed++;
    console.log(`✅ ${path.relative(pagesDir, file)}`);
  } else {
    skipped++;
  }
}

console.log(`\nDone: ${fixed} fixed, ${skipped} skipped, ${files.length} total`);
