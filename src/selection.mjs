export const selectionKey='nestcloud.configuration';
export const configurationIds=['512gb','1tb','backup'];
// An explicit URL always wins; invalid URLs deliberately fall back to 1 TB.
export function resolveConfigurationId(requested,saved){
 if(requested!==null)return configurationIds.includes(requested)?requested:'1tb';
 return configurationIds.includes(saved)?saved:'1tb';
}
