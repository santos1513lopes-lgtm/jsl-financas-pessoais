const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const {webcrypto}=require('node:crypto');const Finance=require('../assets/core.js');
const AH=['id','name','kind','modality','initial'],TH=['id','type','description','category','amount','date','accountId','toAccountId','status','installment'];
function harness(){
 const elements=new Map(),storage=new Map(),listeners=new Map(),timers=[];
 const $=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:''});return elements.get(id);};
 let remote={accounts:[],transactions:[]},writes=0,fail=false;
 const tabs=['Contas','Lancamentos','Config'].map((title,sheetId)=>({title,sheetId,gridProperties:{rowCount:1000,columnCount:26}}));
 const c={Finance,crypto:webcrypto,TextEncoder,URL,URLSearchParams,console,Date,JSON,Number,String,Array,Object,Error,Promise,Set,
 $ ,KEY:'db',db:{accounts:[],transactions:[]},render:()=>{},confirm:()=>true,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 document:{querySelectorAll:()=>[]},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{},
 google:{accounts:{oauth2:{initTokenClient:config=>({requestAccessToken:()=>config.callback({access_token:'memory-only-test-token',expires_in:3600})}),revoke:()=>{}}}},
 fetch:async(url,opts={})=>{
 if(fail)throw Error('Offline');
 if(url.includes('values:batchGet'))return {ok:true,json:async()=>({valueRanges:[{values:[AH,...remote.accounts.map(a=>AH.map(k=>a[k]??''))]},{values:[TH,...remote.transactions.map(t=>TH.map(k=>t[k]??''))]},{values:[['key','value'],['schema','jsl-v2']]}]})};
 if(url.endsWith(':batchUpdate')){writes++;const payload=JSON.parse(opts.body);const rows=payload.requests.filter(x=>x.updateCells).map(x=>x.updateCells.rows.map(r=>r.values.map(v=>v.userEnteredValue.numberValue??v.userEnteredValue.stringValue)));remote={accounts:rows[0].slice(1).map(r=>Object.fromEntries(AH.map((k,i)=>[k,r[i]]))),transactions:rows[1].slice(1).map(r=>Object.fromEntries(TH.map((k,i)=>[k,r[i]])))};return {ok:true,json:async()=>({})};}
 return {ok:true,json:async()=>({spreadsheetUrl:'https://docs.google.com/spreadsheets/d/test/edit',sheets:tabs.map(properties=>({properties}))})};
 }};
 c.window=c;c.JSL_CONFIG={googleClientId:'test.apps.googleusercontent.com'};c.addEventListener=(n,fn)=>listeners.set(n,fn);
 vm.createContext(c);vm.runInContext(fs.readFileSync(require.resolve('../assets/sheets.js'),'utf8'),c);
 $('sheetUrl').value='https://docs.google.com/spreadsheets/d/test/edit';
 return {c,$,storage,timers,change:()=>listeners.get('finance-change')(),remote:()=>remote,setRemote:r=>remote=r,writes:()=>writes,offline:()=>fail=true};
}
test('Sheets carrega, grava, confirma e nunca persiste o token',async()=>{const h=harness();await h.$('connectGoogle').onclick();h.c.db.accounts.push({id:'a',name:'Conta',kind:'conta',modality:'Corrente',initial:100});h.change();await h.$('pushGoogle').onclick();assert.equal(h.writes(),1);assert.equal(h.remote().accounts[0].initial,100);assert.match(h.$('syncStatus').textContent,/Salvo no Google Sheets/);assert(!JSON.stringify([...h.storage]).includes('memory-only-test-token'));});
test('Sheets bloqueia sobrescrita quando conteúdo remoto mudou',async()=>{const h=harness();await h.$('connectGoogle').onclick();h.setRemote({accounts:[{id:'remote',name:'Outro dispositivo',kind:'conta',modality:'Corrente',initial:5}],transactions:[]});h.c.db.accounts.push({id:'local',name:'Local',kind:'conta',modality:'Corrente',initial:10});h.change();await h.$('pushGoogle').onclick();assert.equal(h.writes(),0);assert.match(h.$('syncError').textContent,/Conflito/);assert.equal(h.c.db.accounts[0].id,'local');});
test('falha de rede mantém pendência local e reset é propagado',async()=>{const h=harness();await h.$('connectGoogle').onclick();h.c.db.accounts.push({id:'a',name:'Conta',kind:'conta',modality:'Corrente',initial:100});h.change();await h.$('pushGoogle').onclick();h.c.db={accounts:[],transactions:[]};h.change();await h.$('pushGoogle').onclick();assert.equal(h.remote().accounts.length,0);h.offline();h.change();await h.$('pushGoogle').onclick();assert.equal(JSON.parse(h.storage.get('jsl_google_binding_v2')).dirty,true);assert.match(h.$('syncError').textContent,/Offline/);});
