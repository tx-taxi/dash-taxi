'use strict';

// One polling clock and shared entity groups. Retained data keeps its original
// observation time, following the approved LTC shared-feed persistence contract.
class SnapshotFeed {
 constructor({provider, store, health, intervalMs=15000, maxDetails=8, now=Date.now}) {
  Object.assign(this,{provider,store,health,intervalMs,maxDetails,now});
  const saved=store?.get('ws:snapshot');
  this.snapshot=saved?.data; this.observedAt=saved?.at||0;
  this.clients=new Map(); this.details=new Map(); this.live=false;
 }
 freshness(){return {state:this.live&&this.now()-this.observedAt<90000?'live':this.observedAt?'stale':'unavailable',observedAt:this.observedAt||null};}
 send(client,data){if(client.readyState===1)client.send(JSON.stringify(data));}
 initial(client){
  const retained=this.snapshot&&this.now()-this.observedAt<3600000?this.snapshot:{};
  this.send(client,{...retained,'provider-freshness':this.freshness()});
 }
 start(){this.refresh();this.timer=setInterval(()=>this.refresh(),this.intervalMs);}
 stop(){clearInterval(this.timer);}
 async refresh(){
  if(this.busy)return this.busy;
  this.busy=(async()=>{
   try{
    const data=await this.provider.snapshot();
    this.snapshot=data;this.observedAt=this.now();this.live=true;
    this.health.lastSuccess=this.observedAt;this.health.websocket='live';
    this.store?.put('ws:snapshot',{data,at:this.observedAt});
    for(const client of this.clients.keys())this.initial(client);
   }catch(e){
    this.live=false;this.health.websocket=this.freshness().state;
    this.health.lastFailure={at:this.now(),message:e.message};
    for(const client of this.clients.keys())this.send(client,{'provider-freshness':this.freshness()});
   }
   await Promise.all([...this.details.values()].map(group=>this.refreshDetail(group)));
  })().finally(()=>{this.busy=null;});
  return this.busy;
 }
 async refreshDetail(group){
  if(group.busy)return group.busy;
  group.busy=(async()=>{
   try{
    const data=await this.provider.api(group.path);
    const frame=group.type==='tx'?{tx:data}:{'address-transactions':group.seen?data.filter(tx=>!group.seen.has(tx.txid)||group.seen.get(tx.txid)!==tx.status.confirmed):[]};
    if(group.type==='address')group.seen=new Map(data.map(tx=>[tx.txid,tx.status.confirmed]));
    group.frame=frame;group.at=this.now();
    for(const client of group.clients)this.send(client,frame);
   }catch{} // Optional tracked details cannot invalidate the chain snapshot.
  })().finally(()=>{group.busy=null;});
  return group.busy;
 }
 track(client,type,id){
  const state=this.clients.get(client);const old=state[type];
  if(old){old.clients.delete(client);if(!old.clients.size)this.details.delete(old.key);state[type]=null;}
  if(!id||id==='stop')return;
  if(typeof id!=='string'||!(type==='tx'?/^[a-f0-9]{64}$/i:/^[X7][1-9A-HJ-NP-Za-km-z]{25,34}$/).test(id))return;
  const key=type+':'+id;let group=this.details.get(key);
  if(!group){
   if(this.details.size>=this.maxDetails)return;
   group={key,type,path:'/api/'+(type==='tx'?'tx/':'address/')+id+(type==='address'?'/txs':''),clients:new Set()};this.details.set(key,group);
  }
  group.clients.add(client);state[type]=group;
  if(group.frame&&this.now()-group.at<this.intervalMs)this.send(client,group.frame);
  else this.refreshDetail(group);
 }
 attach(client){
  this.clients.set(client,{});
  client.on('message',raw=>{
   let message;try{message=JSON.parse(raw);}catch{return;}
   if(message.action==='ping')this.send(client,{pong:true,'provider-freshness':this.freshness()});
   if(message.action==='init'||message.action==='want'||message['refresh-blocks'])this.initial(client);
   if(Object.hasOwn(message,'track-tx'))this.track(client,'tx',message['track-tx']);
   if(Object.hasOwn(message,'track-address'))this.track(client,'address',message['track-address']);
  });
  const detach=()=>{if(!this.clients.has(client))return;this.track(client,'tx',null);this.track(client,'address',null);this.clients.delete(client);};
  client.on('close',detach);client.on('error',detach);
 }
}
module.exports={SnapshotFeed};
