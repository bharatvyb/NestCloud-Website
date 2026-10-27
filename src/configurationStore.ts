import { configs, Configuration } from './config';
import { resolveConfigurationId, selectionKey } from './selection.mjs';

// One store per document: every mounted control reads the same browser state.
const listeners = new Set<() => void>();
let memory: string | null = null;
let stopObserving: (() => void) | undefined;

function readSaved(): string | null {
 try { return window.sessionStorage.getItem(selectionKey) ?? memory; }
 catch { return memory; }
}
export function getConfigurationSnapshot(): Configuration {
 const requested = new URLSearchParams(window.location.search).get('configuration');
 const id = resolveConfigurationId(requested, readSaved());
 return configs.find(config => config.id === id) ?? configs[1];
}
function save(value: Configuration) {
 memory = value.id;
 try { window.sessionStorage.setItem(selectionKey, value.id); }
 catch { /* Optional preference. URL and in-document synchronization still work. */ }
}
function emit() { listeners.forEach(listener => listener()); }

// Bypass our observer for internal writes. Preserve state owned by other callers.
let replace: History['replaceState'] | undefined;
function reconcile() {
 const value = getConfigurationSnapshot();
 save(value);
 const url = new URL(window.location.href);
 if (url.searchParams.get('configuration') !== value.id) {
  url.searchParams.set('configuration', value.id);
  (replace ?? window.history.replaceState).call(window.history, window.history.state, '', url);
 }
 emit();
}
export function selectConfiguration(value: Configuration) {
 save(value);
 const url = new URL(window.location.href);
 url.searchParams.set('configuration', value.id);
 (replace ?? window.history.replaceState).call(window.history, window.history.state, '', url);
 emit();
}
export function subscribeConfiguration(listener: () => void) {
 listeners.add(listener);
 if (!stopObserving) {
  const history = window.history;
  const originalPush = history.pushState;
  const originalReplace = history.replaceState;
  replace = originalReplace;
  // Native pushState/replaceState do not dispatch popstate. Observe them while
  // controls are mounted so client navigation cannot leave a stale selection.
  const push: History['pushState'] = function(this: History, ...args) { originalPush.apply(this, args); reconcile(); };
  const update: History['replaceState'] = function(this: History, ...args) { originalReplace.apply(this, args); reconcile(); };
  history.pushState = push;
  history.replaceState = update;
  const storage = (event: StorageEvent) => { if (event.key === selectionKey || event.key === null) reconcile(); };
  window.addEventListener('popstate', reconcile);
  window.addEventListener('storage', storage);
  stopObserving = () => {
   window.removeEventListener('popstate', reconcile);
   window.removeEventListener('storage', storage);
   if (history.pushState === push) history.pushState = originalPush;
   if (history.replaceState === update) history.replaceState = originalReplace;
   replace = undefined;
  };
 }
 reconcile();
 return () => {
  listeners.delete(listener);
  if (listeners.size === 0) { stopObserving?.(); stopObserving = undefined; }
 };
}
