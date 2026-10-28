'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fixture=require('./fixtures/blockbook-block.json');const {createSource}=require('./insight-source.cjs');
test('failed Insight falls back to merkle-verified Dash block bytes while retaining native special transactions and exact fees',async()=>{
 let calls=0;const s=createSource({primary:'http://insight.invalid',blockbook:'http://book.invalid',fetchImpl:async url=>{calls++;if(url.startsWith('http://insight'))throw Error('offline');return Response.json(url.includes('/rawblock/')?fixture.raw:fixture.block);}});
 const b=await s.read('/block/'+fixture.block.hash);assert.equal(b.height,2562977);assert.equal(b.tx.length,10);assert.equal(b.reward,'1.64433787');
 const list=await s.read('/txs?block='+b.hash);assert.equal(list.txs[0].type,5);assert.equal(list.txs[1].fees,'0.00005000');assert.equal(list.txs[1].vin[0].valueSat,147389990000);
 const before=calls;await s.read('/block/'+b.hash);assert.equal(calls,before,'verified immutable data is reused through primary outage');
});
test('an absent transaction is distinct from a provider outage',async()=>{
 const s=createSource({primary:'http://insight.invalid',blockbook:'http://book.invalid',fetchImpl:async url=>{if(url.startsWith('http://insight'))throw Error('offline');return Response.json({error:"Transaction '"+'0'.repeat(64)+"' not found"},{status:400});}});
 await assert.rejects(s.read('/tx/'+'0'.repeat(64)),e=>e.status===404);
});
