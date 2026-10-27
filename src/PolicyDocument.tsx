import React, { useEffect } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronDown, FileText } from 'lucide-react';
import documents from './policies.json';
import { policyLinks } from './content';
import { sitePath } from './site';
import './policies.css';

export default function PolicyDocument({path}:{path:string}) {
 useEffect(()=>{const id=window.location.hash.slice(1);if(id)document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'})},[]);
 const policy=documents.find(document=>document.path===path)!;
 const headings=policy.blocks.filter(block=>block.type==='heading');
 const contents=<ol>{headings.map(block=><li key={block.id}><a href={`#${block.id}`}>{block.text}</a></li>)}</ol>;
 return <>
  <section className="policy-hero"><div className="container">
   <a className="text-link" href={sitePath('/policies')}><ArrowLeft size={16}/> All policies & purchase information</a>
   <p className="eyebrow">HELPFUL DETAILS</p><h1>{policy.title}</h1>
   <div className="policy-meta"><span><FileText size={16}/>{policy.updated}</span><a href={policy.sourceUrl} target="_blank" rel="noreferrer">View original document <ArrowUpRight size={14}/></a></div>
  </div></section>
  <div className="container policy-layout">
   <aside className="policy-sidebar"><nav aria-label="Policy sections"><h2>On this page</h2>{contents}</nav><p>Copied from the official NestCloud document. Its original wording and update date are retained.</p></aside>
   <div className="policy-main"><details className="policy-mobile-contents"><summary>On this page <ChevronDown size={16}/></summary><nav aria-label="Policy sections on mobile">{contents}</nav></details>
    <article className="policy-document" aria-label={policy.title} data-policy-body>
     {policy.blocks.map((block,index)=>block.type==='heading'?<h2 id={block.id} key={index}>{block.text}</h2>:block.type==='list'?(block.ordered?<ol key={index}>{block.items?.map((text,i)=><li key={i}>{text}</li>)}</ol>:<ul key={index}>{block.items?.map((text,i)=><li key={i}>{text}</li>)}</ul>):<p key={index}>{block.links?.length?block.links.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.text}</a>):block.text}</p>)}
    </article>
    <div className="policy-site-note"><strong>Purchasing on this website</strong><p>This development website does not collect payments, place orders or create reservations. The policy text above is reproduced from nestcloud.in.</p></div>
    <nav className="policy-related" aria-label="Related policies"><h2>Other helpful details</h2><div>{policyLinks.filter(link=>link.href!==path).map(link=><a href={sitePath(link.href)} key={link.href}>{link.label}<ArrowUpRight size={14}/></a>)}</div></nav>
   </div>
  </div>
 </>;
}
