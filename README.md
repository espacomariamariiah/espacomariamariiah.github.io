# Site — Espaço Maria Mariah (protótipo)

Protótipo de site institucional para o Espaço Beleza e Bem Estar Maria Mariah LTDA
(CNPJ 58.531.764/0001-93), com chat de FAQ usando um LLM open source (Llama 3.3, via
Groq). Feito para mostrar ao espaço antes de fechar o design/conteúdo definitivo.

Paleta e tipografia foram baseadas na logo real (`assets/logo.jpg`, extraída do
Instagram @espacomariamariiah) e no material de divulgação enviado.

## Estrutura

```
├── index.html          # site (uma página só, com âncoras)
├── equipe.html          # página "Conheça nossa equipe"
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

Já usamos dados reais: nome do espaço, CNPJ, logo, Instagram (@espacomariamariiah),
endereço, WhatsApp (19 99572-6903), horário de funcionamento, mapa do Google, nome e
foto da fundadora (Juliane Fernandez), imagem real de "Trabalhe conosco", 4 avaliações
reais do Google e o menu completo de procedimentos (site + base de conhecimento do chat).

Ainda faltam (marcados como `[placeholder]` no código):

- **Resto da equipe** (`equipe.html`): só tem a Juliane (fundadora) até agora, porque é
  a única profissional com nome, foto e função confirmados. Pra cada outra pessoa,
  preciso de: foto, nome completo e função/serviço que ela faz — me manda isso que eu
  crio o card dela (com botão de agendar já configurado com o WhatsApp)
- **Fotos reais para "Nosso Instagram"** (6 posts): `.instagram__grid` em `index.html`
  — hoje são placeholders que linkam pro perfil. O Instagram não deixa puxar "os
  posts mais recentes" automaticamente sem login/API; o jeito mais simples é: salvar
  as imagens dos posts que você quer mostrar em `assets/instagram/post1.jpg` (até
  `post6.jpg`) e trocar cada `<a class="instagram__item">...</a>` por
  `<a ...><img src="assets/instagram/post1.jpg" alt="..."></a>`
- **A nota "5,0 · 6 avaliações" é estática** (puxei do Google Maps em 23/07/2026) —
  não atualiza sozinha, e os 4 depoimentos abaixo dela também são texto fixo (não
  puxam automaticamente do Google). Dá pra automatizar depois com a Google Places
  API (precisa de conta/billing no Google Cloud) se fizer sentido
- **Fotos de antes/depois**: `.galeria` em `index.html` — hoje são caixas tracejadas,
  trocar por `<img>` reais
- **Foto do espaço** (seção "Sobre"): `.sobre__image` em `index.html`, ainda placeholder

Observações:
- Nome de exibição confirmado: **"Maria Mariá"** (sem H, com acento) — usado em todo
  o site, cabeçalho, chat, etc. A razão social registrada no CNPJ continua "Espaço
  Beleza e Bem Estar Maria Mariah LTDA" (com H) — mantive assim no rodapé e no FAQ
  do chat por ser o nome legal; me avisa se isso também devesse virar "Mariá".
- O flyer de vagas mostra o Instagram como `@mariamariahcampinas`, diferente do
  perfil que você confirmou (`@espacomariamariiah`) — usei o perfil confirmado em
  todos os links; verifica se `@mariamariahcampinas` é um perfil antigo/diferente.

## Rodar localmente

Não precisa de build. Basta abrir `index.html` no navegador, ou servir a pasta:

```bash
npx serve .
# ou
python3 -m http.server 8080
```

O chat já funciona de verdade no site publicado (`https://espacomariamariiah.github.io/`).
Rodando localmente (`localhost`) o chat não vai responder, porque o worker só aceita
chamadas vindas do domínio publicado (`ALLOWED_ORIGIN` em `worker/wrangler.toml`) —
isso é proposital, pra ninguém além do site usar sua conta da Groq. Pra testar o chat
localmente, troque `ALLOWED_ORIGIN` para `"*"` temporariamente, rode
`npx wrangler deploy` na pasta `worker/`, teste, e depois volte pro domínio real.

