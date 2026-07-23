# Site — Espaço Maria Mariah (protótipo)

Protótipo de site institucional para o Espaço Beleza e Bem Estar Maria Mariah LTDA
(CNPJ 58.531.764/0001-93), com chat de FAQ usando um LLM open source (Llama 3.3, via
Groq). Feito para mostrar ao espaço antes de fechar o design/conteúdo definitivo.

Paleta e tipografia foram baseadas na logo real (`assets/logo.jpg`, extraída do
Instagram @espacomariamariiah) e no material de divulgação enviado.

## Estrutura

```
├── index.html          # site (uma página só, com âncoras)
├── css/style.css
├── js/main.js           # inclui a lógica do widget de chat
├── assets/              # fotos da clínica (adicionar depois)
└── worker/               # backend do chat (Cloudflare Worker)
    ├── src/index.js       # proxy seguro entre o site e a API da Groq
    ├── wrangler.toml
    ├── package.json
    └── .dev.vars.example
```

## O que já é real vs. o que falta preencher

Já usamos dados reais: nome do espaço, CNPJ, logo, Instagram (@espacomariamariiah) e o
menu completo de procedimentos (tanto no site quanto na base de conhecimento do chat).

Ainda faltam (marcados como `[placeholder]` no código):

- **Nome da fundadora/CEO**: `index.html`, seção `.fundadora` — só sabemos que ela
  aparece na foto de divulgação enviada; não inventamos o nome
- **Foto da fundadora e fotos do espaço**: em alta resolução (a foto do material do
  Instagram que vimos é uma miniatura de baixa qualidade com uma promoção antiga —
  não dá pra usar no site definitivo)
- **Endereço completo, telefone/WhatsApp e horário de funcionamento**: seção
  `#contato` em `index.html` e também em `worker/src/index.js` (`CLINIC_FAQ`)
- **Depoimentos reais** de clientes: `index.html`, seção `#depoimentos`
- **Fotos de antes/depois e posts do Instagram**: `.galeria` e `.instagram__grid`
  em `index.html` — hoje são caixas tracejadas, trocar por `<img>` reais

Uma observação: você passou a Razão Social/Nome Fantasia como "Maria Mariah" em um
lugar e "Maria Maria" em outro (sem o H) — usei "Maria Mariah" em todo o site, que é
o que aparece no Instagram e no menu de procedimentos. Confirma se está certo antes
de publicar oficialmente.

## Rodar localmente

Não precisa de build. Basta abrir `index.html` no navegador, ou servir a pasta:

```bash
npx serve .
# ou
python3 -m http.server 8080
```

O chat só vai funcionar de verdade depois que o worker estiver publicado (passo abaixo);
antes disso ele mostra a mensagem de erro amigável.

## Publicar o site (Cloudflare Pages — gratuito)

Como o GitHub Pages da sua conta já está em uso pelo portfólio, o site fica no
**Cloudflare Pages** (conta gratuita, sem limite de projetos, e já usamos Cloudflare
para o worker do chat também — tudo no mesmo painel).

1. Crie uma conta gratuita em https://dash.cloudflare.com/sign-up (se ainda não tiver)
2. No dashboard: **Workers & Pages → Create → Pages → Connect to Git**
3. Selecione o repositório `clinica-estetica-site` no GitHub (autorize o acesso quando pedido)
4. Configuração de build: **nenhuma** (é site estático) — deixe "Build command" vazio e
   "Build output directory" como `/`
5. Deploy. Você recebe uma URL tipo `https://clinica-estetica-site.pages.dev`

A cada `git push`, o Cloudflare Pages publica automaticamente a nova versão.

## Publicar o chat (Cloudflare Worker + Groq)

1. Crie uma conta gratuita em https://console.groq.com e gere uma API key
   (Settings → API Keys)
2. Instale as dependências do worker:
   ```bash
   cd worker
   npm install
   ```
3. Login no Cloudflare (abre o navegador):
   ```bash
   npx wrangler login
   ```
4. Configure a API key como secret (não fica no código nem no git):
   ```bash
   npx wrangler secret put GROQ_API_KEY
   # cole a key quando pedir
   ```
5. Publique o worker:
   ```bash
   npx wrangler deploy
   ```
   Isso retorna uma URL tipo `https://clinica-estetica-chat.SEU-USUARIO.workers.dev`
6. Edite `js/main.js` e troque `CHAT_ENDPOINT` pela URL acima + `/chat`, ex:
   ```js
   const CHAT_ENDPOINT = "https://clinica-estetica-chat.SEU-USUARIO.workers.dev/chat";
   ```
7. Depois que o site estiver no ar (passo anterior), edite `worker/wrangler.toml` e
   troque `ALLOWED_ORIGIN = "*"` pela URL real do site (ex: a URL do Pages), para que
   só o seu site consiga chamar o worker. Rode `npx wrangler deploy` de novo.

Commite e dê push nas mudanças (`js/main.js` e `worker/wrangler.toml`) para o Pages
republicar o front-end automaticamente.

### Sobre custo e limites

- Groq tem tier gratuito com limites de requisições por minuto/dia — suficiente para
  uma clínica validar o protótipo. Se o volume crescer, dá pra migrar pra plano pago
  ou outro provedor sem mudar o site (só o worker).
- O worker já corta o histórico de mensagens e o tamanho de cada mensagem para
  controlar custo/latência. Há um rate limit opcional por IP (comentado no
  `wrangler.toml`) — vale ativar antes de divulgar o link publicamente.

## Próximos passos

- [ ] Confirmar nome da fundadora/CEO e conseguir foto dela em alta resolução
- [ ] Enviar fotos do espaço, de antes/depois e posts para a galeria/Instagram
- [ ] Preencher endereço, telefone/WhatsApp e horário (site + `CLINIC_FAQ` no worker)
- [ ] Preencher preços no FAQ do chat, se quiserem que o bot responda sobre valores
- [ ] Coletar depoimentos reais de clientes
- [ ] Validar o protótipo com o espaço antes de divulgar o link publicamente
- [ ] Ativar rate limiting no worker se o link for compartilhado publicamente
