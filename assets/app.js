
const KEY='jsl_financas_pessoais_v1';
let db;
try{db=Finance.validate(JSON.parse(localStorage.getItem(KEY)||'null')||{accounts:[],transactions:[]})}catch(e){db={accounts:[],transactions:[]};alert('Dados locais inválidos. Exporte o conteúdo do armazenamento antes de continuar; nada será sobrescrito automaticamente.')}

const $=id=>document.getElementById(id);
const money=n=>(Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dateISO=()=>Finance.localDate(new Date());
const parseDate=s=>new Date(s+'T12:00:00');
const fmtDate=s=>s?parseDate(s).toLocaleDateString('pt-BR'):'—';
const monthKey=s=>(s||'').slice(0,7);
const monthLabel=s=>{let [y,m]=s.split('-');return new Date(+y,+m-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})};
function save(){try{Finance.validate(db);localStorage.setItem(KEY,JSON.stringify(db));render();window.dispatchEvent(new Event('finance-change'))}catch(e){alert('Não foi possível salvar: '+e.message)}}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function account(id){return db.accounts.find(a=>a.id===id)}
function balance(a){let n=Number(a.initial)||0;db.transactions.forEach(t=>{if(t.status!=='pago')return;if(t.type==='receita'&&t.accountId===a.id)n+=t.amount;if(t.type==='despesa'&&t.accountId===a.id)n-=t.amount;if(t.type==='transferencia'){if(t.accountId===a.id)n-=t.amount;if(t.toAccountId===a.id)n+=t.amount}});return n}
function allBalances(){return db.accounts.reduce((s,a)=>s+balance(a),0)}
function isInv(a){return a&&a.kind==='investimento'}
function fillAccounts(){let opts=db.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}${isInv(a)?' (Investimento)':''}</option>`).join('');$('conta').innerHTML=opts;$('destino').innerHTML=opts}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function transactionRows(items){if(!items.length)return '<div class="empty">Nenhum lançamento cadastrado.</div>';return `<table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Conta</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>${items.map(t=>`<tr><td>${fmtDate(t.date)}</td><td>${esc(t.description)}${t.installment?`<br><small class="muted">${esc(t.installment)}</small>`:''}</td><td>${t.type==='despesa'?'Despesa':t.type==='receita'?'Receita':'Transferência'}</td><td>${esc(account(t.accountId)?.name||'—')}${t.type==='transferencia'?' → '+esc(account(t.toAccountId)?.name||'—'):''}</td><td class="${t.type==='receita'?'green':t.type==='despesa'?'red':''}">${money(t.amount)}</td><td><span class="pill ${t.status}">${t.status==='pago'?'Realizado':'Pendente'}</span></td><td><button class="smallbtn" onclick="toggleTx('${t.id}')">${t.status==='pago'?'Reabrir':'Marcar realizado'}</button> <button class="smallbtn danger" onclick="delTx('${t.id}')">Excluir</button></td></tr>`).join('')}</tbody></table>`}
function render(){
fillAccounts();
let current=new Date(),mk=dateISO().slice(0,7),paid=db.transactions.filter(t=>t.status==='pago'&&monthKey(t.date)===mk);
let inc=paid.filter(t=>t.type==='receita').reduce((s,t)=>s+t.amount,0),out=paid.filter(t=>t.type==='despesa').reduce((s,t)=>s+t.amount,0);
let bank=db.accounts.filter(a=>!isInv(a)).reduce((s,a)=>s+balance(a),0),inv=db.accounts.filter(isInv).reduce((s,a)=>s+balance(a),0);
$('mContas').textContent=money(bank);$('mInvest').textContent=money(inv);$('mPatrimonio').textContent=money(bank+inv);$('mResultado').textContent=money(inc-out);$('receitasMes').textContent=money(inc);$('despesasMes').textContent=money(out);
let upcoming=db.transactions.filter(t=>t.status==='pendente'&&t.date>=dateISO()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);
$('proximos').innerHTML=upcoming.length?upcoming.map(t=>`<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:7px 0"><span>${fmtDate(t.date)} · ${esc(t.description)}</span><b class="${t.type==='receita'?'green':'red'}">${money(t.amount)}</b></div>`).join(''):'<p class="muted">Nenhum compromisso futuro.</p>';
$('ultimos').innerHTML=transactionRows([...db.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7));
let f=$('filtro')?.value||'todos';let arr=[...db.transactions].sort((a,b)=>b.date.localeCompare(a.date));if(['despesa','receita','transferencia'].includes(f))arr=arr.filter(t=>t.type===f);if(['pago','pendente'].includes(f))arr=arr.filter(t=>t.status===f);$('listaLanc').innerHTML=transactionRows(arr);
$('listaContas').innerHTML=db.accounts.length?`<table><thead><tr><th>Instituição</th><th>Tipo</th><th>Modalidade</th><th>Saldo atual</th><th></th></tr></thead><tbody>${db.accounts.map(a=>`<tr><td>${esc(a.name)}</td><td>${isInv(a)?'Investimento':'Conta'}</td><td>${esc(a.modality)}</td><td>${money(balance(a))}</td><td><button class="smallbtn danger" onclick="delAccount('${a.id}')">Excluir</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty">Cadastre sua primeira conta.</div>';
projection();
}
function projection(){
let n=+$('horizonte').value||6,base=$('baseProjecao').value,now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),1);
let bal=base==='atual'?allBalances():0,rows=[];
for(let i=0;i<n;i++){let d=new Date(start.getFullYear(),start.getMonth()+i,1),key=Finance.localDate(d).slice(0,7),ts=db.transactions.filter(t=>monthKey(t.date)===key&&t.status==='pendente'),ri=ts.filter(t=>t.type==='receita').reduce((s,t)=>s+t.amount,0),de=ts.filter(t=>t.type==='despesa').reduce((s,t)=>s+t.amount,0);bal+=ri-de;rows.push({key,ri,de,bal})}
$('tabelaProjecao').innerHTML=`<table><thead><tr><th>Mês</th><th>Receitas previstas</th><th>Despesas previstas</th><th>Saldo projetado</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${monthLabel(r.key)}</td><td class="green">${money(r.ri)}</td><td class="red">${money(r.de)}</td><td><b>${money(r.bal)}</b></td></tr>`).join('')}</tbody></table>`;
}
function toggleTx(id){let t=db.transactions.find(x=>x.id===id);if(!t)return;t.status=t.status==='pago'?'pendente':'pago';save()}
function delTx(id){if(confirm('Excluir este lançamento?')){db.transactions=db.transactions.filter(t=>t.id!==id);save()}}
function delAccount(id){if(db.transactions.some(t=>t.accountId===id||t.toAccountId===id)){alert('Esta conta possui lançamentos vinculados. Exclua ou transfira esses lançamentos antes.');return}if(confirm('Excluir esta conta?')){db.accounts=db.accounts.filter(a=>a.id!==id);save()}}
$('tipo').addEventListener('change',()=>{let tr=$('tipo').value==='transferencia';$('formaField').classList.toggle('hidden',tr);$('statusField').classList.toggle('hidden',tr);$('destinoField').classList.toggle('hidden',!tr);$('categoria').disabled=tr;$('parcelasField').classList.add('hidden')});
$('forma').addEventListener('change',()=>{$('parcelasField').classList.toggle('hidden',$('forma').value!=='parcelada');$('valueLabel').textContent=$('forma').value==='recorrente'?'Valor mensal (R$)':'Valor total (R$)'});
$('formLanc').addEventListener('submit',e=>{
e.preventDefault();if(!db.accounts.length){alert('Cadastre uma conta antes de lançar movimentações.');return}
let type=$('tipo').value,amount=+$('valor').value,date=$('data').value,acc=$('conta').value;if(!Number.isFinite(amount)||amount<=0||!Finance.validDate(date)){alert('Informe valor e data válidos.');return}if(!acc){alert('Selecione uma conta.');return}
if(type==='transferencia'){let to=$('destino').value;if(!to||to===acc){alert('Selecione uma conta de destino diferente.');return}db.transactions.push({id:uid(),type,description:$('descricao').value,amount,date,accountId:acc,toAccountId:to,status:'pago',category:'Transferência'});}
else{const form=type==='despesa'?$('forma').value:'avista';
let schedule;try{schedule=Finance.schedule(amount,date,form,+$('parcelas').value)}catch(e){alert(e.message);return;}
for(let i=0;i<schedule.length;i++){const item=schedule[i];db.transactions.push({id:uid(),type,description:$('descricao').value,category:$('categoria').value,amount:item.amount,date:item.date,accountId:acc,status:i===0&&$('status').value==='pago'?'pago':'pendente',installment:form==='recorrente'?`Recorrente ${i+1}/12`:schedule.length>1?`${i+1}/${schedule.length}`:''})}}
$('formLanc').reset();$('data').value=dateISO();$('parcelasField').classList.add('hidden');save();alert('Lançamento salvo com sucesso!')});
$('formConta').addEventListener('submit',e=>{e.preventDefault();db.accounts.push({id:uid(),name:$('nomeConta').value,kind:$('tipoConta').value,modality:$('modalidade').value,initial:+$('saldoInicial').value||0});$('formConta').reset();$('saldoInicial').value=0;save();alert('Conta cadastrada!')});
$('filtro').addEventListener('change',render);$('horizonte').addEventListener('change',projection);$('baseProjecao').addEventListener('change',projection);
document.querySelectorAll('.tab[data-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab[data-tab]').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.tab).classList.add('active');render()}));
$('exportar').onclick=()=>{let blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='JSL-Financas-Backup-'+dateISO()+'.json';a.click();URL.revokeObjectURL(a.href)};
$('importar').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let data=Finance.validate(JSON.parse(await f.text()));if(confirm('Restaurar este backup? Os dados atuais serão substituídos.')){db=data;save();alert('Backup restaurado.')}}catch(err){alert('Arquivo de backup inválido.')}e.target.value=''};
$('limparTudo').onclick=()=>{if(prompt('Isso apagará contas e lançamentos locais e enviará a exclusão à planilha se conectada. Faça backup antes. Digite APAGAR para confirmar:')==='APAGAR'){db={accounts:[],transactions:[]};save()}};
$('data').value=dateISO();render();

$('formLanc').addEventListener('reset',()=>setTimeout(()=>{$('tipo').dispatchEvent(new Event('change'));$('data').value=dateISO();$('valueLabel').textContent='Valor total (R$)'},0));
if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
