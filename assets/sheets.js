'use strict';
(() => {
const META='jsl_google_binding_v2',AH=['id','name','kind','modality','initial'],TH=['id','type','description','category','amount','date','accountId','toAccountId','status','installment'];
let binding;try{binding=JSON.parse(localStorage.getItem(META)||'null')}catch{binding=null;}
let token='',expires=0,busy=false,timer,connected=false;
const status=s=>$('syncStatus').textContent=s;
const error=e=>{$('syncError').textContent=e.message||String(e);status(binding?.dirty?'Alterações locais pendentes · não sincronizadas':'Google Sheets não sincronizado');};
const persist=()=>localStorage.setItem(META,JSON.stringify(binding));
$('sheetUrl').value=binding?.url||'';
$('clientId').value=window.JSL_CONFIG?.googleClientId||localStorage.getItem('jsl_public_client_id')||'';
if(binding)status(binding.dirty?'Alterações locais pendentes. Reconecte com Google.':'Planilha lembrada. Conecte com Google para sincronizar.');
function sheetId(url){const u=new URL(url);if(u.origin!=='https://docs.google.com')throw Error('Cole um link válido do Google Sheets.');const m=u.pathname.match(/^\/spreadsheets\/d\/([\w-]+)/);if(!m)throw Error('Link de planilha inválido.');return m[1];}
async function auth(){
 const client=$('clientId').value.trim();if(!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(client))throw Error('Configure o Client ID OAuth conforme docs/GOOGLE-SHEETS.md. Somente o link de editor não autoriza gravação.');
 if(!window.google?.accounts?.oauth2){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=resolve;s.onerror=()=>reject(Error('Não foi possível carregar o login Google. Verifique a conexão.'));document.head.append(s);});}
 await new Promise((resolve,reject)=>{const c=google.accounts.oauth2.initTokenClient({client_id:client,scope:'https://www.googleapis.com/auth/spreadsheets',callback:r=>{if(r.error)return reject(Error(r.error_description||r.error));token=r.access_token;expires=Date.now()+Number(r.expires_in)*1000;resolve();},error_callback:()=>reject(Error('Login cancelado ou janela bloqueada. Clique em Conectar novamente.'))});c.requestAccessToken({prompt:''});});
 localStorage.setItem('jsl_public_client_id',client);
}
async function api(id,path='',body){if(!token||Date.now()>expires-30000)throw Error('Autorização Google expirada. Clique em Conectar com Google. Seus dados permanecem locais.');const r=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+id+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok){let reason='';try{reason=(await r.json()).error?.message||''}catch{}throw Error(`Google Sheets (${r.status}): ${reason||'falha de comunicação'}`);}return r.json();}
async function fingerprint(d){const bytes=new TextEncoder().encode(JSON.stringify(d));const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');}
async function readRemote(id){
 const meta=await api(id,'?fields=spreadsheetId,spreadsheetUrl,sheets.properties');
 const tabs=meta.sheets.map(s=>s.properties);
 if(!['Contas','Lancamentos','Config'].every(n=>tabs.some(t=>t.title===n)))throw Error('Use uma cópia do modelo JSL ou o botão Criar planilha. Não vou alterar uma planilha de outro formato.');
 const q=new URLSearchParams();for(const range of ["'Contas'!A:E","'Lancamentos'!A:J","'Config'!A:B"])q.append('ranges',range);q.set('valueRenderOption','UNFORMATTED_VALUE');
 const res=await api(id,'/values:batchGet?'+q);const [a,t,c]=res.valueRanges.map(v=>v.values||[]);
 if(JSON.stringify(a[0])!==JSON.stringify(AH)||JSON.stringify(t[0])!==JSON.stringify(TH)||c[1]?.[0]!=='schema'||c[1]?.[1]!=='jsl-v2')throw Error('Cabeçalhos ou versão do modelo incompatíveis.');
 const accounts=a.slice(1).filter(r=>r.some(x=>x!=='')).map(r=>({id:r[0],name:r[1],kind:r[2],modality:r[3],initial:Number(r[4]||0)}));
 const transactions=t.slice(1).filter(r=>r.some(x=>x!=='')).map(r=>({id:r[0],type:r[1],description:r[2],category:r[3],amount:Number(r[4]),date:r[5],accountId:r[6],toAccountId:r[7]||'',status:r[8],installment:r[9]||''}));
 const data=Finance.validate({accounts,transactions});return {data,tabs,hash:await fingerprint(data),url:meta.spreadsheetUrl};
}
function cell(v){return {userEnteredValue:typeof v==='number'?{numberValue:v}:{stringValue:String(v??'')}};}
function requests(data,tabs){const rows={Contas:[AH,...data.accounts.map(a=>AH.map(k=>a[k]??''))],Lancamentos:[TH,...data.transactions.map(t=>TH.map(k=>t[k]??''))],Config:[['key','value'],['schema','jsl-v2'],['revision',crypto.randomUUID()],['updatedAt',new Date().toISOString()]]};const out=[];for(const name of Object.keys(rows)){const tab=tabs.find(t=>t.title===name),height=Math.max(tab.gridProperties?.rowCount||1000,rows[name].length+1),width=rows[name][0].length;out.push({updateSheetProperties:{properties:{sheetId:tab.sheetId,gridProperties:{rowCount:height,columnCount:Math.max(tab.gridProperties?.columnCount||26,width)}},fields:'gridProperties.rowCount,gridProperties.columnCount'}});out.push({updateCells:{range:{sheetId:tab.sheetId,startRowIndex:0,endRowIndex:height,startColumnIndex:0,endColumnIndex:width},rows:rows[name].map(r=>({values:r.map(cell)})),fields:'userEnteredValue'}});}return out;}
async function pull(){if(!binding||!connected)throw Error('Conecte uma planilha primeiro.');if(binding.dirty&&!confirm('Há alterações locais pendentes. Substituí-las pelos dados da planilha? Baixe backup antes.'))return;const r=await readRemote(binding.id);await LocalVault.write(r.data);db=r.data;binding.hash=r.hash;binding.dirty=false;persist();render();status('Dados carregados do Google Sheets · '+new Date().toLocaleTimeString('pt-BR'));}
async function push(){
 if(!binding||!connected)throw Error('Conecte com Google antes de salvar na planilha.');
 const remote=await readRemote(binding.id);
 if(remote.hash!==binding.hash)throw Error('Conflito: a planilha mudou desde a última carga. Baixe backup dos dados locais e clique em Carregar da planilha. Nenhum dado remoto foi sobrescrito.');
 const snapshot=JSON.parse(JSON.stringify(Finance.validate(db))),json=JSON.stringify(snapshot);
 await api(binding.id,':batchUpdate',{requests:requests(snapshot,remote.tabs)});
 // Readback distinguishes accepted writes from failed or concurrently replaced writes.
 const verified=await readRemote(binding.id),expected=await fingerprint(normalize(snapshot));
 if(verified.hash!==expected)throw Error('A confirmação da gravação divergiu. Preserve o backup local e recarregue antes de continuar.');
 binding.hash=verified.hash;binding.dirty=JSON.stringify(db)!==json;persist();status(binding.dirty?'Alterações mais recentes pendentes':'Salvo no Google Sheets · '+new Date().toLocaleTimeString('pt-BR'));if(binding.dirty)queue();
}
function normalize(d){return {accounts:d.accounts.map(a=>Object.fromEntries(AH.map(k=>[k,a[k]??'']))),transactions:d.transactions.map(t=>Object.fromEntries(TH.map(k=>[k,t[k]??''])))};}
async function run(fn){if(busy){error(Error('Aguarde a sincronização atual.'));return;}busy=true;window.JSLDataBusy=true;$('syncError').textContent='';try{await fn()}catch(e){error(e)}finally{busy=false;window.JSLDataBusy=false;}}
function queue(){clearTimeout(timer);if(connected)timer=setTimeout(()=>run(push),1200);}
window.addEventListener('finance-change',()=>{if(binding){binding.dirty=true;persist();status('Salvo neste navegador · envio à planilha pendente');queue();}});
$('connectGoogle').onclick=()=>run(async()=>{
 const url=$('sheetUrl').value.trim(),id=sheetId(url);await auth();const r=await readRemote(id);
 if(binding?.id===id){connected=true;if(binding.dirty){await push();}else{await pull();}return;}
 const localHas=db.accounts.length||db.transactions.length;
 if(localHas&&!confirm('Conectar outra planilha mantém uma cópia local apenas após sua escolha. Faça backup antes. Continuar?'))return;
 const load=confirm('OK: carregar os dados da planilha neste dispositivo. Cancelar: enviar os dados locais para a planilha (pedirá outra confirmação).');
 if(!load&&!confirm('Substituir todas as contas e lançamentos do modelo JSL na planilha pelos dados locais?'))return;
 binding={id,url,hash:r.hash,dirty:!load};persist();connected=true;
 if(load)await pull();else await push();
});
$('pullGoogle').onclick=()=>run(pull);$('pushGoogle').onclick=()=>run(push);
$('disconnectGoogle').onclick=()=>{if(busy){error(Error('Aguarde a sincronização atual.'));return;}if(binding?.dirty&&!confirm('Há dados locais não sincronizados. Desconectar mesmo assim? Eles continuarão neste navegador.'))return;clearTimeout(timer);if(token&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(token,()=>{});token='';expires=0;connected=false;binding=null;localStorage.removeItem(META);status('Desconectado · dados apenas neste navegador');};
$('createGoogle').onclick=()=>run(async()=>{await auth();const r=await fetch('https://sheets.googleapis.com/v4/spreadsheets',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({properties:{title:'JSL Finanças Pessoais',locale:'pt_BR',timeZone:'America/Sao_Paulo'},sheets:['Contas','Lancamentos','Config'].map((title,i)=>({properties:{title,sheetId:i,gridProperties:{rowCount:1000,columnCount:26,frozenRowCount:1}}}))})});if(!r.ok)throw Error('Não foi possível criar a planilha ('+r.status+').');const made=await r.json();$('sheetUrl').value=made.spreadsheetUrl;await api(made.spreadsheetId,':batchUpdate',{requests:requests({accounts:[],transactions:[]},made.sheets.map(s=>s.properties))});status('Planilha vazia criada. Clique em Conectar com Google para vinculá-la.');});
window.addEventListener('online',()=>{if(binding?.dirty)queue()});
window.addEventListener('beforeunload',e=>{if(busy||binding?.dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('storage',e=>{if(e.key===KEY||e.key==='jsl_local_vault_v1'){clearTimeout(timer);connected=false;token='';expires=0;status('Dados alterados em outra aba. Exporte seu JSON e recarregue antes de continuar.');document.querySelectorAll('#appShell button,#appShell input,#appShell select').forEach(x=>{if(x.id!=='exportar')x.disabled=true});}});

})();