## Publicar o site (GitHub Pages — organization page)

O repositório vive em uma organization própria do espaço no GitHub
(`espacomariamariiah`, separada da conta pessoal `cmdiasbr`), em um repo com o nome
especial `espacomariamariiah.github.io` — isso faz o GitHub publicar o site na raiz
do domínio, sem subpasta: **https://espacomariamariiah.github.io/**

1. No GitHub, abra o repositório → **Settings → Pages**
2. Em "Build and deployment" → **Source**, selecione **Deploy from a branch**
3. Em "Branch", escolha **main** e a pasta **/ (root)** → **Save**
4. Aguarde 1-2 minutos e acesse `https://espacomariamariiah.github.io/`

A cada `git push` na branch `main`, o GitHub Pages republica automaticamente.

## Publicar o chat (Cloudflare Worker + Groq)

**Status: já publicado e funcionando.** O worker `clinica-estetica-chat` está no ar em
`https://clinica-estetica-chat.cmdias.workers.dev`, com a `GROQ_API_KEY` configurada
como secret (não está no código/git) e o CORS restrito a
`https://espacomariamariiah.github.io`. O `js/main.js` já aponta pra essa URL.

Para mexer nisso no futuro (trocar a key, mudar o modelo, redeployar após editar
`worker/src/index.js`):

```bash
cd worker
npm install          # se ainda não tiver feito
npx wrangler login   # login no Cloudflare (conta cmdias@outlook.com.br)
npx wrangler secret put GROQ_API_KEY   # só se precisar trocar a key
npx wrangler deploy   # publica qualquer alteração no worker
```

Se editar `worker/src/index.js` (por exemplo, pra atualizar o `CLINIC_FAQ` com preços
ou horário de funcionamento), rode `npx wrangler deploy` de novo pra aplicar.
Não precisa mexer em `js/main.js` nem `worker/wrangler.toml` de novo, a menos que troque
o domínio do site ou o nome do worker.

### Sobre custo e limites

- Groq tem tier gratuito com limites de requisições por minuto/dia — suficiente para
  uma clínica validar o protótipo. Se o volume crescer, dá pra migrar pra plano pago
  ou outro provedor sem mudar o site (só o worker).
- O worker já corta o histórico de mensagens e o tamanho de cada mensagem para
  controlar custo/latência. Há um rate limit opcional por IP (comentado no
  `wrangler.toml`) — vale ativar antes de divulgar o link publicamente.

## Próximos passos

- [ ] Enviar fotos do espaço, de antes/depois e dos 6 posts do Instagram
- [ ] Preencher preços no FAQ do chat, se quiserem que o bot responda sobre valores
- [ ] Confirmar se `@mariamariahcampinas` (do flyer) é o mesmo perfil ou outro
- [ ] Confirmar se a razão social também deveria virar "Maria Mariá" (ou fica "Mariah")
- [ ] Validar o protótipo com o espaço antes de divulgar o link publicamente
- [ ] Ativar rate limiting no worker se o link for compartilhado publicamente
- [ ] Considerar gerar uma nova API key na Groq e substituir a atual (a key foi colada
  em texto no chat pra eu configurar — não é um risco grave, mas trocar é boa prática)

## Ideias para captar mais clientes (ainda não implementadas)

- **Agendamento online de verdade**: hoje o formulário só demonstra a UI; dá pra
  integrar com Google Calendar, Simplybook ou similar para agendar de fato
- **Pixel do Meta / Google Analytics**: para anunciar no Instagram/Facebook com
  remarketing — requer criar as contas e me passar os IDs
- **Cupom de primeira visita**: um pop-up ou banner com desconto para quem agenda
  pelo site, incentivo comum em clínicas de estética
- **Catálogo do WhatsApp Business**: cadastrar os serviços como produtos no
  WhatsApp Business para aparecer direto na conversa
