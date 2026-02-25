// src/managers/social/ChatManager.js

export class ChatManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.showToast = deps.showToast;
    this.isInitialized = false;
    this.localMessages = { main: [], clan: [], sales: [], pms: [] }; // Local dev fallback
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Ensure chat state container exists
    if (!this.state.chat) this.state.chat = { currentChannel: null };

    this.bindUI();
    this.addEventListeners();
    this.updateSidebar();
    this.switchChannel('main');
    console.log("💬 Chat Manager: Listening for Aetherial signals.");
  }

  updateSidebar() {
    if (!this.state.player) return;
    
    // Populate live player data into sidebar
    if (this.ui.sidebarUsername) this.ui.sidebarUsername.innerText = this.state.player.name || "Unknown";
    if (this.ui.sidebarLevel) this.ui.sidebarLevel.innerText = this.state.player.level || 1;
    if (this.ui.sidebarGold) {
        const gold = this.state.player.inventory?.gold || 0;
        this.ui.sidebarGold.innerText = gold.toLocaleString();
    }
    if (this.ui.sidebarRole) this.ui.sidebarRole.innerText = this.state.player.clanRole || "Member";
    
    // Mock online users for Local Dev Mode
    if (this.ui.onlineUsersList) {
      this.ui.onlineUsersList.innerHTML = `
        <div class="flex items-center gap-2 py-1"><div class="w-2 h-2 rounded-full bg-green-500"></div><span class="text-cyan-400">${this.state.player.name || "You"}</span></div>
        <div class="flex items-center gap-2 py-1"><div class="w-2 h-2 rounded-full bg-green-500"></div><span>Geminus_Admin</span></div>
        <div class="flex items-center gap-2 py-1"><div class="w-2 h-2 rounded-full bg-green-500"></div><span>Shadow_Hunter</span></div>
      `;
    }
  }

  bindUI() {
    this.ui.footerMessageForm = this.ui.footerMessageForm || document.getElementById('footer-message-form');
    this.ui.footerMessageInput = this.ui.footerMessageInput || document.getElementById('footer-message-input');
    this.ui.footerChatContainer = this.ui.footerChatContainer || document.getElementById('footer-chat-container');
    this.ui.footerChatContentWrapper = this.ui.footerChatContentWrapper || document.getElementById('footer-chat-content-wrapper');
    this.ui.chatModal = this.ui.chatModal || document.getElementById('chat-modal');
    this.ui.tabsContainer = this.ui.tabsContainer || document.getElementById('tabs-container');
    this.ui.openChatModalBtn = this.ui.openChatModalBtn || document.getElementById('open-chat-modal-btn');
    this.ui.closeChatModalBtn = this.ui.closeChatModalBtn || document.getElementById('close-chat-modal-btn');
    this.ui.messageForm = this.ui.messageForm || document.getElementById('message-form');
    this.ui.messageInput = this.ui.messageInput || document.getElementById('message-input');
    this.ui.chatMessages = this.ui.chatMessages || document.getElementById('chat-messages');
    
    // Intricate Chat Layout Bindings
    this.ui.sidebar = this.ui.sidebar || document.getElementById('sidebar');
    this.ui.sidebarOverlay = this.ui.sidebarOverlay || document.getElementById('sidebar-overlay');
    this.ui.openSidebarBtn = this.ui.openSidebarBtn || document.getElementById('open-sidebar-btn');
    this.ui.closeSidebarBtn = this.ui.closeSidebarBtn || document.getElementById('close-sidebar-btn');
    this.ui.profileModal = this.ui.profileModal || document.getElementById('profile-modal');
    this.ui.userProfileButton = this.ui.userProfileButton || document.getElementById('user-profile-button');
    this.ui.cancelProfileBtn = this.ui.cancelProfileBtn || document.getElementById('cancel-profile-btn');
    this.ui.salesView = this.ui.salesView || document.getElementById('sales-view');
    
    // Auction, Bid, and Sub-Tab Bindings
    this.ui.subTabsContainer = this.ui.subTabsContainer || document.getElementById('sub-tabs-container');
    this.ui.auctionModal = this.ui.auctionModal || document.getElementById('auction-modal');
    this.ui.cancelAuctionBtn = this.ui.cancelAuctionBtn || document.getElementById('cancel-auction-btn');
    this.ui.bidModal = this.ui.bidModal || document.getElementById('bid-modal');
    this.ui.cancelBidBtn = this.ui.cancelBidBtn || document.getElementById('cancel-bid-btn');
    this.ui.pmList = this.ui.pmList || document.getElementById('pm-list');
    
    // Action Buttons
    this.ui.saveProfileBtn = this.ui.saveProfileBtn || document.getElementById('save-profile-btn');
    this.ui.usernameInput = this.ui.usernameInput || document.getElementById('username-input');
    this.ui.confirmAuctionBtn = this.ui.confirmAuctionBtn || document.getElementById('confirm-auction-btn');
    this.ui.placeBidBtn = this.ui.placeBidBtn || document.getElementById('place-bid-btn');
    this.ui.buyNowBtn = this.ui.buyNowBtn || document.getElementById('buy-now-btn');
    
    // Intricate Sidebar Profile & Sim bindings
    this.ui.sidebarUsername = this.ui.sidebarUsername || document.getElementById('sidebar-username');
    this.ui.sidebarLevel = this.ui.sidebarLevel || document.getElementById('sidebar-level');
    this.ui.sidebarGold = this.ui.sidebarGold || document.getElementById('sidebar-gold');
    this.ui.sidebarRole = this.ui.sidebarRole || document.getElementById('sidebar-role');
    this.ui.onlineUsersList = this.ui.onlineUsersList || document.getElementById('online-users-list');
    
    this.ui.simKillsBtn = this.ui.simKillsBtn || document.getElementById('simulate-kills-btn');
    this.ui.simLevelBtn = this.ui.simLevelBtn || document.getElementById('simulate-level-btn');
    
    // Intricate Reply Bindings
    this.ui.replyIndicator = this.ui.replyIndicator || document.getElementById('reply-indicator');
    this.ui.replyUsername = this.ui.replyUsername || document.getElementById('reply-username');
    this.ui.replyText = this.ui.replyText || document.getElementById('reply-text');
    this.ui.cancelReplyBtn = this.ui.cancelReplyBtn || document.getElementById('cancel-reply-btn');
  }

  cancelReply() {
    this.state.chat.replyingTo = null;
    if (this.ui.replyIndicator) this.ui.replyIndicator.classList.add('hidden');
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
          const channel = tab.dataset.channel;
          
          // Architectural Simplification: Auto-expand modal for complex GUI views
          if (channel === 'sales' || channel === 'pms') {
            if (this.ui.chatModal) {
              this.ui.chatModal.classList.remove('hidden');
              this.ui.chatModal.classList.add('flex');
            }
          }
          
          this.switchChannel(channel);
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

    // Intricate Sidebar & Profile Toggles
    const toggleSidebar = (show) => {
      if (!this.ui.sidebar || !this.ui.sidebarOverlay) return;
      if (show) {
        this.ui.sidebar.classList.remove('sidebar-closed');
        this.ui.sidebar.classList.add('sidebar-open');
        this.ui.sidebarOverlay.classList.remove('hidden');
      } else {
        this.ui.sidebar.classList.add('sidebar-closed');
        this.ui.sidebar.classList.remove('sidebar-open');
        this.ui.sidebarOverlay.classList.add('hidden');
      }
    };

    if (this.ui.openSidebarBtn) this.ui.openSidebarBtn.addEventListener('click', () => toggleSidebar(true));
    if (this.ui.closeSidebarBtn) this.ui.closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
    if (this.ui.sidebarOverlay) this.ui.sidebarOverlay.addEventListener('click', () => toggleSidebar(false));
    
    if (this.ui.userProfileButton) {
      this.ui.userProfileButton.addEventListener('click', () => {
        if (this.ui.profileModal) this.ui.profileModal.classList.remove('hidden');
      });
    }
    if (this.ui.cancelProfileBtn) {
      this.ui.cancelProfileBtn.addEventListener('click', () => {
        if (this.ui.profileModal) this.ui.profileModal.classList.add('hidden');
      });
    }

    // Event Delegation for Reply Buttons (Replaces Global Scope Leak)
    const handleReplyClick = (e) => {
      const replyBtn = e.target.closest('.reply-icon');
      if (replyBtn) {
        this.setReply(replyBtn.dataset.replyUser, replyBtn.dataset.replyText);
      }
    };
    if (this.ui.chatMessages) this.ui.chatMessages.addEventListener('click', handleReplyClick);
    if (this.ui.footerChatContentWrapper) this.ui.footerChatContentWrapper.addEventListener('click', handleReplyClick);

    // Modal Close Listeners
    if (this.ui.cancelAuctionBtn) this.ui.cancelAuctionBtn.addEventListener('click', () => { if (this.ui.auctionModal) this.ui.auctionModal.classList.add('hidden'); });
    if (this.ui.cancelBidBtn) this.ui.cancelBidBtn.addEventListener('click', () => { if (this.ui.bidModal) this.ui.bidModal.classList.add('hidden'); });

    // Modal Action Listeners (Local Dev Mocks)
    if (this.ui.saveProfileBtn) {
      this.ui.saveProfileBtn.addEventListener('click', () => {
        if (this.ui.usernameInput && this.ui.usernameInput.value.trim() && this.state.player) {
          this.state.player.name = this.ui.usernameInput.value.trim();
          this.updateSidebar();
          this.showToast("Profile Identity Updated!");
        }
        if (this.ui.profileModal) this.ui.profileModal.classList.add('hidden');
      });
    }

    if (this.ui.confirmAuctionBtn) {
      this.ui.confirmAuctionBtn.addEventListener('click', () => {
        this.showToast("Auction Created! (Local Dev)");
        if (this.ui.auctionModal) this.ui.auctionModal.classList.add('hidden');
      });
    }

    if (this.ui.placeBidBtn) {
      this.ui.placeBidBtn.addEventListener('click', () => {
        this.showToast("Bid Placed successfully!");
        if (this.ui.bidModal) this.ui.bidModal.classList.add('hidden');
      });
    }

    if (this.ui.buyNowBtn) {
      this.ui.buyNowBtn.addEventListener('click', () => {
        this.showToast("Item Purchased! (Local Dev)");
        if (this.ui.bidModal) this.ui.bidModal.classList.add('hidden');
      });
    }

    // Sub-Tab Interaction Delegation
    if (this.ui.subTabsContainer) {
      this.ui.subTabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.sub-tab');
        if (tab) {
          this.ui.subTabsContainer.querySelectorAll('.sub-tab').forEach(t => {
            t.classList.remove('active', 'text-cyan-400');
          });
          tab.classList.add('active', 'text-cyan-400');
          this.showToast(`Switched to: ${tab.innerText} (Mock)`);
        }
      });
    }

    // Event Delegation for Sales View Buttons (Bid/Buyout/Create)
    if (this.ui.salesView) {
      this.ui.salesView.addEventListener('click', (e) => {
        if (e.target.closest('.create-listing-btn')) {
          if (this.ui.auctionModal) this.ui.auctionModal.classList.remove('hidden');
        } else if (e.target.closest('.bid-btn') || e.target.closest('.buyout-btn')) {
          if (this.ui.bidModal) this.ui.bidModal.classList.remove('hidden');
        }
      });
    }

    // Intricate Simulation Buttons (Local Dev)
    if (this.ui.simKillsBtn) {
      this.ui.simKillsBtn.addEventListener('click', () => {
        if (!this.state.player) return;
        this.showToast("Simulated 100 Kills! (Local UI Only)");
        const currentGold = this.state.player.inventory?.gold || 0;
        if (this.ui.sidebarGold) this.ui.sidebarGold.innerText = (currentGold + 5000).toLocaleString();
      });
    }
    
    if (this.ui.simLevelBtn) {
      this.ui.simLevelBtn.addEventListener('click', () => {
        if (!this.state.player) return;
        this.showToast("Gained 10 Levels! (Local UI Only)");
        const currentLevel = this.state.player.level || 1;
        if (this.ui.sidebarLevel) this.ui.sidebarLevel.innerText = currentLevel + 10;
      });
    }

    if (this.ui.cancelReplyBtn) {
      this.ui.cancelReplyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.cancelReply();
      });
    }

    // Modal toggle visibility
    if (this.ui.openChatModalBtn) {
      this.ui.openChatModalBtn.addEventListener('click', () => {
        if (this.ui.chatModal) {
          this.ui.chatModal.classList.remove('hidden');
          this.ui.chatModal.classList.add('flex');
          // Auto-scroll to bottom when modal opens
          if (this.ui.chatMessages) this.ui.chatMessages.scrollTop = this.ui.chatMessages.scrollHeight;
        }
      });
    }

    if (this.ui.closeChatModalBtn) {
      this.ui.closeChatModalBtn.addEventListener('click', () => {
        if (this.ui.chatModal) {
          this.ui.chatModal.classList.add('hidden');
          this.ui.chatModal.classList.remove('flex');
        }
      });
    }
  }

  async sendMessage(text) {
    if (!this.state.player) {
      this.showToast("Player missing. Create a character first.", true);
      return;
    }

    const message = {
      userId: this.state.firebase?.userId || 'local_dev_1',
      username: this.state.player.name || 'Local Hero',
      text: text,
      timestamp: this.state.firebase?.db ? window.firebase.serverTimestamp() : { toDate: () => new Date() },
      replyTo: this.state.chat.replyingTo || null
    };

    this.cancelReply(); // Clear reply state after capturing payload

    // LOCAL DEV MODE BYPASS
    if (!this.state.firebase?.db) {
      if (!this.localMessages[this.state.chat.currentChannel]) this.localMessages[this.state.chat.currentChannel] = [];
      this.localMessages[this.state.chat.currentChannel].push(message);
      this.renderMessage(message);
      return;
    }

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
    // LOCAL DEV MODE BYPASS
    if (!this.state.firebase?.db) {
      if (this.ui.chatMessages) this.ui.chatMessages.innerHTML = '';
      if (this.ui.footerChatContentWrapper) this.ui.footerChatContentWrapper.innerHTML = '';
      const localMsgs = this.localMessages[channel] || [];
      localMsgs.forEach(msg => this.renderMessage(msg));
      return;
    }

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
    const isCurrentUser = data.userId === (this.state.firebase?.userId || 'local_dev_1');
    const timeString = data.timestamp?.toDate ? data.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgId = data.id || `msg_${Date.now()}_${Math.random()}`;
    const safeText = data.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    let replyHTML = '';
    if (data.replyTo) {
        replyHTML = `<div class="reply-quote mb-1 border-l-2 border-cyan-500 pl-2 bg-black/30 rounded text-xs text-gray-400">
            <span class="text-cyan-600 font-bold">${data.replyTo.username}</span>: ${data.replyTo.text}
        </div>`;
    }

    const messageHTML = `
      <div class="message-wrapper flex w-full mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}" id="${msgId}"> 
        ${!isCurrentUser ? `<img src="https://placehold.co/40x40/0a282d/00f6ff?text=${data.username.charAt(0)}" class="w-8 h-8 md:w-10 md:h-10 rounded-full border border-cyan-500/50 mr-2 flex-shrink-0">` : ''}
        <div class="flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%] group">
          <div class="flex items-baseline gap-2 mb-1">
             ${!isCurrentUser ? `<span class="font-bold text-[10px] md:text-xs text-cyan-400 font-orbitron">${data.username}</span>` : ''}
             <span class="text-[8px] md:text-[10px] text-gray-500 font-mono">${timeString}</span>
          </div>
          <div class="chat-bubble relative px-3 py-2 rounded-lg ${isCurrentUser ? 'chat-bubble-user rounded-tr-none' : 'chat-bubble-other rounded-tl-none'}"> 
            ${!isCurrentUser ? `<button class="reply-icon absolute -right-6 top-2 hidden group-hover:block text-cyan-500 hover:text-cyan-300" data-reply-user="${data.username}" data-reply-text="${safeText.replace(/"/g, '&quot;')}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg></button>` : ''}
            ${replyHTML}
            <p class="text-xs md:text-sm leading-snug break-words text-gray-200">${safeText}</p> 
          </div> 
        </div>
      </div>`;

    if (this.ui.footerChatContentWrapper) {
      this.ui.footerChatContentWrapper.insertAdjacentHTML('beforeend', messageHTML);
      this.ui.footerChatContentWrapper.scrollTop = this.ui.footerChatContentWrapper.scrollHeight;
    }

    if (this.ui.chatMessages) {
      this.ui.chatMessages.insertAdjacentHTML('beforeend', messageHTML);
      this.ui.chatMessages.scrollTop = this.ui.chatMessages.scrollHeight;
    }
  }

  setReply(username, text) {
    this.state.chat.replyingTo = { username, text };
    if (this.ui.replyIndicator && this.ui.replyUsername && this.ui.replyText) {
        this.ui.replyUsername.innerText = username;
        this.ui.replyText.innerText = text;
        this.ui.replyIndicator.classList.remove('hidden');
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

    // Handle Intricate View visibility (Sales vs PMs vs Standard Chat)
    if (this.ui.chatMessages && this.ui.salesView && this.ui.pmList) {
      this.ui.chatMessages.classList.add('hidden');
      this.ui.salesView.classList.add('hidden');
      this.ui.pmList.classList.add('hidden');
      if (this.ui.subTabsContainer) this.ui.subTabsContainer.classList.add('hidden');

      if (newChannel === 'sales') {
        this.ui.salesView.classList.remove('hidden');
        if (this.ui.subTabsContainer) {
            this.ui.subTabsContainer.classList.remove('hidden');
            this.ui.subTabsContainer.innerHTML = `<div class="flex gap-6 text-xs font-bold font-orbitron text-gray-500 overflow-x-auto custom-scrollbar px-2"><div class="sub-tab active text-cyan-400 cursor-pointer">Auction House</div><div class="sub-tab hover:text-cyan-400 cursor-pointer transition-colors">Upcoming</div><div class="sub-tab hover:text-cyan-400 cursor-pointer transition-colors">My Bids</div></div>`;
        }
        this.renderMockSales();
        if (this.ui.messageForm) this.ui.messageForm.style.display = 'none';
      } else if (newChannel === 'pms') {
        this.ui.pmList.classList.remove('hidden');
        if (this.ui.subTabsContainer) {
            this.ui.subTabsContainer.classList.remove('hidden');
            this.ui.subTabsContainer.innerHTML = `<div class="flex gap-6 text-xs font-bold font-orbitron text-gray-500 overflow-x-auto custom-scrollbar px-2"><div class="sub-tab active text-cyan-400 cursor-pointer">Inbox</div><div class="sub-tab hover:text-cyan-400 cursor-pointer transition-colors">Sent</div><div class="sub-tab hover:text-cyan-400 cursor-pointer transition-colors">Contacts</div></div>`;
        }
        this.renderMockPMs();
        if (this.ui.messageForm) this.ui.messageForm.style.display = 'none';
      } else {
        this.ui.chatMessages.classList.remove('hidden');
        if (this.ui.messageForm) this.ui.messageForm.style.display = 'flex';
        this.listenForMessages(newChannel);
      }
    } else {
      this.listenForMessages(newChannel);
    }
    
    console.log(`🌐 Channel: ${newChannel}`);
  }

  renderMockSales() {
    if (!this.ui.salesView) return;
    this.ui.salesView.innerHTML = `
      <div class="flex justify-between items-center mb-4 border-b border-cyan-500/30 pb-2">
        <h2 class="text-cyan-500 font-orbitron font-bold uppercase tracking-widest text-sm">Active Auctions</h2>
        <button class="create-listing-btn glass-button px-3 py-1 rounded text-[10px] font-bold text-cyan-400 uppercase">Create Listing</button>
      </div>
      <div class="glass-panel p-4 mb-4 border-cyan-500/50 bg-black/60 relative overflow-hidden">
        <div class="absolute top-0 right-0 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-bl">HOT</div>
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="text-cyan-400 font-orbitron font-bold text-sm md:text-base">Shadow greataxe-WPN-T10</h3>
            <p class="text-[10px] md:text-xs text-gray-400">Seller: <span class="text-white">Geminus_Admin</span></p>
          </div>
          <div class="text-right">
            <p class="text-yellow-400 font-bold text-sm md:text-base">50,000 G</p>
            <p class="text-[10px] md:text-xs text-red-400 font-mono">Ends: 04:23</p>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
           <button class="bid-btn glass-button px-4 py-1.5 rounded text-xs font-bold text-cyan-400 flex-grow hover:bg-cyan-900/40 transition-colors">Bid 55,000</button>
           <button class="buyout-btn glass-button px-4 py-1.5 rounded text-xs font-bold text-yellow-400 border-yellow-400 hover:bg-yellow-900/40 transition-colors">Buyout 100k</button>
        </div>
      </div>
    `;
  }

  renderMockPMs() {
    if (!this.ui.pmList) return;
    this.ui.pmList.innerHTML = `
      <div class="flex justify-between items-center mb-4 border-b border-cyan-500/30 pb-2">
        <h2 class="text-cyan-500 font-orbitron font-bold uppercase tracking-widest text-sm">Direct Transmissions</h2>
        <button class="glass-button px-3 py-1 rounded text-[10px] font-bold text-cyan-400 uppercase">New Message</button>
      </div>
      <div class="glass-panel p-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors border-l-2 border-l-cyan-400">
        <div class="relative">
          <img src="https://placehold.co/40x40/0a282d/00f6ff?text=S" class="w-10 h-10 rounded-full border border-cyan-500">
          <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>
        </div>
        <div class="flex-grow overflow-hidden">
           <div class="flex justify-between items-baseline">
             <h4 class="text-cyan-400 font-bold text-sm truncate">Shadow_Hunter</h4>
             <span class="text-[10px] text-gray-500 font-mono">10:42 AM</span>
           </div>
           <p class="text-xs text-gray-300 truncate">Are you selling that Tier 5 Gem?</p>
        </div>
      </div>
    `;
  }
}