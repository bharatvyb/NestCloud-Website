import {useMemo,useSyncExternalStore} from 'react';
import {enquirySettings,loadPublicEnquirySettings,validEndpoint,type PublicEnquirySettings} from './enquiry';

// One request/refresh timer per endpoint, shared by every mounted consumer.
function settingsStore(endpoint:string) {
 let value:PublicEnquirySettings|null=null,controller:AbortController|null=null,timer:number|undefined;
 const listeners=new Set<()=>void>();
 const publish=(next:PublicEnquirySettings|null)=>{value=next;listeners.forEach(listener=>listener())};
 const refresh=()=>{
  controller?.abort();const request=new AbortController();controller=request;
  loadPublicEnquirySettings(endpoint,request.signal).then(next=>{if(!request.signal.aborted)publish(next)}).catch(()=>{if(!request.signal.aborted)publish(null)}).finally(()=>{if(controller===request)controller=null});
 };
 const resume=()=>{if(!controller)refresh()};
 return {getSnapshot:()=>value,subscribe(listener:()=>void){
  listeners.add(listener);
  if(listeners.size===1 && validEndpoint(endpoint)){refresh();timer=window.setInterval(refresh,60_000);window.addEventListener('pageshow',resume)}
  return()=>{listeners.delete(listener);if(!listeners.size){controller?.abort();controller=null;window.clearInterval(timer);window.removeEventListener('pageshow',resume);value=null}};
 }};
}
const stores=new Map<string,ReturnType<typeof settingsStore>>();
export function usePublicSettings(endpoint=enquirySettings.endpoint) {
 const store=useMemo(()=>{let store=stores.get(endpoint);if(!store){store=settingsStore(endpoint);stores.set(endpoint,store)}return store},[endpoint]);
 return useSyncExternalStore(store.subscribe,store.getSnapshot,()=>null);
}
