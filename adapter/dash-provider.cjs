'use strict';
// Dash Core chain adapter. All monetary fields become integer duffs once, at this boundary.
const {pendingSummary}=require('./pending-summary.cjs');
const BASE=process.env.DASH_PROVIDER||'https://explorer.dash.org/insight-api';
const {DataStore}=require('./data-store.cjs');
const store=new DataStore({dir:process.env.DASH_DATA_DIR||require('node:path').join(__dirname,'data')});
const source=require('./insight-source.cjs').createSource({primary:BASE,store});
const cache=new Map(),active=new Map();let lastSuccess=0,lastFailure=null;
async function get(p,ttl=10000){const old=cache.get(p)||store.get('provider:'+p);if(old&&Date.now()-old.at<ttl){cache.set(p,old);return old.data;}if(active.has(p))return active.get(p);const task=(async()=>{try{const data=await source.read(p);lastSuccess=Date.now();const record={at:Date.now(),data};cache.set(p,record);store.put('provider:'+p,record);if(cache.size>600)cache.delete(cache.keys().next().value);return data;}catch(e){lastFailure={at:Date.now(),message:e.message};throw e;}finally{active.delete(p)}})();active.set(p,task);return task;}
function atomic(v){const str=typeof v==='number'?v.toFixed(8):String(v??0);const negative=str.startsWith('-');const [a,b='']=str.replace(/^-/,'').split('.');return Number((negative?-1n:1n)*(BigInt(a)*100000000n+BigInt((b+'00000000').slice(0,8))));}
function fee(t){if(t.isCoinBase||[6,7].includes(t.type))return 0;if(t.type===9){if(!/^[0-9a-f]{290}$/i.test(t.extraPayload||''))return null;return Buffer.from(t.extraPayload,'hex').readUInt32LE(9);}return t.fees==null?null:atomic(t.fees);}

