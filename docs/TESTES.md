# Verificação da versão 2.0

## Executado nesta preparação

- `node --test tests/*.test.cjs`: 7 testes aprovados.
- Verificação sintática de `core.js`, `app.js`, `sheets.js` e `sw.js`.
- Casos: valor mensal integral na recorrência, reconciliação dos centavos, rejeição de parcela inferior a 1 centavo, fim de mês, ano bissexto, virada do ano, referências de contas e rejeição de backups inválidos.
- Simulação da API Sheets: carregar, salvar, ler de volta para confirmar, bloquear conflito, manter pendência offline, propagar estado vazio e não persistir token.
- Navegador desktop: carga da interface, cadastro de conta de teste, persistência ao recarregar, lançamento de R$ 10,00 em três parcelas (R$ 3,34 / R$ 3,33 / R$ 3,33) com datas 31/01/2026, 28/02/2026 e 31/03/2026; painel de backup e aviso quando falta Client ID.
- Modelo nativo Google Sheets criado por importação; cabeçalhos e schema conferidos por leitura do Google; locale pt_BR e fuso America/Sao_Paulo. Visual local das quatro abas revisado e estrutura/formatação nativa conferida por API. A apresentação nativa no navegador Google Sheets não foi inspecionada.

## Pendências externas

- Publicação e repositório: consulte o estado atual em Settings → Pages no GitHub; os testes de preparação foram executados antes da publicação.
- Configurar projeto Google Cloud, API Sheets e Client ID OAuth para a origem real do site.
- Login/consentimento e leitura/gravação real via navegador em dois dispositivos com a mesma planilha. A integração está implementada e tem testes simulados; esses testes não comprovam que OAuth está configurado na conta do proprietário.
- Teste físico em celular, instalação pelo navegador e uso offline após primeira carga.

## Checklist após publicação/configuração

1. Abrir URL HTTPS publicada no computador e celular.
2. Entrar no Google, vincular cópia vazia do modelo e enviar uma conta/lançamento de teste.
3. Conferir as células no Sheets; conectar o segundo dispositivo e carregar os mesmos dados.
4. Alternar dispositivos sem edição simultânea; aguardar confirmação antes de sair.
5. Simular offline, criar um lançamento de teste, reconectar e confirmar persistência.
6. Simular edição remota antes de salvar e verificar aviso de conflito.
7. Baixar backup; resetar somente base de teste e confirmar estado vazio na planilha.
8. Remover dados de teste antes do uso real.
