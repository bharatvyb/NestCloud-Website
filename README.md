# NestCloud Website

The NestCloud Family marketing website, built with React, TypeScript, Vite, Tailwind CSS and Lucide icons.

## Run locally

Requires Node.js 20.19+ or a compatible newer release and npm.

```sh
npm ci
npm run dev
```

## Build and preview

```sh
npm run build
npm run preview
```

The production build is written to `dist/`. The build exports nine page entry points, page-specific SEO metadata and a sitemap.

## Website pages

Home, NestCloud Family, NestCloud OS, Why NestCloud, How It Works, Backup Plus, Support, Order preparation, and Policies.

## Product configurations

One product: **NestCloud Family**.

| Storage configuration | One-time product price |
| --- | ---: |
| 512 GB | ₹49,900 |
| 1 TB | ₹59,900 |
| 1 TB + 1 TB Backup Plus | ₹81,900 |

Backup Plus provides **1 TB usable storage**, with a separate physical 1 TB SSD dedicated to backup protection. The same core software features are included across all configurations. Family Box Office and storage expansion are clearly identified as planned features.

## Source organization

- `src/config.ts`: storage configurations, pricing and navigation.
- `src/content.ts`: specifications, feature availability, FAQs and troubleshooting.
- `src/routes.json`: routes and page metadata.
- `src/Home.tsx`: shared homepage components.
- `src/Pages.tsx`: product, software, support and other pages.
- `src/brand.tsx`: reusable official-logo component and asset selection.
- `public/brand/nestcloud/`: eight unmodified supplied logo variants, descriptive filenames, checksums and usage guide.
- `scripts/export-pages.mjs`: static page and sitemap generation.
- `CONTENT-MIGRATION.md`: live-site sources, content decisions and remaining launch dependencies.

## Payments and launch readiness

The order preparation page preserves the selected configuration and updates its price and description. **Payments, order submission and reservation collection are not enabled.** Razorpay credentials, an approved order flow, current availability, final taxes, shipping and applicable purchase terms must be confirmed before payment collection.

## Validation

The latest source passes TypeScript validation and the production build. Browser validation covered all nine pages at phone, tablet and desktop widths; storage-to-order transfer; pricing updates; FAQ search and filters; troubleshooting; navigation anchors; and official brand assets.

## Sites hosting

The existing private Sites deployment is [NestCloud](https://nestcloud-family-home.sharpisle1026.chatgpt.site/). `.openai/hosting.json` retains its Site identity and static-output configuration; it contains no payment or GitHub credentials. This repository is a source backup and does not enable automatic GitHub-to-Sites deployment.

Built by BharatVyb AI Solutions. Operated under Shreenvitha Enterprises, India.