function tx(t){return {txid:t.txid,version:t.version,locktime:t.locktime,size:t.size,weight:t.size*4,fee:fee(t),vin:t.vin.map(i=>({txid:i.txid||'0'.repeat(64),vout:i.vout??0,is_coinbase:!!i.coinbase,scriptsig:i.coinbase||i.scriptSig?.hex||'',scriptsig_asm:i.scriptSig?.asm||'',sequence:i.sequence,prevout:i.coinbase?null:{value:i.valueSat??atomic(i.value),scriptpubkey_address:i.addr,scriptpubkey_type:'p2pkh',scriptpubkey:'',scriptpubkey_asm:''}})),vout:t.vout.map(o=>({value:atomic(o.value),scriptpubkey:o.scriptPubKey.hex,scriptpubkey_asm:o.scriptPubKey.asm,scriptpubkey_address:o.scriptPubKey.addresses?.[0],scriptpubkey_type:({pubkeyhash:'p2pkh',scripthash:'p2sh',nulldata:'op_return',pubkey:'p2pk'})[o.scriptPubKey.type]||o.scriptPubKey.type})),status:{confirmed:t.confirmations>0,...(t.confirmations>0?{block_height:t.blockheight,block_hash:t.blockhash,block_time:t.blocktime}: {})},dash:{type:t.type??0,instantSend:!!t.txlock,extraPayload:t.extraPayload||null}};}
async function rawBlock(id){if(/^\d+$/.test(id))id=(await get('/block-index/'+id,300000)).blockHash;return get('/block/'+id,300000)}
async function block(id){const b=await rawBlock(id);let details={};if(b.tx.length<=100){const first=await get('/txs?block='+b.hash,300000);const pages=[first];for(let n=1;n<first.pagesTotal;n++)pages.push(await get('/txs?block='+b.hash+'&pageNum='+n,300000));const txs=pages.flatMap(x=>x.txs);if(txs.length===b.tx.length && txs.every(t=>fee(t)!==null)){const ordinary=txs.filter(t=>!t.isCoinBase);const rates=ordinary.map(t=>(fee(t)??0)/t.size).sort((a,b)=>a-b);details={totalFees:ordinary.reduce((n,t)=>n+(fee(t)??0),0),medianFee:rates.length?rates[Math.floor(rates.length/2)]:0,minFee:rates[0]??0,maxFee:rates.at(-1)??0,feeRange:rates.length?rates:[0]};}}return {id:b.hash,height:b.height,version:b.version,timestamp:b.time,tx_count:b.tx.length,size:b.size,weight:b.size*4,merkle_root:b.merkleroot,previousblockhash:b.previousblockhash,difficulty:b.difficulty,nonce:b.nonce,bits:parseInt(b.bits,16),extras:{...details,reward:atomic(b.reward),pool:{id:0,name:b.poolInfo?.poolName||'Unknown',slug:(b.poolInfo?.poolName||'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-'),minerNames:null}}}}
async function blocks(height){let ids;if(height){ids=Array.from({length:Math.min(10,Number(height)+1)},(_,i)=>String(Number(height)-i));}else ids=(await get('/blocks?limit=10')).blocks.map(x=>x.hash);const out=[];for(let i=0;i<ids.length;i+=3)out.push(...await Promise.all(ids.slice(i,i+3).map(block)));return out;}
async function blockTxs(id,offset=0){const b=await rawBlock(id);const ids=b.tx.slice(offset,offset+25);const out=[];for(let i=0;i<ids.length;i+=4)out.push(...await Promise.all(ids.slice(i,i+4).map(async id=>tx(await get('/tx/'+id,300000)))));return out;}
const cursors=new Map();
async function addressTxs(address,cursor){let start=0;if(cursor){if(!cursors.has(address+':'+cursor))throw new Error('Address cursor expired; reload the first page');start=Math.max(0,cursors.get(address+':'+cursor)-10);}const firstPage=Math.floor(start/10);const candidates=[];for(let page=firstPage;page<firstPage+5;page++){const data=await get('/txs?address='+address+'&pageNum='+page,10000);candidates.push(...data.txs);const position=cursor?candidates.findIndex(x=>x.txid===cursor)+1:0;if((!cursor||position>0)&&candidates.length-position>=25||page+1>=data.pagesTotal)break;}const position=cursor?candidates.findIndex(x=>x.txid===cursor)+1:0;if(cursor&&position===0)throw new Error('Address history changed; reload the first page');const all=candidates.slice(position,position+25);if(all.length)cursors.set(address+':'+all.at(-1).txid,firstPage*10+position+all.length);if(cursors.size>500)cursors.delete(cursors.keys().next().value);return all.map(tx)}
async function summary(id){const b=await rawBlock(id);if(b.tx.length>500)throw new Error('Full block overview exceeds the bounded provider budget; use paginated transactions');const list=[];for(let n=0;n<b.tx.length;n+=25)list.push(...await blockTxs(id,n));return list.map(t=>({txid:t.txid,fee:t.fee,vsize:t.size,value:t.vout.reduce((a,b)=>a+b.value,0)}));}

