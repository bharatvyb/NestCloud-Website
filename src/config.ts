export const configs = [
 {id:'512gb',name:'512 GB',price:49900,badge:'',short:'A little space for a lot of life.',description:'512 GB of SSD storage for everyday photos, videos and important files. A lovely place to start your family cloud.',storage:'512 GB personal storage',backup:'Single SSD. Keep a separate backup of important files.'},
 {id:'1tb',name:'1 TB',price:59900,badge:'Recommended',short:'Room for your growing collection.',description:'1 TB of SSD storage for the photos, home videos and files your family keeps collecting. More room for the moments ahead.',storage:'1 TB personal storage',backup:'Single SSD. Keep a separate backup of important files.'},
 {id:'backup',name:'1 TB + 1 TB Backup Plus',price:81900,badge:'Extra Protection',short:'Your memories, with another layer of care.',description:'1 TB for your family’s files, plus a second physical 1 TB SSD configured for backup protection. That’s 1 TB of usable storage, with a dedicated backup drive.',storage:'1 TB personal storage + 1 TB backup SSD',backup:'Backup protection adds resilience. A separate off-device backup is still recommended.'}
] as const;
export type Configuration = typeof configs[number];
export const formatPrice = (price:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(price);
export const navigation = [{label:'Family',href:'/family'},{label:'NestCloud OS',href:'/nestcloud-os'},{label:'Why NestCloud',href:'/why-nestcloud'},{label:'How It Works',href:'/how-it-works'},{label:'Support',href:'/support'}];
export const features = [{name:'Photos',available:true},{name:'Files',available:true},{name:'Family Box Office',available:false}];
