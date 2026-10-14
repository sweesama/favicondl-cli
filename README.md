# favicondl

Download any website's favicon from your terminal. Powered by **[FaviconDL](https://favicondl.com)**, a free favicon downloader.

```bash
npx favicondl github.com
```

## Usage

```bash
npx favicondl <domain-or-url> [options]

  -s, --size <px>      Preferred size, 16-512 (default 128)
  -o, --output <file>  Output file (default <domain>_favicon.<ext>)
  -j, --json           Print resolved icon metadata (icon URL, source) instead of downloading
  -h, --help           Show help
  -v, --version        Show version
```

Examples:

```bash
npx favicondl https://vercel.com --size 256 -o vercel.png
npx favicondl stripe.com --json
```

Install globally: `npm i -g favicondl`. Requires Node.js 18+, no dependencies.

## How it works

The CLI calls the public FaviconDL API, `GET https://favicondl.com/api/extract?url=<domain>&size=<px>`, which finds the best icon (HTML, web manifest, `/favicon.ico`, with fallbacks) and returns the image. The size is a preference; the site's original asset may have a different native size. See the [API docs](https://favicondl.com/documentation.html).

Need bulk downloads or a browser UI? Use [favicondl.com](https://favicondl.com).

## License

MIT
