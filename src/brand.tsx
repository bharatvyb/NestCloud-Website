import React from 'react';
export type BrandTone='light'|'dark';
export type BrandLayout='horizontal'|'stacked';
export type BrandSurface='transparent'|'solid';
export const brandAssets={
 light:{horizontal:{file:'nestcloud-horizontal-light-tm.png',bounds:[43,767,1913,418]},stacked:{file:'nestcloud-stacked-light-tm.png',bounds:[152,368,1784,1081]}},
 dark:{horizontal:{file:'nestcloud-horizontal-dark-tm.png',bounds:[45,766,1912,418]},stacked:{file:'nestcloud-stacked-dark-tm.png',bounds:[97,274,1860,1130]}},
} as const;
/** Use supplied artwork unchanged. Only empty canvas margins are hidden. */
export function BrandAsset({tone='light',layout='horizontal',surface='transparent',className='',decorative=false}:{tone?:BrandTone,layout?:BrandLayout,surface?:BrandSurface,className?:string,decorative?:boolean}){const asset=brandAssets[tone][layout];const[x,y,width,height]=asset.bounds;return <span className={`brand-asset ${className}`} style={{aspectRatio:`${width}/${height}`}}><img src={`/brand/nestcloud/${surface}/${asset.file}`} alt={decorative?'':'NestCloud™'} width="2000" height="2000" style={{width:`${2000/width*100}%`,left:`${-x/width*100}%`,top:`${-y/height*100}%`}}/></span>}
