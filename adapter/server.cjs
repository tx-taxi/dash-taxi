'use strict';
// Dash API gateway and native explorer runtime; local mode proxies Angular.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {WebSocket, WebSocketServer} = require('ws');
const sharp = require('sharp');
const {providerStatus} = require('./provider-health.cjs');
const STATIC_ROOT = process.env.DASH_STATIC_ROOT && path.resolve(process.env.DASH_STATIC_ROOT);
const ROUTER_ORIGIN = process.env.DASH_ROUTER_ORIGIN || 'http://127.0.0.1:4330';
const SITE_ORIGIN = process.env.DASH_SITE_ORIGIN || 'http://127.0.0.1:4370';
const PRIMARY = process.env.DASH_PROVIDER || 'https://explorer.dash.org/insight-api';
const cache = new Map(), inflight = new Map(), failedPaths = new Map();
const health = {primary: PRIMARY, lastSuccess: null, lastFailure: null, websocket: 'connecting'};
const MAX_CACHE = 500;
function result(data, source='dashspace', status=200) {return {data,source,status,at:Date.now()};}
async function fetchData(url, timeout=7000, metadata=false) {
 const r=await fetch(url,{signal:AbortSignal.timeout(timeout)});
 const raw=await r.text(); let data;try {data=JSON.parse(raw);}catch {data=raw;}
 if(!r.ok) throw Object.assign(new Error(`Provider HTTP ${r.status}`),{status:r.status});
 return metadata ? {data,headers:Object.fromEntries(['x-total-count','retry-after'].filter(h=>r.headers.has(h)).map(h=>[h,r.headers.get(h)]))} : data;
}
async function fallback(path) {
 if(path==='/api/blocks/tip/height' || path==='/api/blocks/tip/hash') {
  const d=await fetchData('https://api.blockcypher.com/v1/dash/main',4000);
  return result(path.endsWith('height')?String(d.height):d.hash,'blockcypher');
 }
 const m=path.match(/^\/api\/(?:v1\/)?block(?:-height)?\/([a-f0-9]{64}|\d+)$/);
 if(m) {
  const b=await fetchData('https://api.blockcypher.com/v1/dash/main/blocks/'+m[1]+'?txstart=1&limit=1',4000);
  if(path.includes('block-height')) return result(b.hash,'blockcypher');
  // BlockCypher does not supply weight or all fees; don't fabricate an extended block.
  throw new Error('Extended block unavailable from fallback');
 }
 throw new Error('No independent equivalent for this capability');
}
function ttl(path) {
 if(/^\/api\/block-height\/\d+$/.test(path) || /^\/api\/(?:v1\/)?block\/[a-f0-9]{64}(?:\/.*)?$/.test(path))return 300000;
 if(path.includes('statistics')||path.includes('/mining/'))return 60000;
 if(path.includes('prices'))return 60000;
 return 5000;
}
const dashProvider=require('./dash-provider.cjs');dashProvider.startFeed();
async function api(path) {try {const data=await dashProvider.api(path);if(/^\/api\/(?:blocks\/tip\/|v1\/blocks$|v1\/init-data$)/.test(path))health.lastSuccess=Date.now();failedPaths.delete(path);return result(data,'dash-insight');}catch(e){if(!/does not expose|exceeds the bounded|cursor expired|history changed/.test(e.message)){health.lastFailure={at:Date.now(),message:e.message};failedPaths.set(path,Date.now());}return result({error:e.message,retryable:e.status!==404},'dash-insight',e.status===404?404:503)}}

