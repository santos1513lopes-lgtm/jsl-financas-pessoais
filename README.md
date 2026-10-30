# JSL Finanças Pessoais · web

Aplicativo pessoal em português, adaptado do HTML original JSL v1. Página estática para GitHub Pages; funciona em computador e navegador de celular. Não conecta bancos, não movimenta dinheiro e não realiza recomendações de investimento.

## Acessar o aplicativo

[Abra o JSL Finanças Pessoais](https://santos1513lopes-lgtm.github.io/jsl-financas-pessoais/).

A página foi publicada no GitHub Pages. O modo local funciona sem Google. A sincronização entre dispositivos exige configurar o Client ID OAuth; ele ainda não está configurado nesta publicação. As instruções estão em [GOOGLE-SHEETS.md](docs/GOOGLE-SHEETS.md).

## Guias de dados

- [Google Sheets: modelo, Restrito, Editor/Leitor e configuração OAuth](docs/GOOGLE-SHEETS.md).
- [Firebase: análise do plano gratuito e roteiro de configuração/implementação](docs/FIREBASE.md).

A integração Firebase é uma proposta documentada; ela ainda não está implementada no aplicativo publicado.

## Recursos

- Cadastro de contas correntes/digitais e investimentos com saldo inicial.
- Receitas, despesas e transferências entre suas contas.
- Parcelamentos com centavos reconciliados e vencimentos ajustados ao último dia do mês.
- Recorrência mensal de valor integral por 12 meses (não é recorrência infinita).
- Status realizado/pendente, exclusão e filtros de histórico.
- Visão geral: saldos, patrimônio, resultado mensal, compromissos e últimos lançamentos.
- Projeção mensal de 3, 6, 12 ou 24 meses. A base inclui patrimônio total, inclusive investimentos; não representa apenas dinheiro líquido em conta.
- Backup JSON, restauração validada e reset com confirmação digitada.
- Google Sheets opcional: login Google, vínculo por URL, criação de planilha vazia, carga, gravação automática, gravação manual, desconexão e avisos de pendências/conflitos.
- Layout responsivo, manifesto web e cache dos arquivos da interface para uso local após a primeira carga. A sincronização requer internet e autorização válida.

## Publicar no GitHub Pages

1. Crie um repositório **público**, por exemplo `jsl-financas-pessoais`.
2. Envie o conteúdo desta pasta para a raiz da branch `main` (não envie a pasta `upload` nem backups pessoais).
3. Em **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, branch `main`, pasta `/ (root)` e salve.
4. Aguarde o GitHub mostrar a URL publicada. Abra a URL exibida em Pages; não é a URL dos arquivos do repositório.
5. Configure Google OAuth usando a origem HTTPS publicada. Veja [GOOGLE-SHEETS.md](docs/GOOGLE-SHEETS.md).

O arquivo `.nojekyll` permite servir diretamente os arquivos estáticos. A ação `.github/workflows/check.yml` executa os testes, sem publicar. Não precisa de servidor, instalação de dependências, chave de API secreta ou build para o site.

## Modelo Google Sheets

[Modelo criado no Google Sheets](https://docs.google.com/spreadsheets/d/1jk_SC-cq_XhKoA74sqI-17NFFBXJHelrL7apR1UI4SA/edit). O proprietário pode usá-lo ou fazer uma cópia. Para distribuir um modelo a terceiros, compartilhe apenas um modelo vazio como leitor; nunca uma planilha com dados financeiros. Cada pessoa usa sua própria cópia. O botão de criar planilha no app dispensa acesso ao modelo privado do proprietário.

## Primeiro uso

Sem Sheets: cadastre uma conta em **Contas e investimentos** e registre lançamentos. Os dados ficam no navegador, separados por origem/site e por perfil do navegador. O HTML antigo e o site publicado não compartilham armazenamento: exporte JSON no antigo e restaure no novo.

Com Sheets: configure OAuth uma vez, faça uma cópia do modelo (ou use **Criar planilha vazia no Google**), cole o link em **Backup e dados**, conecte e escolha carregar ou enviar. Use a mesma planilha nos dois dispositivos. Confirme o status “Salvo no Google Sheets” antes de alternar. No outro dispositivo, conecte/carregue antes de editar.

O link de editor **não é uma credencial de API**. A conta autenticada precisa ser proprietária ou ter permissão de edição. Não é necessário compartilhar como “qualquer pessoa com o link”. O código é público; a planilha e os dados pessoais devem continuar privados.

## Reset e recuperação

Baixe um backup antes. **Apagar todos os dados** exige digitar `APAGAR`, remove contas e lançamentos locais e, quando conectado, envia o estado vazio para a planilha. Sem conexão/autorização, o reset fica pendente e só é remoto após reconectar e salvar. Ele não apaga o arquivo de planilha, o repositório, backups externos, histórico de versões do Google ou cópias em outros dispositivos. Para reiniciar apenas este navegador sem alterar Sheets, desconecte antes do reset.

## Privacidade e limites

Os dados e a URL da planilha ficam no armazenamento local do navegador. Tokens Google ficam apenas na memória e expiram; o usuário reconecta quando solicitado. Não há senha própria, criptografia local, contas de usuário do aplicativo, analytics ou backend JSL. Quem acessar seu perfil de navegador poderá ver os dados locais. Desconectar Google não remove os dados locais; faça backup e reset se precisar limpar o dispositivo.

A autorização usada é o escopo Google Sheets (leitura/escrita de planilhas acessíveis à conta), mais amplo que apenas a planilha escolhida. O app só chama a planilha vinculada ou cria uma quando solicitado. Revogue a autorização nas permissões da conta Google se desejar.

A sincronização envia o estado completo e testa uma impressão digital do conteúdo remoto antes de gravar. Detecta também alterações diretas nas células que mudem os dados reconhecidos pelo aplicativo. Não é transação distribuída: Google Sheets não oferece compare-and-swap nessa operação; duas gravações rigorosamente simultâneas ainda podem conflitar. **Não edite simultaneamente em dois dispositivos.** Não há atualização automática de alterações remotas enquanto você edita; carregue antes de retomar.

Se houver conflito, não há sobrescrita deliberada: exporte o backup local, carregue a planilha e reconcilie os registros manualmente. Não há mesclagem automática. Falhas de rede deixam os dados locais e um aviso; uma resposta perdida após gravação pode exigir recarregar. Limites por base: 1.000 contas e 20.000 lançamentos. A planilha deve ser dedicada ao app; os intervalos de dados das abas Contas, Lancamentos e Config são substituídos pelo app.

No celular, abra no navegador. O manifesto permite uso como app quando o navegador oferecer instalação/adicionar à tela inicial; não é um APK nem app nativo de loja. O comportamento de instalação depende do navegador. Login Google não funciona offline. Os arquivos offline só ficam disponíveis após a primeira carga online e dependem do armazenamento do navegador.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Interface em português |
| `assets/style.css` | Estilo responsivo |
| `assets/app.js` | Contas, lançamentos, projeção, armazenamento e backup |
| `assets/core.js` | Validação e cálculo do calendário/parcelas |
| `assets/sheets.js` | Autorização Google e sincronização Sheets |
| `config.js` | Client ID OAuth público e URL opcional do modelo |
| `manifest.webmanifest`, `assets/icon.svg`, `sw.js` | Identidade e cache offline da interface |
| `docs/GOOGLE-SHEETS.md` | Instalação OAuth e estrutura da base |
| `docs/FIREBASE.md` | Análise e roteiro para Firebase Authentication + Cloud Firestore (ainda não integrado) |
| `docs/TESTES.md` | Validação e testes externos ainda necessários |
| `tests/*.test.cjs` | Testes executáveis sem dependências |
| `.github/workflows/check.yml` | Testes no GitHub Actions |
| `.gitignore`, `.nojekyll` | Exclusões de dados privados e publicação estática |

## Desenvolvimento

Requer Node.js 20+ somente para testes: `node --test tests/*.test.cjs`. Para executar localmente, sirva esta pasta com um servidor HTTP local, por exemplo `python3 -m http.server 8000`. OAuth local requer cadastrar `http://localhost:8000` nas origens autorizadas.

Nunca coloque tokens, senhas, client secrets, planilhas preenchidas ou backups financeiros no repositório. O `googleClientId` é público por definição; `client_secret` nunca é usado no navegador.
