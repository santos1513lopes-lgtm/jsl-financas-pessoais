/* Shared validation and scheduling; no network or credentials. */
(function(root){
'use strict';
const id = s => typeof s==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(s);
const text = s => typeof s==='string' && s.length<=1000;
const localDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !isNaN(d)&&localDate(d)===s;}
function monthDate(s,n){if(!validDate(s))throw Error('Data inválida');const [y,m,d]=s.split('-').map(Number);const end=new Date(y,m-1+n+1,0,12).getDate();return localDate(new Date(y,m-1+n,Math.min(d,end),12));}
function schedule(amount,date,mode,count){
 const cents=Math.round(amount*100);
 if(!Number.isSafeInteger(cents)||cents<1||!validDate(date))throw Error('Valor ou data inválidos');
 const n=mode==='recorrente'?12:mode==='parcelada'?Math.max(2,Math.min(120,Math.trunc(count)||2)):1;
 if(mode==='parcelada'&&cents<n)throw Error('O total deve permitir parcelas de pelo menos R$ 0,01');
 const base=mode==='recorrente'?cents:Math.floor(cents/n),rest=mode==='recorrente'?0:cents%n;
 return Array.from({length:n},(_,i)=>({amount:(base+(i<rest?1:0))/100,date:monthDate(date,i)}));
}
function validate(data){
 if(!data||!Array.isArray(data.accounts)||!Array.isArray(data.transactions)||data.accounts.length>1000||data.transactions.length>20000)throw Error('Estrutura de dados inválida ou limite excedido (1.000 contas / 20.000 lançamentos)');
 const ids=new Set(),txids=new Set();
 for(const a of data.accounts){if(!a||!id(a.id)||ids.has(a.id)||!text(a.name)||!a.name.trim()||!['conta','investimento'].includes(a.kind)||!text(a.modality)||!Number.isFinite(a.initial)||Math.abs(a.initial)>1e12)throw Error('Conta inválida');ids.add(a.id);}
 for(const t of data.transactions){if(!t||!id(t.id)||txids.has(t.id)||!['receita','despesa','transferencia'].includes(t.type)||!text(t.description)||!text(t.category)||!validDate(t.date)||!Number.isFinite(t.amount)||t.amount<=0||t.amount>1e12||!ids.has(t.accountId)||!['pago','pendente'].includes(t.status)||t.installment!==undefined&&!text(t.installment)||t.type==='transferencia'&&(!ids.has(t.toAccountId)||t.toAccountId===t.accountId))throw Error('Lançamento inválido');txids.add(t.id);}
 return data;
}
const api={localDate,validDate,monthDate,schedule,validate};root.Finance=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
