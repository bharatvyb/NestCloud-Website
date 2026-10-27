import { useEffect, useState } from 'react';
import { configs, Configuration } from './config';
import { resolveConfigurationId, selectionKey } from './selection.mjs';
const find=(id:string)=>configs.find(c=>c.id===id)??configs[1];
function readSelection(){
 let saved:string|null=null;
 try{saved=sessionStorage.getItem(selectionKey)}catch{/* Storage can be blocked; URL selection still works. */}
 return find(resolveConfigurationId(new URLSearchParams(location.search).get('configuration'),saved));
}
export function useConfiguration():[Configuration,(value:Configuration)=>void]{
 const [selected,setSelected]=useState<Configuration>(readSelection);
 useEffect(()=>{const restore=()=>setSelected(readSelection());window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore)},[]);
 useEffect(()=>{try{sessionStorage.setItem(selectionKey,selected.id)}catch{/* Session preferences are optional. */}},[selected]);
 const select=(value:Configuration)=>{
  setSelected(value);
  try{sessionStorage.setItem(selectionKey,value.id)}catch{/* Keep the control functional without browser storage. */}
  const url=new URL(location.href);url.searchParams.set('configuration',value.id);history.replaceState(null,'',url);
 };
 return [selected,select];
}