async function api(path){const url=new URL(path,'http://local');const p=url.pathname;let m;
 if(p==='/api/blocks/tip/height')return String((await get('/status?q=getInfo')).info.blocks);
 if(p==='/api/blocks/tip/hash')return (await get('/status?q=getLastBlockHash')).lastblockhash;
 if((m=p.match(/^\/api\/block-height\/(\d+)$/)))return (await get('/block-index/'+m[1],300000)).blockHash;
 if((m=p.match(/^\/api\/(?:v1\/)?blocks(?:\/(\d+))?$/)))return blocks(m[1]);
 if((m=p.match(/^\/api\/(?:v1\/)?block\/([^/]+)$/)))return block(m[1]);
 if((m=p.match(/^\/api\/block\/([^/]+)\/txids$/)))return (await rawBlock(m[1])).tx;
 if((m=p.match(/^\/api\/block\/([^/]+)\/txs(?:\/(\d+))?$/)))return blockTxs(m[1],Number(m[2]||0));
 if((m=p.match(/^\/api\/v1\/block\/([^/]+)\/txs\/summary$/)))return summary(m[1]);
 if((m=p.match(/^\/api\/tx\/([^/]+)(?:\/(status|hex|outspends))?$/))){const t=await get('/tx/'+m[1]+(m[2]==='outspends'?'?spending=true':''),10000);if(m[2]==='status')return tx(t).status;if(m[2]==='hex')return (await get('/rawtx/'+m[1],300000)).rawtx;if(m[2]==='outspends'&&t._sourceBlockbook&&t.vout.some(o=>!o._spentKnown))throw Error('Output spend state unavailable');if(m[2]==='outspends')return t.vout.map(o=>({spent:o._spent===true||!!o.spentTxId,...(o.spentTxId?{txid:o.spentTxId,vin:o.spentIndex,status:{confirmed:!!o.spentHeight,block_height:o.spentHeight}}:{})}));return tx(t)}
 if((m=p.match(/^\/api\/address\/([^/]+)\/txs(?:\/chain(?:\/([^/]+))?)?$/)))return addressTxs(m[1],m[2]);
 if((m=p.match(/^\/api\/address\/([^/]+)$/))){const a=await get('/addr/'+m[1]+'?noTxList=1');return {address:a.addrStr,chain_stats:{funded_txo_count:null,funded_txo_sum:a.totalReceivedSat,spent_txo_count:null,spent_txo_sum:a.totalSentSat,tx_count:a.txAppearances},mempool_stats:{funded_txo_count:null,funded_txo_sum:a.unconfirmedBalanceSat>0?a.unconfirmedBalanceSat:0,spent_txo_count:null,spent_txo_sum:a.unconfirmedBalanceSat<0?-a.unconfirmedBalanceSat:0,tx_count:a.unconfirmedAppearances}}}
 if(p==='/api/v1/transaction-times')return url.searchParams.getAll('txId[]').slice(0,100).map(id=>incomingSeen.has(id)?Math.floor(incomingSeen.get(id)/1000):null);
 if(p==='/api/dash/feed')return module.exports.feedHealth();
 if(p==='/api/v1/statistics/2h')return incomingSamples.slice().reverse();
 if(p==='/api/mempool/recent'&&!feedLive())throw Object.assign(new Error('Insight node notifications are unavailable; reconnecting'),{status:503});
 if(p==='/api/mempool/recent')return (await observedPending()).map(t=>({txid:t.txid,fee:t.fee,vsize:t.size,value:t.vout.reduce((a,b)=>a+b.value,0)}));
 if(p==='/api/v1/mining/blocks/fees/recent')return (await blocks()).filter(b=>b.extras.totalFees!=null).reverse().map(b=>({timestamp:b.timestamp,avgHeight:b.height,avgFees:b.extras.totalFees}));
 if(p==='/api/v1/prices')return prices();
 if(p==='/api/txs/outspends')return Promise.all((url.searchParams.get('txids')||'').split(',').slice(0,25).map(id=>api('/api/tx/'+id+'/outspends')));
 if((m=p.match(/^\/api\/v1\/block\/([^/]+)\/summary$/)))return summary(m[1]);
 if(p==='/api/v1/init-data')return snapshot();
 throw Object.assign(new Error('This provider does not expose this capability'),{status:503});
}
async function snapshot(){const bs=await blocks();for(const b of bs){const raw=await rawBlock(b.id);for(const id of raw.tx)observed.delete(id)}const pending=await observedPending();const sample=recordIncoming();return {'mempool-blocks':feedLive()?pendingSummary(pending):[],...(sample?{'live-2h-chart':sample}:{}),transactions:pending.map(t=>({txid:t.txid,fee:t.fee,vsize:t.size,value:t.vout.reduce((a,b)=>a+b.value,0)})),blocks:[...bs].reverse(),conversions:await prices(),loadingIndicators:{blocks:100},backend:'dash-insight',gitCommit:'dash-local',dashNetwork:{difficulty:bs[0].difficulty,blockInterval:150,reward:bs[0].extras.reward}}}
async function prices(){try{const data=await get('/currency',60000);return {USD:data.data.dash_usd,time:Math.floor(cache.get('/currency').at/1000)}}catch{return {}}}
module.exports={store,fee,prices,api,snapshot,atomic,tx,block,blocks,get,health:()=>({lastSuccess,lastFailure})};
// Insight's inv feed observes transactions reaching that node; it is not a complete global pool.
const incomingSamples=[],incomingEvents=[],incomingSeen=new Map();
function recordIncoming(){if(!feedLive())return null;const now=Date.now(),elapsed=Math.min(60,(now-feedStartedAt)/1000);while(incomingEvents.length&&incomingEvents[0].at<now-60000)incomingEvents.shift();for(const [id,at] of incomingSeen)if(at<now-7200000)incomingSeen.delete(id);const sample={added:Math.floor(now/1000),vbytes_per_second:elapsed>0?incomingEvents.reduce((sum,e)=>sum+e.size,0)/elapsed:0};if(incomingSamples.at(-1)?.added!==sample.added)incomingSamples.push(sample);while(incomingSamples.length&&incomingSamples[0].added<now/1000-7200)incomingSamples.shift();return sample;}
const observed=new Map();let feedSocket,feedState='connecting',feedStartedAt=Date.now(),lastEvent=null,feedRetry;
function startFeed(){const W=require('ws');feedSocket=new W(BASE.replace(/^http/,'ws').replace(/\/insight-api$/,'')+'/socket.io/?EIO=3&transport=websocket',{headers:{'User-Agent':'tx.taxi Dash explorer/0.1'}});let ping;
 feedSocket.on('message',async raw=>{const message=raw.toString();if(message.startsWith('0')){feedSocket.send('42["subscribe","inv"]');feedStartedAt=Date.now();observed.clear();incomingEvents.length=0;incomingSeen.clear();feedState='live';ping=setInterval(()=>{if(feedSocket.readyState===1)feedSocket.send('2')},20000)}if(!message.startsWith('42'))return;let event;try{event=JSON.parse(message.slice(2))}catch{return}if(['tx','txlock'].includes(event[0])&&event[1]?.txid){lastEvent=Date.now();try{const t=tx(await get('/tx/'+event[1].txid,0));if(t.status.confirmed)observed.delete(t.txid);else {observed.set(t.txid,t);if(!incomingSeen.has(t.txid)){incomingSeen.set(t.txid,Date.now());incomingEvents.push({at:Date.now(),size:t.size});}}if(observed.size>100)observed.delete(observed.keys().next().value)}catch{}}});feedSocket.on('error',()=>{feedState='unavailable'});feedSocket.on('close',()=>{clearInterval(ping);feedState='unavailable';feedRetry=setTimeout(startFeed,10000)});
}
async function observedPending(){for(const [id,t] of observed){if(t.status.confirmed)observed.delete(id)}return [...observed.values()];}
module.exports.startFeed=startFeed;module.exports.observedPending=observedPending;module.exports.feedHealth=()=>({state:feedState,startedAt:feedStartedAt,lastEvent,count:observed.size,scope:'Insight node notifications observed since the latest connection; incomplete pool'});

