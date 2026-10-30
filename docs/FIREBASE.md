# Firebase: análise e roteiro de integração

Verificado em 30/10/2026. Este documento analisa **Firebase, usando Cloud Firestore como banco de dados**, conforme a correção no pedido.

## Estado atual

**Firebase ainda não está integrado ao aplicativo.** O site publicado usa armazenamento local e tem integração Google Sheets implementada, mas dependente de configuração OAuth. Criar um projeto Firebase ou copiar sua configuração não ativa uma funcionalidade que o código ainda não possui.

Este roteiro separa a configuração no console das mudanças necessárias no código. Nenhum projeto Firebase, usuário, banco ou regra foi criado/publicado durante esta análise.

## Recomendação para este projeto

Minha recomendação técnica é manter o site no GitHub Pages e usar **Firebase Authentication + Cloud Firestore** como base principal, caso a prioridade seja acessar os mesmos lançamentos no computador e no celular. A planilha pode ser uma exportação opcional.

O SDK web pode se comunicar com o Firestore; não é necessário adicionar um servidor próprio só para este CRUD autenticado. A configuração e as regras de acesso são indispensáveis. Não se deve tentar usar o GitHub como banco de dados dos lançamentos.

| Critério | Google Sheets na versão atual | Firebase proposto |
| --- | --- | --- |
| Onde ficam os registros | Na planilha do usuário, após configurar OAuth | No Cloud Firestore do projeto configurado |
| Identificação | Conta Google proprietária/editora | Firebase Authentication |
| Configuração inicial | API Sheets, OAuth e link da planilha | Projeto, app web, Authentication, Firestore e regras |
| Acesso em dois dispositivos | Carregar e salvar; evitar edição simultânea | Login na mesma conta; implementar escuta/sincronização por registro |
| Edição manual como planilha | Disponível no Google Sheets | Não é a interface de uso proposta; usar o aplicativo |
| Conflitos | Verificação antes de substituir o estado completo | Documentos separados e estratégia de concorrência a implementar |
| Situação no código | Implementado; OAuth pendente | Planejado; ainda não implementado |

O Firestore não elimina automaticamente todos os conflitos: várias alterações no mesmo documento podem resultar na prevalência da última gravação. A implementação deve tratar versões, alterações concorrentes e gravações ainda pendentes.

## Plano gratuito e limites

Para começar sem cobrança por uso, a proposta é usar **Spark**, sem vincular conta de faturamento. O plano Blaze é pago por uso e não deve ser ativado automaticamente como solução de uma falha de cota.

Cota gratuita documentada para o Cloud Firestore Standard:

| Recurso | Cota |
| --- | --- |
| Armazenamento | 1 GiB |
| Leituras de documentos | 50.000 por dia |
| Gravações de documentos | 20.000 por dia |
| Exclusões de documentos | 20.000 por dia |
| Transferência de saída | 10 GiB por mês |

A gratuidade se aplica a um banco elegível por projeto. Leituras e gravações são operações, não simplesmente número de lançamentos armazenados. Recarregar históricos completos e manter escutas desnecessárias pode consumir mais operações.

**Avaliação:** essas cotas parecem adequadas para uso pessoal moderado; isso é uma estimativa de adequação, não garantia de gratuidade ilimitada. No Spark, operações podem ser bloqueadas ao esgotar a cota aplicável. Consulte o período de redefinição do recurso; as cotas diárias do Firestore são redefinidas aproximadamente à meia-noite do Pacífico.

O roteiro não depende de Cloud Functions, armazenamento de anexos, SMS ou backups gerenciados pagos. Backup JSON manual deve continuar disponível. As regras de preço podem mudar; confira as fontes oficiais antes de ativar serviços.

