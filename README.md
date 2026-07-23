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

Já usamos dados reais: nome do espaço, CNPJ, logo, Instagram (@espacomariamariiah),
endereço, WhatsApp (19 99572-6903), mapa do Google, vagas abertas ("Trabalhe conosco")
e o menu completo de procedimentos (site + base de conhecimento do chat).

Ainda faltam (marcados como `[placeholder]` no código):

- **Nome da fundadora/CEO**: `index.html`, seção `.fundadora` — só sabemos que ela
  aparece na foto de divulgação enviada; não inventamos o nome
- **Foto da fundadora e fotos do espaço**: em alta resolução (a foto do material do
  Instagram que vimos é uma miniatura de baixa qualidade com uma promoção antiga —
  não dá pra usar no site definitivo)
- **Imagem da vaga (post "Trabalhe conosco")**: `index.html`, seção `.trabalhe__imagem`
  — você mandou o flyer no chat, mas eu não consigo salvar imagens coladas na
  conversa; me manda como arquivo (ou o link do post) que eu coloco
- **Fotos reais para "Nosso Instagram"** (6 posts): `.instagram__grid` em `index.html`
  — hoje são placeholders que linkam pro perfil. O Instagram não deixa puxar "os
  posts mais recentes" automaticamente sem login/API; o jeito mais simples é: salvar
  as imagens dos posts que você quer mostrar em `assets/instagram/post1.jpg` (até
  `post6.jpg`) e trocar cada `<a class="instagram__item">...</a>` por
  `<a ...><img src="assets/instagram/post1.jpg" alt="..."></a>`
- **Horário de funcionamento**: seção `#contato` em `index.html` e em
  `worker/src/index.js` (`CLINIC_FAQ`)
- **Depoimentos individuais** (texto de avaliações reais): hoje a seção `#avaliacoes`
  mostra a nota agregada real do Google (5,0 · 6 avaliações, puxada do perfil no
  Google Maps), mas não o texto de cada avaliação — o Google não deixa isso ser
  extraído automaticamente sem API paga. Se quiser mostrar 2-3 avaliações com o
  texto, me manda o conteúdo (copiar/colar do Google) que eu coloco como cards
- **A nota "5,0 · 6 avaliações" é estática** (puxei do Google Maps em 23/07/2026) —
  não atualiza sozinha. Dá pra virar automático depois com a Google Places API
  (precisa de conta/billing no Google Cloud) se fizer sentido
- **Fotos de antes/depois**: `.galeria` em `index.html` — hoje são caixas tracejadas,
  trocar por `<img>` reais

Observações:
- Você passou a Razão Social/Nome Fantasia como "Maria Mariah" em um lugar e "Maria
  Maria" em outro (sem o H) — usei "Maria Mariah" em todo o site, que é o que aparece
  no Instagram e no menu de procedimentos. Confirma se está certo antes de publicar.
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

O chat só vai funcionar de verdade depois que o worker estiver publicado (passo abaixo);
antes disso ele mostra a mensagem de erro amigável.

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
   troque `ALLOWED_ORIGIN = "*"` por `https://espacomariamariiah.github.io`, para que
   só o site do espaço consiga chamar o worker. Rode `npx wrangler deploy` de novo.

Commite e dê push nas mudanças (`js/main.js` e `worker/wrangler.toml`) para o GitHub
Pages republicar o front-end automaticamente.

### Sobre custo e limites

- Groq tem tier gratuito com limites de requisições por minuto/dia — suficiente para
  uma clínica validar o protótipo. Se o volume crescer, dá pra migrar pra plano pago
  ou outro provedor sem mudar o site (só o worker).
- O worker já corta o histórico de mensagens e o tamanho de cada mensagem para
  controlar custo/latência. Há um rate limit opcional por IP (comentado no
  `wrangler.toml`) — vale ativar antes de divulgar o link publicamente.

## Próximos passos

- [ ] Confirmar nome da fundadora/CEO e conseguir foto dela em alta resolução
- [ ] Mandar a imagem do post de vagas ("Trabalhe conosco") como arquivo
- [ ] Enviar fotos do espaço, de antes/depois e dos 6 posts do Instagram
- [ ] Preencher horário de funcionamento (site + `CLINIC_FAQ` no worker)
- [ ] Preencher preços no FAQ do chat, se quiserem que o bot responda sobre valores
- [ ] Mandar o texto de 2-3 avaliações reais do Google pra virarem cards de depoimento
- [ ] Confirmar se `@mariamariahcampinas` (do flyer) é o mesmo perfil ou outro
- [ ] Validar o protótipo com o espaço antes de divulgar o link publicamente
- [ ] Ativar rate limiting no worker se o link for compartilhado publicamente

## Ideias para captar mais clientes (ainda não implementadas)

- **Agendamento online de verdade**: hoje o formulário só demonstra a UI; dá pra
  integrar com Google Calendar, Simplybook ou similar para agendar de fato
- **Pixel do Meta / Google Analytics**: para anunciar no Instagram/Facebook com
  remarketing — requer criar as contas e me passar os IDs
- **Cupom de primeira visita**: um pop-up ou banner com desconto para quem agenda
  pelo site, incentivo comum em clínicas de estética
- **Catálogo do WhatsApp Business**: cadastrar os serviços como produtos no
  WhatsApp Business para aparecer direto na conversa
