/* Local encrypted storage. No password or session key is persisted. */
(function(root){
'use strict';
const VAULT_KEY='jsl_local_vault_v1', LEGACY_KEY='jsl_financas_pessoais_v1', ITERATIONS=310000;
const clone=x=>JSON.parse(JSON.stringify(x));
function base64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function unbase64(s){if(typeof s!=='string'||s.length>24000000)throw Error('Arquivo criptografado inválido');return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
function username(s){s=String(s||'').trim().toLowerCase();if(s.length<3||s.length>80)throw Error('Use um usuário de 3 a 80 caracteres.');return s}
class Vault {
 constructor(storage,validate){this.storage=storage;this.validate=validate;this.key=null;this.record=null;this.raw=null;this.data=null;this.queue=Promise.resolve()}
 get exists(){return this.storage.getItem(VAULT_KEY)!==null}
 legacy(){const raw=this.storage.getItem(LEGACY_KEY);return raw===null?{accounts:[],transactions:[]}:this.validate(JSON.parse(raw))}
 parse(raw){const r=JSON.parse(raw);if(r.v!==1||r.iterations!==ITERATIONS||username(r.user)!==r.user||unbase64(r.salt).length!==16||unbase64(r.iv).length!==12||unbase64(r.cipher).length<16)throw Error('Cadastro local inválido. Use seu backup JSON para redefinir.');return r}
 async derive(password,salt){if(typeof password!=='string'||password.length<8||password.length>256)throw Error('A senha deve ter entre 8 e 256 caracteres.');const material=await root.crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return root.crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
 aad(r){return new TextEncoder().encode(JSON.stringify([r.v,r.user,r.salt,r.iterations]))}
 async encode(data,r,key){this.validate(data);const iv=root.crypto.getRandomValues(new Uint8Array(12));const cipher=await root.crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:this.aad(r)},key,new TextEncoder().encode(JSON.stringify(data)));return {...r,iv:base64(iv),cipher:base64(new Uint8Array(cipher))}}
 async setup(user,password,data,{replace=false,expectedRaw}={}){
 const before=this.storage.getItem(VAULT_KEY),oldLegacy=this.storage.getItem(LEGACY_KEY);
 if(before!==null&&!replace)throw Error('Já existe um cadastro neste navegador.');
 if(expectedRaw!==undefined&&before!==expectedRaw)throw Error('O cadastro mudou em outra aba. Recarregue.');
 user=username(user);const snapshot=clone(this.validate(data));const salt=root.crypto.getRandomValues(new Uint8Array(16));const key=await this.derive(password,salt);const r=await this.encode(snapshot,{v:1,user,salt:base64(salt),iterations:ITERATIONS},key);
 if(this.storage.getItem(VAULT_KEY)!==before||this.storage.getItem(LEGACY_KEY)!==oldLegacy)throw Error('Os dados mudaram em outra aba. Recarregue antes de cadastrar.');
 const raw=JSON.stringify(r);this.storage.setItem(VAULT_KEY,raw); // Failure preserves the previous state.
 this.key=key;this.record=r;this.raw=raw;this.data=snapshot;
 this.storage.removeItem(LEGACY_KEY);return clone(snapshot);
 }
 async unlock(user,password){const raw=this.storage.getItem(VAULT_KEY);if(raw===null)throw Error('Cadastre seu acesso primeiro.');const r=this.parse(raw);if(username(user)!==r.user)throw Error('Usuário ou senha incorretos.');const key=await this.derive(password,unbase64(r.salt));let data;try{const plain=await root.crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(r.iv),additionalData:this.aad(r)},key,unbase64(r.cipher));data=this.validate(JSON.parse(new TextDecoder().decode(plain)))}catch{throw Error('Usuário ou senha incorretos, ou dados locais danificados. Use seu backup JSON se necessário.')}
 if(this.storage.getItem(VAULT_KEY)!==raw)throw Error('Os dados mudaram em outra aba. Tente novamente.');this.key=key;this.record=r;this.raw=raw;this.data=clone(data);return clone(data)}
 write(data){const snapshot=clone(this.validate(data));const operation=async()=>{if(!this.key)throw Error('Faça login novamente.');if(this.storage.getItem(VAULT_KEY)!==this.raw)throw Error('Outra aba alterou os dados. Faça backup JSON antes de recarregar.');const key=this.key,r=await this.encode(snapshot,this.record,key);if(this.key!==key)throw Error('Sessão encerrada.');if(this.storage.getItem(VAULT_KEY)!==this.raw)throw Error('Outra aba alterou os dados. Faça backup JSON antes de recarregar.');const raw=JSON.stringify(r);this.storage.setItem(VAULT_KEY,raw);this.record=r;this.raw=raw;this.data=snapshot;return true};this.queue=this.queue.catch(()=>{}).then(operation);return this.queue}
 lock(){this.key=null;this.data=null;this.record=null;this.raw=null}
}
const api={Vault,VAULT_KEY,LEGACY_KEY,ITERATIONS};if(typeof module!=='undefined')module.exports=api;else root.JSLVault=api;
})(globalThis);
