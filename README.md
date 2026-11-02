# Eduardo's website

Personal blog, activities tracker, travelling goals, resume and portfolio.

## Dev

```bash
bun install
bun dev
```

## Build

```bash
bun run build
```

## Tests

```bash
bun run test        # unit tests in tests/ (data, renderer, workers), pinned to a time zone west of UTC
bun run test:e2e    # playwright in e2e/, builds the site and serves out/ on port 3103
bun run test:all    # both
```

The first e2e run needs a browser: `bunx playwright install chromium`. Run one project with `bun run test:e2e --project=desktop` (or `mobile`).

## Stack

- Next.js 16 (App Router, static export)
- React 19, TypeScript 5
- Tailwind CSS v4
- Bun
- three.js + three-globe
- Matter.js
- Cloudflare Workers
- GitHub Page/Actions

## Credits

Food icons in `public/images/food/` are [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) by Microsoft, MIT licensed.