// One bounded fallback observation per minute for all visitors. The public
// Blockbook host disables all-transaction subscriptions; never pretend its
// socket supplies a pool. Independent IDs are re-read through the native mapper.
let fallbackObservedAt=0,fallbackTimer,fallbackBusy=false;
function feedLive(){return feedState==='live'||Date.now()-fallbackObservedAt<120000;}
async function refreshFallbackPending(){
 if(feedState==='live'||fallbackBusy)return;fallbackBusy=true;
 try{
  const response=await fetch('https://api.blockcypher.com/v1/dash/main/txs?limit=10',{signal:AbortSignal.timeout(8000),headers:{'user-agent':'tx.taxi Dash explorer/0.1'}});
  if(!response.ok)throw Error('Pending observation unavailable');const data=await response.json();if(!Array.isArray(data)||data.length>50||data.some(t=>!/^[a-f0-9]{64}$/.test(t.hash)))throw Error('Invalid pending observation');
  const ids=new Set(data.map(t=>t.hash));for(const id of observed.keys())if(!ids.has(id))observed.delete(id);
  let verified=0;
  for(const item of data){try{const t=tx(await source.transaction(item.hash));if(t.status.confirmed){observed.delete(t.txid);continue;}observed.set(t.txid,t);verified++;if(!incomingSeen.has(t.txid)){incomingSeen.set(t.txid,Date.now());incomingEvents.push({at:Date.now(),size:t.size});}}catch{}}
  if(data.length&&verified===0)throw Error('Pending detail observation unavailable');
  if(!feedLive())feedStartedAt=Date.now();fallbackObservedAt=Date.now();lastEvent=fallbackObservedAt;
 }catch{}finally{fallbackBusy=false;}
}
const insightStartFeed=startFeed;
module.exports.startFeed=()=>{insightStartFeed();if(!fallbackTimer){refreshFallbackPending();fallbackTimer=setInterval(refreshFallbackPending,60000);fallbackTimer.unref();}};
module.exports.feedHealth=()=>({state:feedLive()?'live':feedState,startedAt:feedStartedAt,lastEvent,count:observed.size,scope:'Observed node transactions; primary notifications or an independently verified pending feed',observedAt:feedState==='live'?lastEvent:fallbackObservedAt});
