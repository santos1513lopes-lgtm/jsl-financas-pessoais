# Google Sheets como base de dados

## Por que o link não basta

Um link de compartilhamento identifica a planilha e as permissões humanas; ele não fornece token OAuth para uma aplicação gravar na API. Este projeto usa Google Identity Services no navegador com um Client ID público. A conta que entrar no Google deve ter acesso de edição à planilha.

## Qual opção escolher em Compartilhar?

**“Restrito” e “Editor/Leitor” são configurações diferentes.** Restrito define quem pode acessar; Editor ou Leitor define o que uma pessoa autorizada pode fazer.

| Situação | Acesso geral | Permissão da conta usada no aplicativo |
| --- | --- | --- |
| A planilha e o login do aplicativo usam a mesma conta Google | Restrito | Proprietário: já tem permissão, não precisa compartilhar com ninguém |
| A planilha pertence a uma conta, mas você entrará no aplicativo com outra | Restrito | Adicione o e-mail da outra conta como Editor |
| Alguém só precisa consultar seus dados | Restrito | Leitor; essa pessoa não conseguirá gravar pelo aplicativo |
| Você distribui apenas um modelo vazio para outras pessoas copiarem | Conforme a distribuição pretendida | Leitor no modelo; cada pessoa será proprietária da própria cópia |

Não use “Qualquer pessoa com o link — Editor” na sua base financeira. Não compartilhe com um e-mail de serviço ou com o ChatGPT: esta versão usa a sua própria conta Google autenticada no navegador.

## Onde está o modelo e o que fazer agora?

