# Verificação da versão 2.3

Execute `node --test tests/*.test.cjs` e a verificação de sintaxe dos arquivos JavaScript ativos.

Os testes automatizados cobrem calendário, parcelas, recorrência, validação de backups, fluxo de cadastro/login/recuperação, criptografia, falha de armazenamento e conflito entre abas. Os testes simulados da antiga integração com planilhas foram removidos junto com essa integração.

## Verificação manual

1. Abrir o site HTTPS e criar o cadastro ou entrar no cadastro existente.
2. Conferir as contas e lançamentos já salvos.
3. Abrir **Backup e dados**: devem existir apenas exportação JSON e restauração/atualização JSON.
4. Exportar um JSON de teste. Em outro navegador, criar o acesso e restaurar o arquivo.
5. Conferir que a restauração substitui os registros, mantém as credenciais do destino e persiste após novo login.
6. Verificar que um arquivo inválido é rejeitado sem substituir os registros.
7. Testar recuperação de acesso com JSON válido; sem arquivo ou sem confirmação o reset deve ser bloqueado.

Testes em aparelho físico, instalação e uso offline dependem de validação no navegador/dispositivo escolhido pelo usuário.
