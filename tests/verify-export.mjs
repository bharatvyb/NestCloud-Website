import {readFile,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const routes=JSON.parse(await readFile('src/routes.json','utf8'));
const origin='https://bharatvyb.github.io/NestCloud-Website/';
const prefix='/NestCloud-Website/';
const sitemap=await readFile('dist/sitemap.xml','utf8');
for(const route of routes){
 const html=await readFile(path.join('dist',route.path.slice(1),'index.html'),'utf8');
 const canonical=origin+(route.path==='/'?'':route.path.slice(1)+'/');
 assert.ok(html.includes(`<title>${route.title.replaceAll('&','&amp;')}</title>`),`title ${route.path}`);
 for(const tag of [`rel="canonical" href="${canonical}"`,`property="og:url" content="${canonical}"`])assert.ok(html.includes(tag),`${tag} on ${route.path}`);
 assert.match(html,/<meta name="description" content="[^"]+"/);
 assert.match(html,/<meta property="og:image" content="https:\/\/bharatvyb.github.io\/NestCloud-Website\//);
 for(const m of html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:[?#][^"]*)?"/g)){
  assert.ok(m[1].startsWith(prefix),`base path ${m[1]}`);
  assert.ok((await stat(path.join('dist',m[1].slice(prefix.length)))).isFile(),`asset ${m[1]}`);
 }
 if(route.path==='/order'){assert.match(html,/noindex,follow/);assert.ok(!sitemap.includes(`${origin}order/`))}
 else assert.ok(sitemap.includes(canonical),`sitemap ${canonical}`);
}
await stat('dist/.nojekyll');await stat('dist/404.html');
assert.ok((await readFile('dist/robots.txt','utf8')).includes(origin+'sitemap.xml'));
console.log(`Verified metadata, assets, base path, sitemap and order noindex for ${routes.length} pages.`);