function send(res,status,data,type='application/json',headers={}) {
 res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store',...headers});res.end(typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data));
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function metadata(path) {
 const m=path.match(/^\/(tx|block|address)\/([A-Za-z0-9]+)$/);
 let cardDescription='Entity data temporarily unavailable. Please retry.';
 let title='dash.tx.taxi - Dash Explorer', description='Explore Dash blocks, transactions, addresses, fees and mining activity.';
 if(m) {
  const kind=m[1],id=m[2];title=`Dash ${kind} ${id} - dash.tx.taxi`;
  let p=kind==='block'?'/api/v1/block/'+id:'/api/'+kind+'/'+id;
  if(kind==='block' && /^\d+$/.test(id)) {const h=await api('/api/block-height/'+id);if(h.status===200)p='/api/v1/block/'+h.data;}
  const r=await api(p);
  if(r.status===200) {
   if(kind==='tx')description=`${r.data.status?.confirmed?'Confirmed':'Pending'} Dash transaction. Fee: ${(r.data.fee/1e8).toFixed(8)} DASH. Dash Core transaction.`;
   if(kind==='block')description=`Dash block ${r.data.height}. ${r.data.tx_count} transactions. Mined ${new Date(r.data.timestamp*1000).toISOString()}.`;
   if(kind==='address')description=`Dash address with ${r.data.chain_stats?.tx_count ?? 'indexed'} confirmed transactions. Indexed Dash Core history.`;
   if(kind==='tx')cardDescription=`${r.data.status?.confirmed?'Confirmed':'Pending'} transaction · Fee: ${(r.data.fee/1e8).toFixed(8)} DASH`;
   if(kind==='block')cardDescription=`Block ${r.data.height} · ${r.data.tx_count} transaction${r.data.tx_count===1?'':'s'} · ${new Date(r.data.timestamp*1000).toISOString().slice(0,10)}`;
   if(kind==='address')cardDescription=`${r.data.chain_stats?.tx_count ?? 'Indexed'} confirmed transaction${r.data.chain_stats?.tx_count===1?'':'s'}`;
  } else description='Dash entity data is temporarily unavailable. Retry to retrieve current details.';
 }
 return {title,description,cardDescription,path:m?path:'/'};
}
const cardTemplate=fs.readFileSync(__dirname+'/assets/social-card.svg','utf8');
const cardLogo='data:image/svg+xml;base64,'+fs.readFileSync(__dirname+'/../frontend/src/resources/branding/dash-dark-navbar.svg').toString('base64');
async function card(path) {
 const m=await metadata(path), entity=m.path.match(/^\/(tx|block|address)\/([A-Za-z0-9]+)$/);
 const headline=entity?({tx:'transaction',block:'block',address:'address'}[entity[1]]):'explorer';
 const subtitle=entity?m.cardDescription:'Live Dash blocks, transactions, fees and mining.';
 const bounded=subtitle.length>61?subtitle.slice(0,60).trimEnd()+'…':subtitle;
 const identifier=entity?`<text x="80" y="548" fill="#747474" font-family="DejaVu Sans Mono, monospace" font-size="18">${escape(entity[2])}</text>`:'';
 const values={headline:escape(headline),subtitle:escape(bounded),logo:cardLogo,identifier};
 const svg=cardTemplate.replace(/\{\{(headline|subtitle|logo|identifier)\}\}/g,(_,key)=>values[key]);
 return sharp(Buffer.from(svg)).png().toBuffer();
}
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 try {
  if(req.method!=='GET' && req.method!=='HEAD')return send(res,405,{error:'Read-only local explorer'});
  if(u.pathname.startsWith('/local-router/')) {
   const path=u.pathname.slice('/local-router'.length)+u.search;
   if(!/^\/(api|assets)\//.test(path)) {res.writeHead(302,{location:ROUTER_ORIGIN+path});return res.end();}
   const r=await fetch(ROUTER_ORIGIN+path,{signal:AbortSignal.timeout(12000),redirect:'manual'});
   if(r.status>=300&&r.status<400) { const dest=r.headers.get('location');res.writeHead(r.status,{location:dest});return res.end(); }
   return send(res,r.status,Buffer.from(await r.arrayBuffer()),r.headers.get('content-type')||'application/json');
  }
  if(u.pathname==='/api/provider-health') {
   // An idle gateway has no observations, not evidence of an upstream outage.
   // Probe current mempool data before reporting stale health to a visitor.
   if(!health.lastSuccess || Date.now()-health.lastSuccess>30000)await api('/api/blocks/tip/height');
   return send(res,200,{...providerStatus(health,failedPaths),cacheEntries:cache.size});
  }
  if(u.pathname==='/healthz')return send(res,200,{...providerStatus(health,failedPaths),cacheEntries:cache.size});
  if(u.pathname==='/api/local-resolve') {
   try {return send(res,200,await fetchData(ROUTER_ORIGIN+'/api/v1/resolve?value='+encodeURIComponent(u.searchParams.get('value')||''),12000));} catch {return send(res,503,{unavailable:true});}
  }
  if(u.pathname.startsWith('/api/')) {
   const r=await api(u.pathname+u.search);
   return send(res,r.status,r.data,typeof r.data==='string'?'text/plain':'application/json',{...r.headers,'X-DASH-Source':r.source,'X-DASH-Stale':String(!!r.stale),'X-DASH-Observed-At':String(r.at)});
  }
  if(u.pathname.startsWith('/resources/mining-pools/'))return send(res,200,fs.readFileSync(__dirname+'/../frontend/src/resources/mining-pools/default.svg'),'image/svg+xml');
  if(u.pathname==='/og.png') return send(res,200,await card(u.searchParams.get('path')||'/'),'image/png');
  if(u.pathname.startsWith('/source/')||u.pathname.endsWith('.map'))return send(res,404,{error:'Not found'});
  let r;
  if(STATIC_ROOT) {
   const relative=decodeURIComponent(u.pathname).replace(/^\/+/, '');
   let file=path.resolve(STATIC_ROOT,relative);
   if(file!==STATIC_ROOT&&!file.startsWith(STATIC_ROOT+path.sep))return send(res,404,{error:'Not found'});
   if(!path.extname(relative))file=path.join(STATIC_ROOT,'index.html');
   let bytes;try{bytes=await fs.promises.readFile(file);}catch{return send(res,404,{error:'Not found'});}
   const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.webmanifest':'application/manifest+json','.txt':'text/plain','.wasm':'application/wasm'};
   r=new Response(bytes,{headers:{'content-type':types[path.extname(file)]||'application/octet-stream'}});
  } else r=await fetch('http://127.0.0.1:4371'+req.url,{headers:{accept:req.headers.accept||'*/*'},signal:AbortSignal.timeout(15000)});
  const type=r.headers.get('content-type')||'text/plain';
  if(type.includes('text/html')) {
   let html=await r.text();const m=await metadata(u.pathname),origin=SITE_ORIGIN;
   html=html.replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta[^>]+(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'][^>]*>/g,'').replace(/<link[^>]+rel=["']canonical["'][^>]*>/g,'');
   html=html.replace('</head>',`<title>${escape(m.title)}</title><meta name="description" content="${escape(m.description)}"><link id="canonical" rel="canonical" href="https://dash.tx.taxi${escape(m.path)}"><meta property="og:title" content="${escape(m.title)}"><meta property="og:description" content="${escape(m.description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="dash.tx.taxi"><meta property="og:locale" content="en_US"><meta property="og:image" content="${origin}/og.png?v=4&amp;path=${encodeURIComponent(m.path)}"><meta property="og:url" content="https://dash.tx.taxi${escape(m.path)}"><meta property="og:image:type" content="image/png"><meta property="og:image:alt" content="${escape(m.title)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:domain" content="dash.tx.taxi"><meta name="twitter:image:alt" content="${escape(m.title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(m.title)}"><meta name="twitter:description" content="${escape(m.description)}"><meta name="twitter:image" content="${origin}/og.png?v=4&amp;path=${encodeURIComponent(m.path)}"></head>`);
   return send(res,r.status,html,type);
  }
  return send(res,r.status,Buffer.from(await r.arrayBuffer()),type);
 }catch(e){send(res,503,{error:'Local service unavailable',message:e.message});}
});
const wss=new WebSocketServer({noServer:true});
server.on('upgrade',(req,socket,head)=>{
 if(req.url==='/api/v1/ws')wss.handleUpgrade(req,socket,head,client=>wss.emit('connection',client));
 else {
  if(STATIC_ROOT){socket.destroy();return;}
  // Preserve Angular incremental rebuild notifications.
  const upstream=http.request({host:'127.0.0.1',port:4371,path:req.url,headers:req.headers});
  upstream.on('upgrade',(r,s,h)=>{socket.write('HTTP/1.1 101 Switching Protocols\r\n'+Object.entries(r.headers).map(([k,v])=>`${k}: ${v}`).join('\r\n')+'\r\n\r\n');if(h.length)socket.write(h);if(head.length)s.write(head);s.pipe(socket).pipe(s);});upstream.on('error',()=>socket.destroy());upstream.end();
 }
});
wss.on('connection',client=>{
 let busy=false;let timer;let trackedTx=null;let trackedAddress=null;let seenAddress=null;async function refresh(){if(busy)return;busy=true;try{const d=await dashProvider.snapshot();if(trackedTx){try{d.tx=await dashProvider.api('/api/tx/'+trackedTx);}catch{}}if(trackedAddress){try{const txs=await dashProvider.api('/api/address/'+trackedAddress+'/txs');if(seenAddress)d['address-transactions']=txs.filter(t=>!seenAddress.has(t.txid));seenAddress=new Set(txs.map(t=>t.txid));}catch{}}health.lastSuccess=Date.now();health.websocket='live';if(client.readyState===1)client.send(JSON.stringify(d));}catch(e){health.websocket='unavailable';if(client.readyState===1)client.close(1013,'Provider unavailable');}finally{busy=false}}
 client.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}if(m['track-tx']){trackedTx=m['track-tx']==='stop'?null:m['track-tx'];if(trackedTx)refresh();}if(Object.hasOwn(m,'track-address')){trackedAddress=m['track-address']||null;seenAddress=null;}if(m.action==='ping'&&client.readyState===1)client.send(JSON.stringify({pong:true}));if(m.action==='init')refresh();});
 timer=setInterval(refresh,15000);client.on('close',()=>clearInterval(timer));client.on('error',()=>clearInterval(timer));
});
server.listen(Number(process.env.PORT||4370),'127.0.0.1',()=>console.log('DASH explorer on 127.0.0.1:'+ (process.env.PORT||4370)));