O [modelo JSL já foi criado no Google Sheets](https://docs.google.com/spreadsheets/d/1jk_SC-cq_XhKoA74sqI-17NFFBXJHelrL7apR1UI4SA/edit) e foi colocado na pasta ChatGPT do Drive conectado durante a preparação do projeto. Não é necessário baixar um Excel e subir novamente.

1. Abra o modelo com a conta Google em que ele foi criado.
2. Para manter o modelo vazio, use **Arquivo → Fazer uma cópia**, dê um nome à sua base e salve no seu Drive. Você também pode usar o modelo diretamente se preferir.
3. Na cópia, clique em **Compartilhar**.
4. Em **Acesso geral**, deixe **Restrito**.
5. Se o login do aplicativo será com outra conta, adicione somente esse e-mail como **Editor**. Se for a mesma conta, pule esta etapa.
6. Clique em **Copiar link** e **Concluído**.
7. **Antes de vincular, conclua a configuração OAuth abaixo. Ela ainda está pendente no site publicado.**
8. No aplicativo, abra **Backup e dados**, cole o link da sua cópia e clique em **Conectar com Google**.
9. Entre com a conta proprietária ou editora. Escolha carregar os dados da planilha ou enviar os locais, conforme as confirmações na tela.
10. Espere o status de gravação no Google Sheets antes de alternar para outro dispositivo.

**Copiar o link não autoriza a API.** Enquanto o Client ID OAuth não estiver configurado, a planilha não está conectada e os lançamentos ficam apenas no navegador.

Fonte: [permissões e acesso restrito no Google Drive](https://support.google.com/drive/answer/7166529).

## Configuração feita uma vez pelo administrador do site

1. No [Google Cloud Console](https://console.cloud.google.com/), crie ou selecione um projeto.
2. Ative **Google Sheets API** em APIs e serviços.
3. Configure a tela de consentimento/Google Auth Platform: nome, e-mail de suporte, público e escopo `https://www.googleapis.com/auth/spreadsheets`.
4. Para uso pessoal, mantenha o aplicativo em teste e inclua sua conta em usuários de teste. Outras pessoas também precisam ser adicionadas enquanto estiver em teste. A disponibilidade pública para qualquer conta pode exigir publicação/verificação pelo Google; não está configurada automaticamente por este código.
5. Crie uma credencial **OAuth 2.0 Client ID → Web application**.
6. Em **Authorized JavaScript origins**, cadastre a origem exata da página publicada: protocolo e domínio, sem o caminho do repositório. Para este repositório: `https://santos1513lopes-lgtm.github.io`.
7. Para testes locais, cadastre também `http://localhost:8000` se esse for o endereço utilizado.
8. Copie o Client ID (termina em `.apps.googleusercontent.com`) para `googleClientId` em `config.js` e envie o commit. Não há client secret no projeto.
9. Alternativamente, cole o Client ID no campo de configuração avançada em **Backup e dados**. Ele é público e fica lembrado apenas no navegador; configurar o arquivo evita repetir isso em cada dispositivo.

## Para cada usuário

1. Faça uma cópia do modelo JSL no próprio Drive. Ou clique em **Criar planilha vazia no Google** no aplicativo, depois da configuração OAuth.
2. Mantenha o compartilhamento **Restrito**. Para outra conta sua, compartilhe explicitamente com essa conta como editor; não torne as finanças públicas.
3. Copie a URL da planilha e cole em **Link da sua planilha Google Sheets**.
4. Clique **Conectar com Google**, selecione a conta com acesso e autorize.
5. Na primeira conexão, confirme **OK** para carregar o conteúdo remoto ou **Cancelar** para enviar o local, seguido da confirmação de substituição.
6. Confira o indicador de sincronização. Cada alteração dispara envio após aproximadamente 1,2 segundo, se a conexão/autorização estiver ativa.
7. No celular, abra o mesmo site, use o mesmo link e conecte. Faça carga antes de editar e espere a confirmação de gravação antes de alternar dispositivos.

O botão de criar planilha cria a estrutura na conta autenticada, mas não a vincula sem a ação explícita de conectar. A configuração OAuth do projeto é um requisito externo, não pode ser substituída pelo link de editor.

## Estrutura do modelo (schema `jsl-v2`)

A linha 1 contém cabeçalhos exatos, sem tradução. O aplicativo escreve strings como `stringValue`, sem executar fórmulas originadas em descrições ou nomes.

- **Contas**: `id`, `name`, `kind`, `modality`, `initial`.
- **Lancamentos**: `id`, `type`, `description`, `category`, `amount`, `date`, `accountId`, `toAccountId`, `status`, `installment`.
- **Config**: `key`, `value`; segunda linha: `schema`, `jsl-v2`. Linhas seguintes registram revisão e horário da última gravação.
- **Instrucoes**: guia humano; não é alterado pelo aplicativo.

Tipos: conta `conta`/`investimento`; lançamento `receita`/`despesa`/`transferencia`; status `pago`/`pendente`; datas ISO `AAAA-MM-DD`; valores numéricos em reais. IDs vinculam as contas aos lançamentos. Não altere a estrutura. Cada planilha representa uma base pessoal, não um servidor com isolamento por usuário.

## Falhas comuns

- **Origin mismatch / invalid_client**: confira origem HTTPS exata, tipo Web application e Client ID.
- **Access blocked / app em teste**: adicione a conta como usuário de teste no Google Cloud.
- **403**: verifique permissão de editor, API Sheets ativada e escopo autorizado.
- **Autorização expirada**: clique em conectar novamente. O token não é guardado entre sessões.
- **Formato incompatível**: use o modelo, sem renomear as abas/cabeçalhos. O aplicativo rejeita bases de outro formato.
- **Conflito**: exporte backup local; carregue a planilha e reconcilie manualmente. Não há botão silencioso para forçar sobrescrita de conflito.
- **Offline**: os registros ficam locais. Reconecte, verifique conflitos e salve antes de continuar em outro dispositivo.

## Referências oficiais para configuração

- [Modelo de token do Google Identity Services](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Escopos de autorização do Sheets](https://developers.google.com/workspace/sheets/api/scopes)
- [Criação de sites no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

A configuração real do projeto Google Cloud e a aprovação OAuth não fazem parte de um commit de código e devem ser feitas na conta do administrador.
