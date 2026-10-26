/** Resolve internal routes and assets for root hosting or a repository subfolder. */
export const siteBase = import.meta.env.BASE_URL;
export function sitePath(value:string){
 if(!value.startsWith('/')||value.startsWith('//'))return value;
 if(siteBase==='/'||value.startsWith(siteBase))return value;
 return siteBase+value.slice(1);
}
export function routePath(pathname:string){
 const base=siteBase==='/'?'':siteBase.replace(/\/$/,'');
 const relative=base&&(pathname===base||pathname.startsWith(base+'/'))?pathname.slice(base.length):pathname;
 return relative.replace(/\/$/,'')||'/';
}
