# Sistema Financeiro Pessoal - Fundação (Etapa 1)

Este é o início do projeto do Sistema Financeiro Pessoal, contendo toda a infraestrutura base configurada e testada, integrando um frontend moderno e reativo com um backend gerenciado pelo Supabase.

## Stack Utilizada

- **Frontend**: React + Vite + TypeScript
- **Estilização**: Tailwind CSS v4 (compilação rápida nativa no Vite)
- **Backend / BaaS**: Supabase (Banco de dados PostgreSQL, Autenticação JWT e Gerenciamento de Perfis)

## Estrutura de Pastas Implementada

```text
src/
  contexts/
    AuthContext.tsx   # Provedor global de estado de autenticação e auto-login
  lib/
    auth.ts           # Funções utilitárias de login e logout com Supabase
    supabase.ts       # Inicialização do cliente Supabase
  types/
    index.ts          # Definições das interfaces TypeScript para o Banco de Dados
  App.tsx             # Dashboard principal de monitoramento e validação da infraestrutura
  index.css           # Configurações de estilo base e importação do Tailwind
  main.tsx            # Inicialização geral do React encapsulada pelo AuthProvider
```

## Configuração do Ambiente

1. Crie um arquivo `.env` na raiz da pasta `agente_financeiro` baseando-se no arquivo `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Preencha as credenciais correspondentes no arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=SUA_URL_DO_SUPABASE
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANONIMA_DO_SUPABASE
   VITE_DEV_EMAIL=teste@financeiro.com
   VITE_DEV_PASSWORD=SUA_SENHA_DE_TESTES_CADASTRADA
   ```

## Instruções de Instalação e Execução

Caso queira executar o projeto manualmente fora do container/ambiente do agente, siga os passos abaixo:

1. Acesse o diretório do projeto:
   ```bash
   cd agente_financeiro
   ```

2. Instale todas as dependências:
   ```bash
   npm install
   ```

3. Execute o servidor de desenvolvimento local:
   ```bash
   npm run dev
   ```

4. Abra o endereço `http://localhost:5173` no seu navegador de preferência.

> [!WARNING]
> **Aviso de Segurança**: O mecanismo de auto-login (`VITE_DEV_EMAIL` e `VITE_DEV_PASSWORD`) funciona exclusivamente em ambiente de desenvolvimento (`import.meta.env.DEV`). Essa facilidade deve permanecer desabilitada/removida em ambiente de produção (build final) para proteger as contas e dados reais dos usuários.
