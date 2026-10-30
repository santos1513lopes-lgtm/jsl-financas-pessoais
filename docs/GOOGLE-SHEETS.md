# Google Sheets como base de dados

## Por que o link não basta

Um link de compartilhamento identifica a planilha e as permissões humanas; ele não fornece token OAuth para uma aplicação gravar na API. Este projeto usa Google Identity Services no navegador com um Client ID público. A conta que entrar no Google deve ter acesso de edição à planilha.

## Configuração feita uma vez pelo administrador do site

1. No [Google Cloud Console](https://console.cloud.google.com/), crie ou selecione um projeto.
2. Ative **Google Sheets API** em APIs e serviços.
3. Configure a tela de consentimento/Google Auth Platform: nome, e-mail de suporte, público e escopo `https://www.googleapis.com/auth/spreadsheets`.
4. Para uso pessoal, mantenha o aplicativo em teste e inclua sua conta em usuários de teste. Outras pessoas também precisam ser adicionadas enquanto estiver em teste. A disponibilidade pública para qualquer conta pode exigir publicação/verificação pelo Google; não está configurada automaticamente por este código.
5. Crie uma credencial **OAuth 2.0 Client ID → Web application**.
6. Em **Authorized JavaScript origins**, cadastre a origem exata da página publicada: protocolo e domínio, sem o caminho do repositório. Exemplo apenas: `https://SEU-USUARIO.github.io`.
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
