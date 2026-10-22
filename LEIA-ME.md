# DuCaps · ERP para roleplay FiveM

Painel demonstrativo responsivo. Os dados podem ficar neste navegador ou ser compartilhados pelo Supabase.

## Conectar o Supabase

1. Abra o projeto Supabase `xxmjdvlmpuaokeclgzqn` e vá em **SQL Editor**.
2. Execute o conteúdo de `supabase-schema.sql` uma vez.
3. Publique `outputs/index.html`, `outputs/styles.css` e `outputs/app.js` no GitHub Pages.
4. O site já vem com a URL e a chave pública informadas configuradas. A primeira conexão envia os dados existentes neste navegador; os próximos acessos carregam os dados compartilhados.

A sincronização usa `public.app_state` para compartilhar funcionários, logins, permissões, configurações, itens e movimentações do baú, produtos, encomendas, clientes, tema e textos do site. `transactions` e `employees` antigos são migrados para o estado compartilhado na primeira conexão quando possível. O app salva cada alteração no Supabase e mantém uma cópia local como contingência.

## Atenção ao acesso público

Este painel foi configurado para uma empresa fictícia e demonstração pública, conforme solicitado. As políticas do SQL permitem que qualquer pessoa com o endereço do projeto e a chave pública leia, altere ou apague dados compartilhados, inclusive contas e permissões do painel. Não use dados reais nem reutilize essa configuração em outro projeto. A chave `service_role` nunca deve ser colocada no navegador.

O botão **Resetar todas as informações** apaga os dados de `app_state`, `transactions` e `employees` no projeto conectado. Como o acesso é público, essa ação afeta todos os usuários do site.

## Abrir localmente

Abra `index.html` ou publique os arquivos no GitHub Pages. Se a tabela `app_state` não existir, execute `supabase-schema.sql` pelo SQL Editor do Supabase e recarregue o site.
