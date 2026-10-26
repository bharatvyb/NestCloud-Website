# NestCloud website

React + TypeScript + Vite with Tailwind and shared CSS design tokens. Source product photography and the supplied logo are retained alongside the approved cutout and illustrative home-setting asset.

## Develop and build
npm install
npm run dev
npm run build
npm run preview

The build exports nine static entry pages with per-page metadata and a sitemap. Pricing and navigation are in src/config.ts; specifications, availability, software features, FAQs and troubleshooting are in src/content.ts. Routes and metadata are in src/routes.json. Shared homepage components are in src/Home.tsx; expanded pages are in src/Pages.tsx.

The site uses one NestCloud Family product with three storage configurations. The order preparation page carries the selected configuration but never collects payment or submits an order. See CONTENT-MIGRATION.md for sources and content decisions.