Fontes: [planos Spark e Blaze](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [cotas do Firestore](https://firebase.google.com/docs/firestore/quotas), [preços](https://firebase.google.com/pricing).

## Passo a passo — configuração no Firebase Console

Os nomes dos menus podem variar com o idioma e atualizações do console.

1. Abra o [Firebase Console](https://console.firebase.google.com/) na conta que será proprietária do projeto.
2. Crie um projeto dedicado ao aplicativo e confira que está no plano **Spark**. Analytics não é necessário para esta proposta.
3. Em **Configurações do projeto → Seus aplicativos**, registre um aplicativo **Web** e copie o objeto `firebaseConfig` fornecido pelo console. O site pode continuar no GitHub Pages; não é necessário mudar sua hospedagem.
4. Em **Authentication → Método de login**, habilite **E-mail/senha**. Esse é o caminho inicial proposto para não depender da autorização de acesso a planilhas. Login com Google pode ser uma opção posterior.
5. Em Authentication, prepare seu usuário pessoal. A senha deve ser definida na interface segura do Firebase, nunca no GitHub, em arquivo de configuração ou no chat. Copie o **UID** desse usuário para a configuração das regras pessoais.
6. Em **Authentication → Configurações → Domínios autorizados**, confira/adicione `santos1513lopes-lgtm.github.io` para os fluxos que exigem domínio autorizado. Use somente o domínio, sem `https://` e sem o caminho `/jsl-financas-pessoais/`. Não altere o `authDomain` gerado apenas para fazê-lo coincidir com o GitHub.
7. Crie um banco **Cloud Firestore Standard**, selecione a localização apropriada e comece em **modo de produção**, com acesso negado. Não use regras abertas de modo de teste para dados reais.
8. Antes de permitir gravações, publique regras que restrinjam os caminhos ao UID autorizado. O modelo abaixo é um ponto de partida para acesso pessoal.
9. Confira o painel de uso e mantenha o projeto sem serviços adicionais que exijam faturamento.

A configuração web do Firebase contém identificadores públicos, inclusive uma API key de identificação. Ela não substitui autenticação/regras. Use restrições apropriadas da chave para as APIs Firebase. **Nunca envie chave privada de conta de serviço, Admin SDK ou arquivo de credenciais administrativas ao repositório público.**

Fontes: [configuração de app web](https://firebase.google.com/docs/web/setup), [login e-mail/senha](https://firebase.google.com/docs/auth/web/password-auth), [Firestore e modos de segurança](https://firebase.google.com/docs/firestore/quickstart), [chaves Firebase](https://firebase.google.com/docs/projects/api-keys).

## Organização dos dados proposta

| Caminho | Conteúdo |
| --- | --- |
| `users/{uid}/accounts/{accountId}` | Uma conta ou investimento por documento |
| `users/{uid}/transactions/{transactionId}` | Um lançamento por documento |

Os valores monetários devem ser persistidos em centavos inteiros, por exemplo `amountCents` e `initialCents`; datas de vencimento continuam como `AAAA-MM-DD`. Preservar IDs na migração evita duplicações. Acrescentar versão e horário de atualização para detectar conflitos.

Esta é uma proposta de novo schema, não o formato atualmente armazenado no Sheets. A migração precisa converter os valores com arredondamento explícito e reconciliar os totais antes e depois.

Evitar salvar o histórico inteiro em um documento ou regravar todos os documentos a cada edição. Carregar o período relevante, paginar históricos maiores e manter apenas as escutas necessárias.

## Exemplo inicial de regras — uso pessoal

Substitua `SUBSTITUA_PELO_SEU_UID` pelo UID real obtido em Authentication. **Não é senha.** O exemplo limita acesso do cliente web a uma única identidade e às duas coleções propostas. O UID no caminho também deve corresponder ao usuário autenticado.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isPersonalOwner(uid) {
      return request.auth != null
        && request.auth.uid == uid
        && request.auth.uid == 'SUBSTITUA_PELO_SEU_UID';
    }

    match /users/{uid}/accounts/{accountId} {
      allow read, write: if isPersonalOwner(uid);
    }

    match /users/{uid}/transactions/{transactionId} {
      allow read, write: if isPersonalOwner(uid);
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Essas regras exemplificam **controle de acesso**, não validação completa do modelo financeiro. Antes da integração real, acrescentar validação de campos, tipos, valores, IDs e alterações permitidas, e testar no emulador. Nunca substituir por `allow read, write: if true`.

Se futuramente o aplicativo atender outras pessoas, revisar o requisito de acesso: não basta remover o UID fixo sem analisar o cadastro e o consumo das cotas compartilhadas do projeto.

Fonte: [condições de autenticação nas regras do Firestore](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Passo a passo — implementação necessária no código

Esta parte exige desenvolvimento. **Ainda não há campo Firebase funcional na versão publicada.**

1. Adicionar o SDK web modular do Firebase com uma versão definida e carregar apenas Authentication e Firestore.
2. Criar o módulo de configuração pública do Firebase e inicializar os serviços; não misturar com o Client ID OAuth do Sheets.
3. Implementar entrar, sair e estado da sessão com Firebase Authentication. Não persistir senha manualmente.
4. Criar um adaptador de persistência para contas e lançamentos por documento. Preservar os cálculos e validações de `assets/core.js`.
5. Substituir a gravação integral disparada por `save()` por operações de inclusão, alteração e exclusão dos registros afetados. Implementar atualizações remotas na tela e tratamento de conflito.
6. Adicionar seleção explícita da base: local, Sheets ou Firebase. Evitar gravar automaticamente em Sheets e Firestore ao mesmo tempo; duas bases autoritativas exigiriam uma política de sincronização adicional.
7. Fazer a migração a partir do backup JSON com prévia dos totais, confirmação e IDs preservados. Importação repetida não deve duplicar lançamentos.
8. No logout ou troca de usuário, encerrar escutas e impedir que dados locais de uma identidade sejam exibidos ou enviados para outra.
9. Manter exportação/restauração. Resetar somente as contas e os lançamentos do usuário autorizado, com confirmação digitada e tratamento de exclusão parcial.
10. Atualizar o service worker e os testes. Configurar cache financeiro offline apenas em dispositivos confiáveis e informar o que continua armazenado localmente.
11. Publicar a versão integrada somente após validar as regras e os fluxos abaixo.

**Reset:** pelo SDK, excluir um documento pai não apaga automaticamente as subcoleções. Será necessário enumerar e excluir os documentos das coleções propostas em lotes controlados. Não prometer reset concluído enquanto restarem registros ou exclusões pendentes; um reset interrompido precisa permitir continuação. Apagar os dados financeiros não é o mesmo que excluir a conta Firebase Authentication.

Fontes: [acesso offline e resolução de gravações](https://firebase.google.com/docs/firestore/manage-data/enable-offline), [modelo e subcoleções](https://firebase.google.com/docs/firestore/data-model).

## Critérios para considerar a integração pronta

- Usuário não autenticado não consegue ler nem gravar.
- Outra conta Firebase não consegue acessar o UID pessoal autorizado.
- O mesmo usuário vê o lançamento no computador e no celular após confirmação do servidor.
- Contas, despesas, receitas, transferências e parcelas mantêm os totais esperados.
- Duas alterações concorrentes são tratadas conforme a política definida; não há sobrescrita silenciosa do histórico inteiro.
- Falha de rede/cota mostra pendência e não mostra “salvo na nuvem” antes da confirmação.
- Logout/troca de sessão não expõe dados de outro usuário.
- Backup restaura os registros sem duplicação e reset remove apenas a base confirmada.
- O painel de uso confirma o consumo dentro do plano escolhido.

## Decisão sugerida

Se a prioridade é operar os mesmos dados no celular e computador, seguir com Firebase como base principal. Se a prioridade é editar manualmente linhas da planilha, concluir OAuth do Sheets. É possível manter as duas opções no produto, mas a escolha da base ativa deve ser explícita.
