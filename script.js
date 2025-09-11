document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const messagesContainer = document.getElementById('messages-container');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearChatBtn = document.getElementById('clear-chat');
    const menuToggle = document.getElementById('menu-toggle');
    const sidePanel = document.querySelector('.side-panel');
    const conversationList = document.getElementById('conversation-list');
    const attachBtn = document.getElementById('attach-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const settingsBtn = document.getElementById('settings-btn');
    
    // Modal elements
    const uploadModal = document.getElementById('upload-modal');
    const closeUploadModal = document.getElementById('close-upload-modal');
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const browseFilesBtn = document.querySelector('.browse-files');
    const cancelUpload = document.getElementById('cancel-upload');
    const confirmUpload = document.getElementById('confirm-upload');
    
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const hapticToggle = document.getElementById('haptic-toggle');
    const responseLength = document.getElementById('response-length');
    const temperatureSlider = document.getElementById('temperature-slider');
    const temperatureValue = document.getElementById('temperature-value');
    const resetSettings = document.getElementById('reset-settings');
    const saveSettings = document.getElementById('save-settings');
    
    // Create overlay element for mobile
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    
    // App state
    let conversations = [];
    let currentConversationId = generateId();
    let isWaitingForResponse = false;
    
    // Initialize with one empty conversation
    addNewConversation("New conversation");
    
    // Initial welcome message
    displayAIMessage("Hello! I'm Seven AI powered by Llama 3.2. How can I assist you today?");
    
    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'light') {
      document.body.classList.add('light-mode');
      darkModeToggle.checked = false;
    }
    
    // Event listeners
    messageInput.addEventListener('input', function() {
      sendBtn.disabled = !this.value.trim() || isWaitingForResponse;
    });
    
    messageInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey && this.value.trim() && !isWaitingForResponse) {
        sendMessage();
      }
    });
    
    sendBtn.addEventListener('click', function() {
      if (messageInput.value.trim() && !isWaitingForResponse) {
        sendMessage();
        addHapticFeedback(this);
      }
    });
    
    newChatBtn.addEventListener('click', function() {
      startNewConversation();
      addHapticFeedback(this);
    });
    
    clearChatBtn.addEventListener('click', function() {
      clearCurrentChat();
      addHapticFeedback(this);
    });
    
    // Make menu toggle work on all screen sizes
    menuToggle.addEventListener('click', function() {
      sidePanel.classList.toggle('open');
      overlay.classList.toggle('active');
      addHapticFeedback(this);
    });
    
    overlay.addEventListener('click', function() {
      sidePanel.classList.remove('open');
      overlay.classList.remove('active');
      closeAllModals();
    });
    
    // Attach button functionality - Open upload modal
    attachBtn.addEventListener('click', function() {
      openModal(uploadModal);
      addHapticFeedback(this);
    });
    
    // Voice button functionality
    voiceBtn.addEventListener('click', function() {
      addHapticFeedback(this);
      alert('Voice input feature is coming soon!');
    });
    
    // Settings button functionality
    settingsBtn.addEventListener('click', function() {
      openModal(settingsModal);
      addHapticFeedback(this);
    });
    
    // Dark mode toggle
    darkModeToggle.addEventListener('change', function() {
      if (this.checked) {
        document.body.classList.remove('light-mode');
        localStorage.setItem('darkMode', 'dark');
      } else {
        document.body.classList.add('light-mode');
        localStorage.setItem('darkMode', 'light');
      }
    });
    
    // Upload modal functionality
    closeUploadModal.addEventListener('click', function() {
      closeModal(uploadModal);
      addHapticFeedback(this);
    });
    
    browseFilesBtn.addEventListener('click', function() {
      fileInput.click();
      addHapticFeedback(this);
    });
    
    fileInput.addEventListener('change', function() {
      handleFiles(this.files);
    });
    
    // Drag and drop support
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
      dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
      dropArea.classList.remove('drag-over');
    }
    
    dropArea.addEventListener('drop', function(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files);
    });
    
    cancelUpload.addEventListener('click', function() {
      clearFileList();
      closeModal(uploadModal);
      addHapticFeedback(this);
    });
    
    confirmUpload.addEventListener('click', function() {
      // Simulate upload process
      if (fileList.children.length > 0) {
        closeModal(uploadModal);
        displayAIMessage("I've received your files. How would you like me to process them?");
        clearFileList();
      } else {
        alert("Please select files to upload first.");
      }
      addHapticFeedback(this);
    });
    
    // Settings modal functionality
    closeSettingsModal.addEventListener('click', function() {
      closeModal(settingsModal);
      addHapticFeedback(this);
    });
    
    temperatureSlider.addEventListener('input', function() {
      temperatureValue.textContent = (this.value / 100).toFixed(1);
    });
    
    resetSettings.addEventListener('click', function() {
      darkModeToggle.checked = true;
      hapticToggle.checked = true;
      responseLength.value = 'medium';
      temperatureSlider.value = 70;
      temperatureValue.textContent = '0.7';
      document.body.classList.remove('light-mode');
      localStorage.setItem('darkMode', 'dark');
      addHapticFeedback(this);
    });
    
    saveSettings.addEventListener('click', function() {
      // Save settings (in a real app, this would persist settings)
      closeModal(settingsModal);
      addHapticFeedback(this);
      displayAIMessage("Your settings have been updated.");
    });
    
    // Make all buttons haptic
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.classList.add('haptic');
    });
    
    // Functions
    function sendMessage() {
      const userMessage = messageInput.value.trim();
      displayUserMessage(userMessage);
      
      // Update conversation title with first few words of first message if this is the first message
      const currentConversation = findConversationById(currentConversationId);
      if (currentConversation && currentConversation.messages.length === 0) {
        const title = userMessage.substring(0, 20) + (userMessage.length > 20 ? "..." : "");
        currentConversation.title = title;
        updateConversationsList();
      }
      
      // Add message to conversation history
      if (currentConversation) {
        currentConversation.messages.push({
          sender: 'user',
          text: userMessage,
          timestamp: new Date()
        });
      }
      
      messageInput.value = '';
      sendBtn.disabled = true;
      isWaitingForResponse = true;
      
      // Scroll to bottom
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
      
      // Show typing indicator
      showTypingIndicator();
      
      // Send to Llama 3.2 1B model via our backend API
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConversationId
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        removeTypingIndicator();
        displayAIMessage(data.response);
        isWaitingForResponse = false;
      })
      .catch(error => {
        console.error('Error:', error);
        removeTypingIndicator();
        displayAIMessage("I'm having trouble connecting to my brain right now. Please try again later.");
        isWaitingForResponse = false;
      });
    }
    
    function displayUserMessage(text) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message user';
      
      const time = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      messageElement.innerHTML = `
        <div class="message-content">
          <div class="message-text">${text}</div>
          <div class="message-timestamp">${time}</div>
        </div>
      `;
      
      messagesContainer.appendChild(messageElement);
      scrollToBottom();
    }
    
    function displayAIMessage(text) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message ai';
      
      const time = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      messageElement.innerHTML = `
        <div class="message-content">
          <div class="message-text">${text}</div>
          <div class="message-timestamp">${time}</div>
        </div>
      `;
      
      messagesContainer.appendChild(messageElement);
      scrollToBottom();
      
      // Add message to conversation history
      const currentConversation = findConversationById(currentConversationId);
      if (currentConversation) {
        currentConversation.messages.push({
          sender: 'ai',
          text: text,
          timestamp: new Date()
        });
      }
    }
    
    function showTypingIndicator() {
      const typingElement = document.createElement('div');
      typingElement.className = 'typing-indicator';
      typingElement.id = 'typing-indicator';
      
      typingElement.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      `;
      
      messagesContainer.appendChild(typingElement);
      scrollToBottom();
    }
    
    function removeTypingIndicator() {
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }
    
    function getAIResponse(userMessage) {
      // This function is now replaced with the fetch API call in sendMessage()
      // Keeping this as a fallback for offline testing
      const responses = [
        "I've analyzed your query and can provide insights based on my training data. The key concepts to understand here are...",
        "That's an interesting question about artificial intelligence. From my analysis, there are several perspectives to consider...",
        "Based on current research in this area, I can tell you that most experts believe the following approaches are most promising...",
        "I've processed your request and can offer some detailed thoughts. The core principles at work here involve...",
        "Looking at this from a machine learning perspective, we should consider these key factors that influence how systems like me operate..."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      displayAIMessage(randomResponse);
    }
    
    function clearCurrentChat() {
      messagesContainer.innerHTML = '';
      displayAIMessage("Hello! I'm Seven AI powered by Llama 3.2. How can I assist you today?");
      
      // Clear messages for current conversation
      const currentConversation = findConversationById(currentConversationId);
      if (currentConversation) {
        currentConversation.messages = [];
      }
    }
    
    function scrollToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function addHapticFeedback(element) {
      // If device supports vibration API and haptic is enabled
      if ('vibrate' in navigator && hapticToggle.checked) {
        navigator.vibrate(20);
      }
      
      // Visual feedback
      element.classList.add('active-feedback');
      setTimeout(() => {
        element.classList.remove('active-feedback');
      }, 200);
    }
    
    function openModal(modal) {
      modal.classList.add('active');
      overlay.classList.add('active');
    }
    
    function closeModal(modal) {
      modal.classList.remove('active');
      overlay.classList.remove('active');
    }
    
    function closeAllModals() {
      uploadModal.classList.remove('active');
      settingsModal.classList.remove('active');
    }
    
    function handleFiles(files) {
      if (files.length > 0) {
        Array.from(files).forEach(file => {
          addFileToList(file);
        });
      }
    }
    
    function addFileToList(file) {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      // Format file size
      const fileSize = formatFileSize(file.size);
      
      // Get appropriate icon based on file type
      let fileIcon = 'description';
      if (file.type.startsWith('image/')) {
        fileIcon = 'image';
      } else if (file.type.startsWith('audio/')) {
        fileIcon = 'audiotrack';
      } else if (file.type.startsWith('video/')) {
        fileIcon = 'videocam';
      }
      
      fileItem.innerHTML = `
        <div class="file-info">
          <span class="material-icons">${fileIcon}</span>
          <div>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${fileSize}</div>
          </div>
        </div>
        <button class="remove-file">
          <span class="material-icons">close</span>
        </button>
      `;
      
      const removeBtn = fileItem.querySelector('.remove-file');
      removeBtn.addEventListener('click', function() {
        fileItem.remove();
        addHapticFeedback(this);
      });
      
      fileList.appendChild(fileItem);
    }
    
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function clearFileList() {
      fileList.innerHTML = '';
      fileInput.value = '';
    }
    
    // Conversation management
    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    function addNewConversation(title) {
      const id = generateId();
      const conversation = {
        id: id,
        title: title,
        messages: [],
        timestamp: new Date()
      };
      
      conversations.push(conversation);
      addConversationToList(conversation);
      
      return id;
    }
    
    function addConversationToList(conversation) {
      const conversationItem = document.createElement('div');
      conversationItem.className = 'conversation-item';
      conversationItem.dataset.id = conversation.id;
      
      if (conversation.id === currentConversationId) {
        conversationItem.classList.add('active');
      }
      
      conversationItem.innerHTML = `
        <span class="material-icons">chat</span>
        <div class="conversation-title">${conversation.title}</div>
      `;
      
      conversationItem.addEventListener('click', function() {
        loadConversation(conversation.id);
        addHapticFeedback(this);
      });
      
      conversationList.appendChild(conversationItem);
    }
    
    function updateConversationsList() {
      conversationList.innerHTML = '';
      
      // Sort conversations with most recent first
      const sortedConversations = [...conversations].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      sortedConversations.forEach(conversation => {
        addConversationToList(conversation);
      });
    }
    
    function loadConversation(conversationId) {
      const conversation = findConversationById(conversationId);
      if (!conversation) return;
      
      // Update UI to show this is the active conversation
      document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
      });
      
      const activeItem = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
      if (activeItem) {
        activeItem.classList.add('active');
      }
      
      // Set as current conversation
      currentConversationId = conversationId;
      
      // Clear messages container
      messagesContainer.innerHTML = '';
      
      // Display conversation messages
      if (conversation.messages.length === 0) {
        // Show welcome message for empty conversations
        displayAIMessage("Hello! I'm Seven AI powered by Llama 3.2. How can I assist you today?");
      } else {
        // Display all messages in the conversation
        conversation.messages.forEach(message => {
          if (message.sender === 'user') {
            displayUserMessage(message.text);
          } else {
            displayAIMessage(message.text);
          }
        });
      }
      
      // Close the sidebar on mobile after selecting a conversation
      if (window.innerWidth < 768) {
        sidePanel.classList.remove('open');
        overlay.classList.remove('active');
      }
    }
    
    function findConversationById(id) {
      return conversations.find(conversation => conversation.id === id);
    }
    
    function startNewConversation() {
      // Create a new conversation
      const newId = addNewConversation("New conversation");
      currentConversationId = newId;
      
      // Update the UI
      updateConversationsList();
      
      // Load the new conversation
      loadConversation(newId);
      
      // Close the sidebar on mobile
      if (window.innerWidth < 768) {
        sidePanel.classList.remove('open');
        overlay.classList.remove('active');
      }
    }
  });
