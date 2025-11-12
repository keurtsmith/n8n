let currentUser = null
let conversations = {}
let currentConversationId = null
let conversationCounter = 0
let currentRequest = null
let isGenerating = false

const fichiersDisponibles = [
  { name: "medicaments.pdf", type: "pdf", size: "2.5MB" },
  { name: "interactions.xlsx", type: "excel", size: "1.2MB" },
  { name: "posologie.docx", type: "word", size: "800KB" },
  { name: "effets_secondaires.pdf", type: "pdf", size: "1.8MB" },
  { name: "contre_indications.pdf", type: "pdf", size: "1.5MB" },
]

// Charger les conversations sauvegardées au démarrage
function loadConversations() {
  // Check if user is already logged in
  const savedUser = localStorage.getItem("epharma_current_user")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
    updateUserProfile()
    loadUserConversations()
  } else {
    showAuthOverlay()
    showLoginForm()
  }
}

// Configuration du webhook n8n
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook-test/c1630bc2-7417-411e-9b8a-937ea034bb82"

const KEYWORD_MAPPING = {
  // Ajouter ici vos nouveaux mappings
  médicament: "medicaments.pdf",
  interaction: "interactions.xlsx",
  posologie: "posologie.docx",
  effet: "effets_secondaires.pdf",
  "contre-indication": "contre_indications.pdf",
}

const fichiersParType = {
  pdf: fichiersDisponibles.filter((f) => f.type === "pdf"),
  excel: fichiersDisponibles.filter((f) => f.type === "excel"),
  word: fichiersDisponibles.filter((f) => f.type === "word"),
}

function saveUserConversations() {
  if (!currentUser) return

  const userConversationsKey = `epharma_conversations_${currentUser.id}`
  localStorage.setItem(userConversationsKey, JSON.stringify(conversations))
}

function generateConversationTitle(firstMessage) {
  const words = firstMessage.split(" ").slice(0, 6)
  return words.join(" ") + (firstMessage.split(" ").length > 6 ? "..." : "")
}

function formatDate(date) {
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return "Aujourd'hui"
  if (days === 1) return "Hier"
  if (days < 7) return `${days}j`
  if (days < 30) return `${Math.floor(days / 7)}sem`
  return `${Math.floor(days / 30)}mois`
}

