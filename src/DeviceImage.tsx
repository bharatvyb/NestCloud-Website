import { sitePath } from './site';
/** Optimized exports of the supplied hardware photo. Original artwork is retained. */
export function DeviceImage({alt,className='',priority=false}:{alt:string,className?:string,priority?:boolean}){
 return <img className={className} src={sitePath('/assets/nestcloud-device-1600.webp')} srcSet={`${sitePath('/assets/nestcloud-device-800.webp')} 800w, ${sitePath('/assets/nestcloud-device-1600.webp')} 1600w`} sizes="(max-width: 600px) 92vw, (max-width: 1000px) 80vw, 650px" width="2046" height="768" alt={alt} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':undefined} decoding="async"/>;
}
