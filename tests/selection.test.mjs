import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveConfigurationId} from '../src/selection.mjs';
test('new visits default to 1 TB',()=>assert.equal(resolveConfigurationId(null,null),'1tb'));
test('explicit product and review links override session preference',()=>{
 for(const id of ['512gb','1tb','backup']) assert.equal(resolveConfigurationId(id,'backup'),id);
});
test('generic product links keep a valid session choice',()=>{
 for(const id of ['512gb','1tb','backup'])assert.equal(resolveConfigurationId(null,id),id);
});
test('invalid URL and stale preferences safely resolve to 1 TB',()=>{
 assert.equal(resolveConfigurationId('2tb','backup'),'1tb');
 assert.equal(resolveConfigurationId('',null),'1tb');
 assert.equal(resolveConfigurationId(null,'retired-model'),'1tb');
});