function createNewChat() {
  conversationCounter++
  const newId = conversationCounter.toString()

  conversations[newId] = {
    id: newId,
    title: "Nouvelle discussion",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  switchToConversation(newId)
  saveUserConversations()
  renderConversationsList()
}

function switchToConversation(conversationId) {
  currentConversationId = conversationId

  // Mettre à jour l'interface
  renderMessages()
  renderConversationsList()

  // Fermer la sidebar sur mobile
  if (window.innerWidth <= 768) {
    closeSidebar()
  }
}

function deleteConversation(conversationId, event) {
  event.stopPropagation()

  if (confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
    delete conversations[conversationId]

    if (currentConversationId === conversationId) {
      const remainingIds = Object.keys(conversations)
      if (remainingIds.length > 0) {
        switchToConversation(remainingIds[0])
      } else {
        createNewChat()
      }
    }

    saveUserConversations()
    renderConversationsList()
  }
}

function renderConversationsList() {
  const container = document.getElementById("conversationsList")
  container.innerHTML = ""

  const sortedConversations = Object.values(conversations).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  sortedConversations.forEach((conv) => {
    const item = document.createElement("div")
    item.className = `conversation-item ${conv.id === currentConversationId ? "active" : ""}`
    item.onclick = () => switchToConversation(conv.id)

    item.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <div class="conversation-title">${conv.title}</div>
                <div class="conversation-date">${formatDate(new Date(conv.updatedAt))}</div>
            </div>
            <div class="conversation-actions">
                <button class="action-btn delete" onclick="deleteConversation('${conv.id}', event)" title="Supprimer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `

    container.appendChild(item)
  })
}

function renderMessages() {
  const messagesArea = document.getElementById("messagesArea")
  messagesArea.innerHTML = ""

  const conversation = conversations[currentConversationId]

  // ✅ Afficher la welcome message si la conversation est vide
  if (!conversation || conversation.messages.length === 0) {
    messagesArea.innerHTML = `
            <div class="welcome-message">
                <h1 class="welcome-title">Bienvenue sur Epharma IA</h1>
                <p class="welcome-subtitle">Votre assistant intelligent pour tous vos besoins pharmaceutiques</p>
                <div class="quick-actions">
                    <div class="quick-action" onclick="sendQuickMessage('Aide-moi avec les médicaments')">Médicaments</div>
                    <div class="quick-action" onclick="sendQuickMessage('Informations sur les interactions')">Interactions</div>
                    <div class="quick-action" onclick="sendQuickMessage('Conseils pharmaceutiques')">Conseils</div>
                </div>
            </div>
        `
    return
  }

  conversation.messages.forEach((msg) => {
    addMessageToDOM(msg.content, msg.isUser, false) // false = pas d'animation
  })
}

function addMessage(content, isUser = false) {
  if (!currentConversationId) {
    createNewChat()
  }

  const conversation = conversations[currentConversationId]

  // Mettre à jour le titre si c'est le premier message utilisateur
  if (isUser && conversation.messages.length === 0) {
    conversation.title = generateConversationTitle(content)
  }

  // Ajouter le message
  conversation.messages.push({ content, isUser, timestamp: new Date() })
  conversation.updatedAt = new Date()

  addMessageToDOM(content, isUser, true) // true = avec animation
  saveUserConversations()
  renderConversationsList()
}

function formatResponse(content) {
  if (!content) return content

  // Nettoyer le contenu
  let formatted = content.trim()

  // Détecter et formater les listes numérotées
  formatted = formatted.replace(/(\d+\.\s*\*\*[^*]+\*\*[^]*?)(?=\d+\.\s*\*\*|$)/g, (match) => {
    return `<div class="response-item">${match}</div>`
  })

  // Formater les listes numérotées simples
  formatted = formatted.replace(/^(\d+\.\s*.+)$/gm, '<div class="response-item">$1</div>')

  // Formater les listes à puces
  formatted = formatted.replace(/^[•-]\s*(.+)$/gm, '<div class="response-item"><span class="bullet">•</span> $1</div>')

  // Formater les titres en gras
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="response-title">$1</strong>')

  // Séparer les paragraphes
  formatted = formatted.replace(/\n\n/g, '</p><p class="response-paragraph">')

  // Ajouter les balises de paragraphe si nécessaire
  if (!formatted.includes('<div class="response-item">') && !formatted.includes('<p class="response-paragraph">')) {
    formatted = `<p class="response-paragraph">${formatted}</p>`
  } else if (formatted.includes('</p><p class="response-paragraph">')) {
    formatted = `<p class="response-paragraph">${formatted}</p>`
  }

  // Remplacer les sauts de ligne simples par des <br>
  formatted = formatted.replace(/\n/g, "<br>")

  return formatted
}

function addMessageToDOM(content, isUser = false, isNewMessage = true) {
  const messagesArea = document.getElementById("messagesArea")
  const welcomeMessage = messagesArea.querySelector(".welcome-message")

  if (welcomeMessage) {
    welcomeMessage.remove()
  }

  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${isUser ? "user" : "assistant"}`

  if (!isUser) {
    if (isNewMessage) {
      messageDiv.innerHTML = `
                <div class="message-avatar">E</div>
                <div class="message-content response-content"><span class="typing-text"></span><span class="cursor">|</span></div>
            `
      messagesArea.appendChild(messageDiv)
      scrollToBottom()

      const typingElement = messageDiv.querySelector(".typing-text")
      const cursor = messageDiv.querySelector(".cursor")
      let i = 0

      function typeWriter() {
        if (i < content.length && isGenerating) {
          typingElement.textContent += content.charAt(i)
          i++
          scrollToBottom()
          setTimeout(typeWriter, 30 + Math.random() * 50)
        } else {
          const formattedContent = formatResponse(content)
          typingElement.innerHTML = formattedContent
          cursor.style.display = "none"
          isGenerating = false
          hideStopButton()
        }
      }

      setTimeout(typeWriter, 300)
    } else {
      const formattedContent = formatResponse(content)
      messageDiv.innerHTML = `
                <div class="message-avatar">E</div>
                <div class="message-content response-content">${formattedContent}</div>
            `
      messagesArea.appendChild(messageDiv)
      scrollToBottom()
    }
  } else {
    messageDiv.innerHTML = `
            <div class="message-avatar">U</div>
            <div class="message-content">${content}</div>
        `
    messagesArea.appendChild(messageDiv)
    scrollToBottom()
  }
}

function adjustTextareaHeight() {
  const textarea = document.getElementById("messageInput")
  textarea.style.height = "auto"
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
}

function scrollToBottom() {
  const messagesArea = document.getElementById("messagesArea")
  messagesArea.scrollTop = messagesArea.scrollHeight
}

function showTypingIndicator() {
  document.getElementById("typingIndicator").style.display = "flex"
  scrollToBottom()
}

function hideTypingIndicator() {
  document.getElementById("typingIndicator").style.display = "none"
}

// Fonction pour envoyer des messages rapides
function sendQuickMessage(message) {
  document.getElementById("messageInput").value = message
  sendMessage()
}

// Fonction pour basculer la sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar")
  const overlay = document.getElementById("overlay")

  sidebar.classList.toggle("open")
  overlay.classList.toggle("active")
}

async function sendMessage() {
  const input = document.getElementById("messageInput")
  const message = input.value.trim()

  if (message === "" || isGenerating) return

  isGenerating = true
  showStopButton()

  addMessage(message, true)
  input.value = ""
  adjustTextareaHeight()

  const controller = new AbortController()
  currentRequest = controller

  try {
    showTypingIndicator()

    console.log("[v0] Envoi du message à n8n:", message)
    console.log("[v0] URL webhook:", N8N_WEBHOOK_URL)

    const requestBody = {
      chatInput: message,
    }

    console.log("[v0] Corps de la requête:", requestBody)

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    console.log("[v0] Réponse reçue, status:", response.status)

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Données reçues de n8n:", data)

    hideTypingIndicator()

    let aiResponse = null

    if (data.output) {
      aiResponse = data.output
    } else if (data.reply) {
      aiResponse = data.reply
    } else if (data.response) {
      aiResponse = data.response
    } else if (data.message) {
      aiResponse = data.message
    } else if (data.text) {
      aiResponse = data.text
    } else if (typeof data === "string") {
      aiResponse = data
    }

    if (aiResponse && isGenerating) {
      addMessage(aiResponse, false)
    } else if (!isGenerating) {
      // La génération a été interrompue
      return
    } else {
      console.log("[v0] Format de réponse inattendu:", data)
      addMessage("Réponse reçue mais format inattendu.", false)
    }
  } catch (error) {
    hideTypingIndicator()
    hideStopButton()
    isGenerating = false

    if (error.name === "AbortError") {
      console.log("[v0] Requête annulée par l'utilisateur")
      return
    }

    console.error("[v0] Erreur complète:", error)

    let errorMessage = "❌ Erreur de connexion avec l'assistant IA.\n"

    if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
      errorMessage += "🔧 Vérifiez que n8n est démarré sur localhost:5678\n"
      errorMessage += "🌐 Vérifiez que le webhook est actif dans n8n"
    } else if (error.message.includes("404")) {
      errorMessage += "🔗 L'URL du webhook semble incorrecte"
    } else if (error.message.includes("500")) {
      errorMessage += "⚠️ Erreur serveur dans n8n - vérifiez les logs"
    } else {
      errorMessage += `📝 Détail: ${error.message}`
    }

    addMessage(errorMessage, false)
  } finally {
    currentRequest = null
    isGenerating = false
    hideStopButton()
  }
}

function showStopButton() {
  const stopBtn = document.getElementById("stopButton")
  const sendBtn = document.getElementById("sendButton")
  if (stopBtn && sendBtn) {
    stopBtn.style.display = "flex"
    sendBtn.style.display = "none"
  }
}

function hideStopButton() {
  const stopBtn = document.getElementById("stopButton")
  const sendBtn = document.getElementById("sendButton")
  if (stopBtn && sendBtn) {
    stopBtn.style.display = "none"
    sendBtn.style.display = "flex"
  }
}

function stopGeneration() {
  isGenerating = false
  if (currentRequest) {
    currentRequest.abort()
    currentRequest = null
  }
  hideTypingIndicator()
  hideStopButton()
  addMessage("⏹️ Génération interrompue par l'utilisateur.", false)
}

// Authentication functions
function showAuthOverlay() {
  document.getElementById("authOverlay").style.display = "flex"
}

function hideAuthOverlay() {
  document.getElementById("authOverlay").style.display = "none"
}

function showLoginForm() {
  document.getElementById("loginForm").classList.remove("hidden")
  document.getElementById("registerForm").classList.add("hidden")
}

function showRegisterForm() {
  document.getElementById("loginForm").classList.add("hidden")
  document.getElementById("registerForm").classList.remove("hidden")
}

function handleLogin(event) {
  event.preventDefault()

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  // Get users from localStorage
  const users = JSON.parse(localStorage.getItem("epharma_users") || "{}")

  if (users[email] && users[email].password === password) {
    currentUser = users[email]
    localStorage.setItem("epharma_current_user", JSON.stringify(currentUser))

    hideAuthOverlay()
    loadUserConversations()
    updateUserProfile()

    // Create first conversation if none exist
    if (Object.keys(conversations).length === 0) {
      createNewChat()
    }
  } else {
    alert("Email ou mot de passe incorrect")
  }
}

function handleRegister(event) {
  event.preventDefault()

  const name = document.getElementById("registerName").value
  const email = document.getElementById("registerEmail").value
  const password = document.getElementById("registerPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value

  if (password !== confirmPassword) {
    alert("Les mots de passe ne correspondent pas")
    return
  }

  // Get existing users
  const users = JSON.parse(localStorage.getItem("epharma_users") || "{}")

  if (users[email]) {
    alert("Un compte avec cet email existe déjà")
    return
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    name: name,
    email: email,
    password: password,
    createdAt: new Date().toISOString(),
  }

  users[email] = newUser
  localStorage.setItem("epharma_users", JSON.stringify(users))

  // Auto login
  currentUser = newUser
  localStorage.setItem("epharma_current_user", JSON.stringify(currentUser))

  hideAuthOverlay()
  loadUserConversations()
  updateUserProfile()
  createNewChat()
}

function handleLogout() {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    currentUser = null
    conversations = {}
    currentConversationId = null

    localStorage.removeItem("epharma_current_user")

    showAuthOverlay()
    showLoginForm()

    // Clear interface
    document.getElementById("messagesArea").innerHTML = ""
    document.getElementById("conversationsList").innerHTML = ""
  }
}

function updateUserProfile() {
  if (currentUser) {
    document.getElementById("userName").textContent = currentUser.name
    document.getElementById("userEmail").textContent = currentUser.email
    document.getElementById("userAvatar").textContent = currentUser.name.charAt(0).toUpperCase()
  }
}

function loadUserConversations() {
  if (!currentUser) return

  const userConversationsKey = `epharma_conversations_${currentUser.id}`
  const saved = JSON.parse(localStorage.getItem(userConversationsKey) || "{}")
  conversations = saved

  // Find the highest ID to continue numbering
  const ids = Object.keys(conversations)
    .map((id) => Number.parseInt(id))
    .filter((id) => !isNaN(id))
  conversationCounter = ids.length > 0 ? Math.max(...ids) : 0

  renderConversationsList()
}

// Initialisation
window.addEventListener("load", () => {
  loadConversations()

  // Only proceed if user is authenticated
  if (currentUser) {
    if (Object.keys(conversations).length === 0) {
      createNewChat()
    } else {
      const latestConv = Object.values(conversations).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
      switchToConversation(latestConv.id)
    }
  }

  adjustTextareaHeight()
})

// Responsive handling
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeSidebar()
  }
})

function closeSidebar() {
  const sidebar = document.getElementById("sidebar")
  const overlay = document.getElementById("overlay")

  sidebar.classList.remove("open")
  overlay.classList.remove("active")
}

// Event listeners
document.getElementById("messageInput").addEventListener("input", adjustTextareaHeight)
document.getElementById("messageInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
})
