#!/usr/bin/env node
'use strict';
// favicondl CLI - powered by https://favicondl.com/api/extract
const fs = require('fs');
const path = require('path');
const API = 'https://favicondl.com/api/extract';
const VERSION = require('../package.json').version;

const HELP = `favicondl v${VERSION} - download any website's favicon (https://favicondl.com)

Usage:
  npx favicondl <domain-or-url> [options]

Options:
  -s, --size <px>     Preferred size, 16-512 (default 128)
  -o, --output <file> Output file (default <domain>_favicon.<ext>)
  -j, --json          Print resolved icon metadata instead of downloading
  -h, --help          Show help
  -v, --version       Show version

Examples:
  npx favicondl github.com
  npx favicondl https://vercel.com --size 256 -o vercel.png
  npx favicondl stripe.com --json`;

function parse(argv) {
  const o = { size: 128 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => { if (i + 1 >= argv.length) fail(`Missing value for ${a}`); return argv[++i]; };
    if (a === '-h' || a === '--help') o.help = true;
    else if (a === '-v' || a === '--version') o.version = true;
    else if (a === '-j' || a === '--json') o.json = true;
    else if (a === '-s' || a === '--size') o.size = next();
    else if (a.startsWith('--size=')) o.size = a.slice(7);
    else if (a === '-o' || a === '--output') o.output = next();
    else if (a.startsWith('--output=')) o.output = a.slice(9);
    else if (a.startsWith('-')) fail(`Unknown option: ${a}`);
    else if (!o.domain) o.domain = a;
    else fail(`Unexpected argument: ${a}`);
  }
  return o;
}
function fail(msg, code = 2) { process.stderr.write(`favicondl: ${msg}\n`); process.exit(code); }

const EXT = { 'image/png': 'png', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico', 'image/svg+xml': 'svg',
  'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/avif': 'avif' };

async function main() {
  const o = parse(process.argv.slice(2));
  if (o.version) return console.log(VERSION);
  if (o.help || !o.domain) { console.log(HELP); if (!o.domain && !o.help) process.exit(2); return; }
  const size = Number(o.size);
  if (!Number.isInteger(size) || size < 16 || size > 512) fail('--size must be an integer from 16 to 512');
  const host = o.domain.replace(/^https?:\/\//i, '').split(/[/?#]/)[0];
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) fail(`Invalid domain or URL: ${o.domain}`);
  const u = new URL(API);
  u.searchParams.set('url', o.domain);
  u.searchParams.set('size', String(size));
  const ua = { 'user-agent': `favicondl-cli/${VERSION} (+https://favicondl.com)` };

  if (o.json) {
    u.searchParams.set('format', 'json');
    const r = await fetch(u, { headers: ua });
    if (!r.ok) fail(`API error ${r.status}: ${await r.text()}`, 1);
    return console.log(JSON.stringify(await r.json(), null, 2));
  }
  const r = await fetch(u, { headers: ua, redirect: 'follow' });
  if (!r.ok) fail(`Could not fetch favicon for ${host} (HTTP ${r.status})`, 1);
  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type && !type.startsWith('image/')) fail(`Unexpected response type: ${type}`, 1);
  const buf = Buffer.from(await r.arrayBuffer());
  if (!buf.length) fail('Empty response', 1);
  const safe = host.replace(/^www\./i, '').replace(/[^a-z0-9_-]/gi, '_');
  const out = o.output || `${safe}_favicon.${EXT[type] || 'png'}`;
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, buf);
  console.log(`Saved ${out} (${buf.length} bytes, ${type || 'unknown type'})`);
}
main().catch((e) => fail(e.message || String(e), 1));
