# MotoLead Pro

CRM comercial inteligente para prospecção ativa, gestão de leads, follow-ups, funil de vendas e assistente comercial com IA para concessionária Yamaha.

## Objetivo

O MotoLead Pro foi criado para ajudar vendedores a gerar demanda própria, organizar leads, priorizar contatos e aumentar conversão comercial.

O sistema permite:

- Cadastrar e organizar leads
- Detectar leads duplicados
- Priorizar contatos por score inteligente
- Gerenciar follow-ups
- Criar agenda comercial diária
- Usar Radar de Oportunidades
- Acompanhar Funil de Vendas
- Gerar mensagens com IA
- Recuperar leads parados
- Criar ideias de conteúdo
- Usar uma Assistente Comercial IA

---

## Tecnologias

### Frontend

- React
- Vite
- Tailwind CSS
- Axios
- Lucide React

### Backend

- Node.js
- Express
- Supabase
- OpenAI API

### Banco de dados

- Supabase PostgreSQL

---

## Estrutura do Projeto

```text
BUSCADOR_PARCEIROS
├── backend
│   └── src
│       ├── config
│       ├── routes
│       ├── services
│       └── utils
│
├── frontend
│   └── src
│       ├── components
│       ├── layouts
│       ├── pages
│       └── services
│
└── README.md
````

---

## Instalação

Clone o repositório:

```bash
git clone https://github.com/WitsanFXT/BUSCADOR_PARCEIROS.git
cd BUSCADOR_PARCEIROS
```

---

## Configurar Backend

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env`:

```bash
touch .env
```

Adicione:

```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_do_supabase
OPENAI_API_KEY=sua_chave_da_openai
OPENAI_MODEL=gpt-5.5
PORT=3001
```

Rode o backend:

```bash
npm run dev
```

Se não tiver script `dev`, use:

```bash
node src/server.js
```

Teste:

```bash
curl http://localhost:3001/
```

Resultado esperado:

```json
{
  "message": "MotoLead Pro API"
}
```

---

## Configurar Frontend

Em outro terminal, entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Rode o frontend:

```bash
npm run dev
```

Acesse:

```text
http://localhost:5173
```

---

## Scripts úteis

### Backend

```bash
cd backend
npm install
npm run dev
```

ou:

```bash
node src/server.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Variáveis de ambiente

O projeto usa variáveis sensíveis no backend.

Nunca envie o arquivo `.env` para o GitHub.

Exemplo de `.gitignore`:

```gitignore
node_modules
.env
dist
```

---

## Principais Módulos

### CRM

Gerencia leads, contatos, prioridades, dados da moto atual e score comercial.

### Radar de Oportunidades

Permite cadastrar possíveis compradores encontrados em marketplace, Instagram, Facebook, empresas, motoboys, oficinas e indicações.

### Agenda Inteligente

Organiza prioridades, follow-ups vencidos e contatos do dia.

### Follow-up Inteligente

Identifica leads sem contato, leads críticos e oportunidades que precisam de retorno.

### Recuperação de Leads IA

Detecta leads quentes parados e sugere retomada comercial.

### Funil de Vendas

Kanban comercial com etapas de venda:

* Lead Encontrado
* Primeiro Contato
* Interessado
* Simulação Enviada
* Documentação
* Análise de Crédito
* Venda Realizada
* Perdido

### Central de Conteúdo

Gera ideias para publicações, status, vídeos e conteúdos comerciais.

### Assistente Comercial IA

A MotoLead AI atua como uma consultora comercial dentro do sistema.

Ela ajuda a:

* Priorizar leads
* Gerar mensagens de WhatsApp
* Criar follow-ups personalizados
* Recuperar leads parados
* Criar ideias de conteúdo
* Sugerir plano do dia
* Analisar oportunidades comerciais

---

## Rotas principais do Backend

### Leads

```http
GET /leads
POST /leads
PUT /leads/:id
DELETE /leads/:id
```

### Agenda

```http
GET /agenda/priorities
GET /agenda/followups
POST /agenda/followups
PUT /agenda/followups/:id/done
DELETE /agenda/followups/:id
```

### IA Comercial

```http
POST /assistant/generate
GET /assistant/home
GET /assistant/summary
GET /assistant/daily-plan
GET /assistant/insights
```

### Prioridades IA

```http
GET /ai/recommendations
GET /ai/followup-alerts
GET /ai/recovery-leads
POST /ai/actions
GET /ai/actions/:lead_id
```

---

## Testes rápidos

### Testar assistente

```bash
curl http://localhost:3001/assistant/home
```

### Gerar mensagem com IA

```bash
curl -X POST http://localhost:3001/assistant/generate \
-H "Content-Type: application/json" \
-d '{
  "objective": "followup",
  "lead_id": "ID_DO_LEAD"
}'
```

### Gerar conteúdo com IA

```bash
curl -X POST http://localhost:3001/assistant/generate \
-H "Content-Type: application/json" \
-d '{
  "objective": "content",
  "extra": {
    "topic": "conteúdo para motoboys sobre economia com moto Yamaha"
  }
}'
```

### Testar recuperação de leads

```bash
curl http://localhost:3001/ai/recovery-leads
```

### Testar follow-up inteligente

```bash
curl http://localhost:3001/ai/followup-alerts
```

---

## Observações sobre OpenAI

Para usar a IA real, é necessário configurar:

```env
OPENAI_API_KEY=sua_chave_da_openai
```

Se aparecer erro `429`, normalmente significa:

* Sem crédito disponível
* Billing não configurado
* Limite de uso atingido
* Chave incorreta

---

## Fluxo recomendado de uso

1. Cadastrar leads no CRM
2. Usar Radar para encontrar oportunidades
3. Acompanhar Agenda Inteligente
4. Ver Prioridades IA
5. Gerar mensagens com IA
6. Fazer follow-up pelo WhatsApp
7. Registrar ações comerciais
8. Recuperar leads parados
9. Usar Assistente IA para plano diário

---

## Subir alterações para o GitHub

```bash
git add .
git commit -m "Atualiza MotoLead Pro"
git push origin main
```

Se sua branch for `master`:

```bash
git push origin master
```

---

## Autor

Projeto desenvolvido por Witsan.

MotoLead Pro — CRM comercial inteligente para prospecção ativa e vendas Yamaha.

```
```
