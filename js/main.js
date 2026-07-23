// ===================== Config =====================
const CHAT_ENDPOINT = "https://clinica-estetica-chat.cmdias.workers.dev/chat";

// ===================== Ano no rodapé =====================
document.getElementById("ano").textContent = new Date().getFullYear();

// ===================== Menu mobile =====================
const navBurger = document.getElementById("navBurger");
const navLinks = document.getElementById("navLinks");
navBurger?.addEventListener("click", () => {
  navLinks.classList.toggle("is-open");
});

// ===================== Formulário de contato (demo) =====================
const contatoForm = document.getElementById("contatoForm");
contatoForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Obrigado! Este é um protótipo — o envio real será configurado depois (ex: e-mail, WhatsApp API ou planilha).");
  contatoForm.reset();
});

// ===================== Chat Widget =====================
const chatWidget = document.getElementById("chatWidget");
const chatToggle = document.getElementById("chatToggle");
const chatPanel = document.getElementById("chatPanel");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

const history = []; // { role: "user" | "assistant", content: string }

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `chat-msg chat-msg--${role === "user" ? "user" : "bot"}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function addWelcomeMessage() {
  if (chatMessages.children.length === 0) {
    addMessage("assistant", "Olá! 👋 Sou a assistente virtual do Espaço Maria Mariah. Posso te ajudar com serviços, horários e dúvidas gerais. Como posso ajudar?");
  }
}

chatToggle.addEventListener("click", () => {
  const isOpen = chatWidget.classList.toggle("is-open");
  chatPanel.hidden = !isOpen;
  if (isOpen) {
    addWelcomeMessage();
    chatInput.focus();
  }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  history.push({ role: "user", content: text });
  chatInput.value = "";

  const typingEl = addMessage("assistant", "digitando...");
  typingEl.classList.add("chat-msg--typing");

  try {
    const reply = await sendToWorker(history);
    typingEl.remove();
    addMessage("assistant", reply);
    history.push({ role: "assistant", content: reply });
  } catch (err) {
    typingEl.remove();
    addMessage("assistant", "Desculpe, não consegui responder agora. Tente novamente em instantes ou fale pelo WhatsApp 🙂");
    console.error("Erro no chat:", err);
  }
});

async function sendToWorker(messages) {
  const res = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(`Worker respondeu com status ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}
