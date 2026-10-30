# Login local e recuperação

## Primeiro acesso

1. Abra o site no navegador que pretende usar.
2. Crie um usuário de 3 a 80 caracteres e uma senha de 8 a 256 caracteres; confirme a senha. O usuário ignora maiúsculas/minúsculas e espaços nas pontas.
3. O aplicativo preserva os registros anteriores encontrados neste navegador e os criptografa. Se a migração não puder ser salva, o original é mantido.
4. Faça um backup em **Configurações → Baixar backup JSON** e guarde-o em local seguro. Faça novos backups depois de alterações importantes.

## Próximas aberturas

Cada carregamento exige usuário e senha. A sessão permanece aberta enquanto a página está aberta; use **Sair e bloquear** antes de deixar o aparelho com outra pessoa. Não há encerramento automático por inatividade.

O cadastro pertence ao perfil do navegador e ao endereço do site. Outro navegador ou celular terá seu próprio cadastro; restaure um JSON para transferir dados. Não há contas em servidor nem sincronização automática de login ou dados entre aparelhos. O código público no GitHub não contém seus lançamentos.

## Esqueci o usuário ou a senha

1. Na entrada, clique em **Esqueci meu usuário ou senha**.
2. Selecione o arquivo JSON que exportou anteriormente. O aplicativo valida a estrutura antes de prosseguir.
3. Confirme que os registros locais serão substituídos pelo conteúdo do backup. Alterações posteriores àquele backup serão perdidas.
4. Informe novo usuário e nova senha, confirme e clique em **Redefinir acesso e restaurar JSON**.

A senha antiga não é recuperada. Sem a senha e sem um JSON válido, não é possível recuperar os registros cifrados. O reset não exige que o backup tenha uma senha: quem possui o JSON pode ler e importar seus dados. Não compartilhe esse arquivo publicamente. A vinculação anterior ao Sheets é removida na recuperação; reconecte somente após conferir os registros.

**Apagar todos os dados**, dentro do aplicativo, apaga contas e lançamentos e mantém o cadastro de acesso. A recuperação de senha substitui também o cadastro. Nenhuma dessas operações apaga backups que você baixou.

## Implementação e limites

- `assets/vault.js`: armazenamento local criptografado com AES-GCM de 256 bits, IV aleatório por gravação, sal aleatório por cadastro e chave derivada com PBKDF2 SHA-256 (310.000 iterações). A senha e a chave não são gravadas no armazenamento local. O usuário fica visível no registro do cadastro.
- `assets/auth.js`: cadastro, login, bloqueio e recuperação condicionada à validação do JSON e confirmação de substituição. A interface financeira é carregada depois do desbloqueio.
- `assets/app.js` e `assets/sheets.js`: persistência financeira passa pelo cofre; tokens Google continuam apenas em memória. O login local não configura nem substitui o OAuth do Google.
- `sw.js`: cache atualizado para incluir os novos arquivos. HTTPS e Web Crypto são necessários. Falhas de armazenamento exibem aviso: exporte o JSON antes de fechar.
- `tests/vault.test.cjs`: migração, desbloqueio, senha incorreta, adulteração, troca de credenciais, conflito entre abas e falha de armazenamento. Execute `node --test tests/*.test.cjs`.

A proteção é local, sem backend de autenticação. Ela não impede alguém de apagar o armazenamento ou modificar uma cópia do código, e não protege uma sessão já desbloqueada contra extensões maliciosas ou scripts comprometidos. Páginas do mesmo domínio GitHub Pages compartilham a origem do navegador; publique somente código confiável nessa conta. Evite abas simultâneas: ao detectar alterações, o app bloqueia edição na outra aba para evitar sobrescrita; exporte seu JSON e recarregue.

Os backups JSON e os dados enviados ao Sheets permanecem legíveis nos respectivos arquivos/serviços. A criptografia local não os criptografa. Limpar o armazenamento do navegador remove o cadastro e o cofre; reinstalar ou atualizar o site não é um backup.
