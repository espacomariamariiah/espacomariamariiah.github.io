// Cloudflare Worker: proxy seguro entre o site e a API da Groq (LLM open source Llama 3.3).
// A API key da Groq fica só aqui (como secret), nunca no front-end.

// ATENÇÃO: os itens marcados como [placeholder] ainda precisam ser preenchidos
// com os dados reais do Espaço Maria Mariá (horário de funcionamento, preços).
const CLINIC_FAQ = `
Você é a assistente virtual do Espaço Maria Mariá (Espaço Beleza e Bem Estar Maria
Mariah LTDA), um espaço de beleza e bem-estar. Instagram: @espacomariamariiah.
Responda de forma simpática, breve e objetiva (2-4 frases), em português do Brasil.
Se não souber uma informação específica (preço exato, disponibilidade de horário, etc.),
oriente a pessoa a confirmar pelo WhatsApp, sem inventar dados.

Informações do espaço:
- Endereço: R. Dr. Buarque de Macedo, 639 — Jardim Guanabara, Campinas/SP
- Horário de funcionamento: terça a sábado, das 9h às 18h. Segunda e domingo fechado.
- WhatsApp: (19) 99572-6903
- Instagram: @espacomariamariiah
- E-mail: mariamariahcampinas@gmail.com

Vagas de trabalho abertas no momento: manicure, cabeleireiro(a), podólogo(a) e
depiladora. Interessados devem chamar no WhatsApp.

Menu de procedimentos (categorias e serviços oferecidos):
- Sobrancelhas: design, henna e coloração; brow lamination; sense brows
- Boca: hidragloss; nano lips
- Cílios: lash lifting; extensão de cílios
- Unhas: blindagem, manicure e pedicure tradicional; alongamento em molde com
  blindagem e esmaltação em gel; alongamento em fibra de vidro, spa e plástica dos pés
- Massoterapia: relaxante, pedras quentes e drenagem; escalda pés, maderoterapia
  e reflexologia; ventosaterapia e liberação miofascial
- Estética facial e corporal: ultrassom microfocado, massagem modeladora e
  microagulhamento; limpeza de pele e drenagem facial coreana
- Cabelos: corte (longo, médio e curto); cronograma capilar com óleos essenciais
  e laser capilar; coloração, tonalização e mechas
- Depilação: virilha, pernas e axilas; buço e nariz
- Terapias holísticas: reiki; cone hindu; auriculoterapia

Política de agendamento: agendamento por WhatsApp ou pelo formulário do site.
Não fornecemos diagnósticos médicos nem indicamos procedimentos sem avaliação presencial.
`.trim();

const MODEL = "llama-3.3-70b-versatile";
const MAX_HISTORY_MESSAGES = 8; // limita contexto enviado (custo e latência)
const MAX_MESSAGE_LENGTH = 800;

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Método não suportado" }, 405, corsHeaders);
    }

    const url = new URL(request.url);
    if (url.pathname !== "/chat") {
      return jsonResponse({ error: "Rota não encontrada" }, 404, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "JSON inválido" }, 400, corsHeaders);
    }

    const messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages || messages.length === 0) {
      return jsonResponse({ error: "Campo 'messages' é obrigatório" }, 400, corsHeaders);
    }

    const lastUserMessage = messages[messages.length - 1];
    if (
      typeof lastUserMessage?.content !== "string" ||
      lastUserMessage.content.length === 0 ||
      lastUserMessage.content.length > MAX_MESSAGE_LENGTH
    ) {
      return jsonResponse({ error: "Mensagem inválida ou muito longa" }, 400, corsHeaders);
    }

    // Rate limiting opcional por IP, se o namespace KV estiver vinculado (ver wrangler.toml).
    if (env.RATE_LIMIT_KV) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const limitResponse = await checkRateLimit(env.RATE_LIMIT_KV, ip, corsHeaders);
      if (limitResponse) return limitResponse;
    }

    const trimmedHistory = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content).slice(0, MAX_MESSAGE_LENGTH),
    }));

    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: CLINIC_FAQ }, ...trimmedHistory],
          temperature: 0.4,
          max_tokens: 300,
        }),
      });

      if (!groqResponse.ok) {
        const errText = await groqResponse.text();
        console.error("Erro Groq:", groqResponse.status, errText);
        return jsonResponse({ error: "Erro ao consultar o modelo" }, 502, corsHeaders);
      }

      const data = await groqResponse.json();
      const reply = data?.choices?.[0]?.message?.content?.trim() || "Desculpe, não consegui gerar uma resposta agora.";

      return jsonResponse({ reply }, 200, corsHeaders);
    } catch (err) {
      console.error("Erro inesperado:", err);
      return jsonResponse({ error: "Erro interno" }, 500, corsHeaders);
    }
  },
};

function jsonResponse(obj, status, corsHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function checkRateLimit(kv, ip, corsHeaders) {
  const key = `rl:${ip}`;
  const WINDOW_SECONDS = 60;
  const MAX_REQUESTS = 12;

  const current = parseInt((await kv.get(key)) || "0", 10);
  if (current >= MAX_REQUESTS) {
    return jsonResponse(
      { error: "Muitas mensagens em pouco tempo. Aguarde um instante." },
      429,
      corsHeaders
    );
  }
  await kv.put(key, String(current + 1), { expirationTtl: WINDOW_SECONDS });
  return null;
}
