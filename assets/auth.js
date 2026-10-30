'use strict';
(() => {
const el=id=>document.getElementById(id),vault=new JSLVault.Vault(localStorage,Finance.validate);
window.LocalVault=vault;
let mode=vault.exists?'login':'setup',recovery=null,recoveryRaw=null,working=false,opened=false;
function show(next){mode=next;el('authError').textContent='';el('loginForm').classList.toggle('hidden',mode!=='login');el('setupForm').classList.toggle('hidden',!['setup','recover'].includes(mode));el('recoveryForm').classList.toggle('hidden',mode!=='recover');el('forgot').classList.toggle('hidden',!vault.exists||mode!=='login');el('backLogin').classList.toggle('hidden',mode!=='recover');el('authTitle').textContent=mode==='login'?'Entrar no seu controle financeiro':mode==='recover'?'Redefinir acesso com backup':'Crie seu acesso local';el('setupSubmit').textContent=mode==='recover'?'Redefinir acesso e restaurar JSON':'Criar acesso e entrar';el('legacyNotice').textContent=mode==='setup'&&localStorage.getItem(JSLVault.LEGACY_KEY)?'Encontramos os dados anteriores deste navegador. Eles serão preservados e criptografados ao cadastrar seu acesso.':'';}
function controls(disabled){working=disabled;document.querySelectorAll('#authScreen button,#authScreen input').forEach(x=>x.disabled=disabled)}
async function run(fn){if(working)return;controls(true);el('authError').textContent='';try{await fn()}catch(e){el('authError').textContent=e.message}finally{controls(false)}}
function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('Não foi possível carregar o aplicativo. Recarregue a página.'));document.body.append(s)})}
async function openApp(){
 el('loginPass').value='';el('setupPass').value='';el('setupConfirm').value='';
 try{if(!opened){await loadScript('assets/app.js');await loadScript('assets/sheets.js');opened=true;}el('authScreen').classList.add('hidden');el('appShell').classList.remove('hidden');el('sessionUser').textContent=vault.record.user;el('sessionBar').classList.remove('hidden');el('logoutButton').focus();}
 catch(e){vault.lock();throw e;}
}
el('loginForm').onsubmit=e=>{e.preventDefault();return run(async()=>{await vault.unlock(el('loginUser').value,el('loginPass').value);await openApp()})};
el('setupForm').onsubmit=e=>{e.preventDefault();return run(async()=>{
 if(el('setupPass').value!==el('setupConfirm').value)throw Error('As senhas não conferem.');
 let data;if(mode==='recover'){if(!recovery)throw Error('Selecione e valide seu backup JSON primeiro.');if(!el('recoveryConfirm').checked)throw Error('Confirme que os dados serão substituídos pelo backup selecionado.');data=recovery;}else data=vault.legacy();
 await vault.setup(el('setupUser').value,el('setupPass').value,data,{replace:mode==='recover',...(mode==='recover'?{expectedRaw:recoveryRaw}:{})});
 if(mode==='recover'){localStorage.removeItem('jsl_google_binding_v2');el('recoveryFile').value='';recovery=null;}
 await openApp();
})};
el('forgot').onclick=()=>{recovery=null;recoveryRaw=localStorage.getItem(JSLVault.VAULT_KEY);el('recoveryFile').value='';el('recoveryInfo').textContent='';el('recoveryConfirm').checked=false;show('recover')};
el('backLogin').onclick=()=>{recovery=null;el('setupPass').value='';el('setupConfirm').value='';show('login')};
el('recoveryFile').onchange=async e=>{recovery=null;el('recoveryInfo').textContent='';try{const file=e.target.files[0];if(!file)return;if(file.size>16*1024*1024)throw Error('O backup excede 16 MiB.');recovery=Finance.validate(JSON.parse(await file.text()));el('recoveryInfo').textContent=`Backup validado: ${recovery.accounts.length} conta(s) e ${recovery.transactions.length} lançamento(s).`;el('authError').textContent='';}catch(e){el('authError').textContent='Backup inválido: '+e.message;el('recoveryFile').value=''}};
el('logoutButton').onclick=()=>{if(window.JSLDataBusy){alert('Aguarde a gravação ou sincronização terminar.');return}if(window.JSLUnsaved&&!confirm('Há alterações não gravadas. Baixe o JSON antes de sair. Encerrar mesmo assim?'))return;vault.lock();location.reload()};
window.addEventListener('storage',e=>{if(e.key===JSLVault.VAULT_KEY||e.key===JSLVault.LEGACY_KEY){if(!opened){recovery=null;recoveryRaw=localStorage.getItem(JSLVault.VAULT_KEY);show(vault.exists?'login':'setup');el('authError').textContent='Dados alterados em outra aba. Entre novamente.';}else{document.querySelectorAll('#appShell button,#appShell input,#appShell select').forEach(x=>{if(x.id!=='exportar')x.disabled=true});el('syncStatus').textContent='Outra aba alterou o cadastro ou os dados. Exporte o JSON desta aba e recarregue.';}}});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
if(!window.crypto?.subtle){el('authError').textContent='Este navegador precisa oferecer Web Crypto em HTTPS para proteger os dados.';controls(true);return;}
show(mode);
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
