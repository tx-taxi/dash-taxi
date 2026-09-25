import {chromium} from '/home/lukee/.local/share/pnpm/global/5/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const b=await chromium.launch({headless:true,executablePath:'/home/lukee/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});let report=[];
for(const [name,path] of [['root','/'],['block','/block/100000'],['tx','/tx/836f0f697b6d3a6283c7c264a5a144c893e7b077ef4aea87dbb4f32d81ac86c5'],['address','/address/XrgrCXZFhLNfyR4UKv9YT19CK7YVEPrc8Y']]){
 if(process.argv[2]&&!process.argv[2].split(',').includes(name))continue;
 const p=await b.newPage({viewport:{width:1440,height:900}});const errors=[],failures=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failures.push([r.status(),r.url()])});await p.goto('http://127.0.0.1:4370'+path);await p.waitForTimeout(10000);await p.screenshot({path:`review/dash/${name}-desktop.png`});report.push({name,title:await p.title(),text:(await p.locator('body').innerText()).slice(0,8000),errors,failures,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);await p.screenshot({path:`review/dash/${name}-mobile.png`});for(const theme of ['original','default']){await p.evaluate(v=>localStorage.setItem('theme-preference',v),theme);await p.reload();await p.waitForTimeout(2500);await p.screenshot({path:`review/dash/${name}-mobile-${theme}.png`});}await p.close();
}
if(process.argv[2]&&fs.existsSync('review/dash/browser.json'))report.push(...JSON.parse(fs.readFileSync('review/dash/browser.json')).filter(x=>!report.some(y=>y.name===x.name)));
fs.writeFileSync('review/dash/browser.json',JSON.stringify(report,null,2));await b.close();
