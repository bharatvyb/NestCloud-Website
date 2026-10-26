import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const routes=JSON.parse(await readFile('src/routes.json','utf8'));
const template=await readFile('dist/index.html','utf8');
const siteURL=new URL(process.env.SITE_URL||'https://bharatvyb.github.io/NestCloud-Website/');
if(!siteURL.pathname.endsWith('/'))siteURL.pathname+='/';
const pageURL=route=>new URL(route==='/'?'':route.replace(/^\//,'')+'/',siteURL).href;
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const route of routes){const absolute=pageURL(route.path);let html=template.replace(/<title>.*?<\/title>/,`<title>${escape(route.title)}</title>`).replace(/(<meta name="description" content=")[^"]*("\/>)/,`$1${escape(route.description)}$2`).replace(/(<meta property="og:title" content=")[^"]*("\/>)/,`$1${escape(route.title)}$2`).replace(/(<meta property="og:description" content=")[^"]*("\/>)/,`$1${escape(route.description)}$2`).replace(/(<meta property="og:url" content=")[^"]*("\/>)/,`$1${absolute}$2`).replace(/(<link rel="canonical" href=")[^"]*("\/>)/,`$1${absolute}$2`);if(route.path==='/order')html=html.replace('</head>','<meta name="robots" content="noindex,follow"/></head>');const directory=path.join('dist',route.path.slice(1));await mkdir(directory,{recursive:true});await writeFile(path.join(directory,'index.html'),html);}
const urls=routes.filter(r=>r.path!=='/order').map(r=>`<url><loc>${pageURL(r.path)}</loc></url>`).join('');await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml',siteURL).href}\n`);await writeFile('dist/.nojekyll','');await writeFile('dist/404.html',template);console.log(`Exported ${routes.length} pages for ${siteURL.href}`);
