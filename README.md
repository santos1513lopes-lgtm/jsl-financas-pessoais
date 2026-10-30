# JSL Finanças Pessoais · web 2.3

Aplicativo pessoal em português para computador e celular, publicado no GitHub Pages. Os registros são salvos e criptografados no navegador. Não há backend, integração com planilhas, sincronização automática entre aparelhos ou conexão com bancos financeiros.

[Abrir aplicativo](https://santos1513lopes-lgtm.github.io/jsl-financas-pessoais/)

## Funcionalidades

- Cadastro local de usuário e senha; login exigido a cada abertura e botão **Sair e bloquear**.
- Migração dos dados antigos do mesmo navegador para armazenamento criptografado.
- Contas e investimentos com saldo inicial; receitas, despesas e transferências internas.
- Parcelamentos com centavos reconciliados e ajuste de vencimentos; recorrência mensal por 12 meses.
- Status realizado/pendente, exclusão, filtros e visão geral de saldos, patrimônio e resultado mensal.
- Projeção de 3, 6, 12 ou 24 meses, incluindo investimentos no patrimônio total.
- Aba **Backup e dados** exclusivamente para exportação e restauração/atualização por JSON.
- Recuperação de acesso mediante backup JSON válido e confirmação da substituição dos dados.
- Layout responsivo, manifesto web e cache da interface após primeira carga online. A instalação pelo navegador depende de suporte no dispositivo.

## Primeiro acesso e login

Crie usuário e senha (mínimo de 8 caracteres). Nas próximas aberturas, entre com essas credenciais. Cada navegador/perfil tem seu próprio cadastro e registros. [Detalhes sobre login e recuperação](docs/LOGIN-LOCAL.md).

## Backup, restauração e atualização entre aparelhos

1. Depois de entrar, abra **Backup e dados** e clique em **Baixar backup JSON**.
2. Guarde o arquivo com segurança. Ele contém seus dados financeiros legíveis, sem senha.
3. Para restaurar ou atualizar outro aparelho, transfira esse arquivo manualmente e entre no aplicativo no aparelho de destino.
4. Em **Backup e dados**, clique em **Restaurar / atualizar por JSON**, selecione o arquivo e confirme a substituição.

A importação valida a estrutura e as referências entre registros antes de substituir os dados. Ela **substitui todas as contas e lançamentos atuais**, sem mesclagem. Exporte os dados atuais antes de importar e use o backup mais recente para evitar perder registros novos. A importação normal mantém o usuário e a senha do navegador de destino.

A atualização não é automática: escolha um aparelho para editar por vez, exporte e transfira a versão mais recente antes de continuar no outro. Não há envio dos registros ao GitHub. Não publique backups financeiros no repositório.

## Esqueci o acesso

Clique em **Esqueci meu usuário ou senha**, selecione um JSON válido, confirme a substituição e crie novas credenciais. A recuperação substitui os dados pelo conteúdo do backup; registros posteriores a ele não são recuperados. Sem senha e sem JSON não há recuperação dos dados cifrados.

## Privacidade e limites

A senha não é persistida. Os registros financeiros locais usam AES-GCM com chave derivada por PBKDF2, mantida em memória durante a sessão. O usuário fica visível no cadastro local. Essa proteção não cobre arquivos JSON exportados, sessões desbloqueadas, extensões maliciosas ou código comprometido.

Limpar os dados do navegador pode apagar o cadastro e os registros. Faça backups periódicos. Limites de validação: 1.000 contas e 20.000 lançamentos. O aplicativo não movimenta dinheiro nem oferece recomendações de investimento.

## Publicar no GitHub Pages

1. Envie os arquivos à raiz da branch `main` de um repositório público, mantendo `index.html` na raiz.
2. Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main`, pasta `/ (root)` e salve.
3. Aguarde a publicação e abra o endereço mostrado no GitHub Pages.

Não exige Google Cloud, credenciais de API, banco externo ou build. Para testar a aplicação localmente, use um servidor HTTP em localhost; abrir diretamente como `file://` não é o fluxo suportado. Para a publicação, use HTTPS.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html`, `assets/style.css` | Interface e layout responsivo |
| `assets/app.js` | Contas, lançamentos, projeções e backup JSON |
| `assets/core.js` | Validação e cálculo de parcelas/calendário |
| `assets/vault.js` | Armazenamento financeiro criptografado |
| `assets/auth.js` | Cadastro, login e recuperação com JSON |
| `manifest.webmanifest`, `assets/icon.svg`, `sw.js` | Identidade e cache da interface |
| `docs/LOGIN-LOCAL.md` | Acesso e recuperação |
| `docs/TESTES.md`, `tests/*.test.cjs` | Verificação e testes automatizados |
| `.github/workflows/check.yml` | Testes no GitHub Actions |
| `docs/FIREBASE.md` | Estudo anterior; não representa recurso implementado |

A integração com Google Sheets foi removida na versão 2.3. Os dados financeiros existentes e as credenciais locais são preservados. Metadados antigos de conexão eventualmente presentes no navegador ficam inativos; a versão atual não os utiliza nem conecta serviços externos.

## Desenvolvimento

Node.js 22 para testes: `node --test tests/*.test.cjs`. Verifique a sintaxe de `assets/core.js`, `assets/vault.js`, `assets/auth.js`, `assets/app.js` e `sw.js`. Nunca envie senhas ou backups pessoais ao repositório.
