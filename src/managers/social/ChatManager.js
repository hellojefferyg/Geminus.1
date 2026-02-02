// src/managers/social/ChatManager.js

export class ChatManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.showToast = deps.showToast;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.addEventListeners();
    this.switchChannel('main');
    console.log("💬 Chat Manager: Listening for Aetherial signals.");
  }

  addEventListeners() {
    // Standard HUD chat form
    if (this.ui.footerMessageForm) {
      this.ui.footerMessageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = this.ui.footerMessageInput;
        if (input && input.value.trim()) {
          this.sendMessage(input.value.trim());
          input.value = '';
        }
      });
    }

    // Modal-specific chat form
    if (this.ui.messageForm) {
      this.ui.messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = this.ui.messageInput;
        if (input && input.value.trim()) {
          this.sendMessage(input.value.trim());
          input.value = '';
        }
      });
    }

    // Channel switching via footer tabs
    if (this.ui.footerChatContainer) {
      this.ui.footerChatContainer.addEventListener('click', e => {
        const tab = e.target.closest('.footer-tab-button');
        if (tab && !tab.id.includes('open-chat')) {
          this.switchChannel(tab.dataset.channel);
        }
      });
    }

    // Channel switching via full chat modal tabs
    if (this.ui.tabsContainer) {
      this.ui.tabsContainer.addEventListener('click', e => {
        const tab = e.target.closest('.tab');
        if (tab) this.switchChannel(tab.dataset.channel);
      });
    }

    // Modal toggle visibility
    if (this.ui.openChatModalBtn) {
      this.ui.openChatModalBtn.addEventListener('click', () => {
        if (this.ui.chatModal) this.ui.chatModal.classList.remove('hidden');
      });
    }

    if (this.ui.closeChatModalBtn) {
      this.ui.closeChatModalBtn.addEventListener('click', () => {
        if (this.ui.chatModal) this.ui.chatModal.classList.add('hidden');
      });
    }
  }

  async sendMessage(text) {
    // Verification: DataManager must have established a user and connection
    if (!this.state.firebase.db || !this.state.player) {
      this.showToast("Connection lost. Authenticate to chat.", true);
      return;
    }

    const message = {
      userId: this.state.firebase.userId,
      username: this.state.player.name,
      text: text,
      timestamp: window.firebase.serverTimestamp()
    };

    try {
      const channelRef = window.firebase.collection(
        this.state.firebase.db,
        'chat',
        this.state.chat.currentChannel,
        'messages'
      );
      await window.firebase.addDoc(channelRef, message);
    } catch (error) {
      console.error("❌ Chat Error:", error);
      this.showToast("Message lost in the Void.", true);
    }
  }

  listenForMessages(channel) {
    if (this.state.chat.unsubscribeListener) {
      this.state.chat.unsubscribeListener();
    }

    const messagesRef = window.firebase.collection(
      this.state.firebase.db,
      'chat',
      channel,
      'messages'
    );

    const q = window.firebase.query(
      messagesRef,
      window.firebase.orderBy('timestamp', 'asc'),
      window.firebase.limitToLast(50)
    );

    this.state.chat.unsubscribeListener = window.firebase.onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          this.renderMessage(change.doc.data());
        }
      });
    }, (error) => {
      console.error("❌ Snapshot Error:", error);
    });
  }

  renderMessage(data) {
    const isCurrentUser = data.userId === this.state.firebase.userId;
    const messageHTML = `
      <div class="message-wrapper flex ${isCurrentUser ? 'justify-end' : 'justify-start'}"> 
        <div class="chat-bubble p-2 rounded-lg max-w-[80%] ${isCurrentUser ? 'chat-bubble-user' : 'chat-bubble-other'}"> 
          ${!isCurrentUser ? `<p class="font-bold text-xs" style="color: var(--highlight-color);">${data.username}</p>` : ''} 
          <p class="text-sm">${data.text}</p> 
        </div> 
      </div>`;

    if (this.ui.footerChatContentWrapper) {
      this.ui.footerChatContentWrapper.innerHTML += messageHTML;
      this.ui.footerChatContentWrapper.scrollTop = this.ui.footerChatContentWrapper.scrollHeight;
    }

    if (this.ui.chatMessages) {
      this.ui.chatMessages.innerHTML += messageHTML;
      this.ui.chatMessages.scrollTop = this.ui.chatMessages.scrollHeight;
    }
  }

  switchChannel(newChannel) {
    if (this.state.chat.currentChannel === newChannel) return;

    this.state.chat.currentChannel = newChannel;
    
    if (this.ui.footerChatContentWrapper) this.ui.footerChatContentWrapper.innerHTML = '';
    if (this.ui.chatMessages) this.ui.chatMessages.innerHTML = '';

    document.querySelectorAll('.footer-tab-button, #tabs-container .tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.channel === newChannel);
    });

    this.listenForMessages(newChannel);
    console.log(`🌐 Channel: ${newChannel}`);
  }
}