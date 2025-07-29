import { useState, useEffect, useRef } from "react";
import "./Chatbot.css";

const Chatbot = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationState, setConversationState] = useState(null);
  const [formData, setFormData] = useState({});
  const [mode, setMode] = useState(null);
  const [updateData, setUpdateData] = useState({});
  const [updateStep, setUpdateStep] = useState(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const recognitionRef = useRef(null);
  const chatBoxRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Enhanced welcome message with more interactive elements
  const getWelcomeMessage = () => ({
    sender: "bot",
    text: `👋 Welcome to CRUD Chatbot! I'm here to help you manage your user data efficiently.

🚀 **Available Commands:**

📝 **ADD** - Create a new user profile
   Example: "add" or "create new user"

🔍 **GET** - Search and retrieve users
   • By name: or "users starting with A"
   • By location: "users from Kerala" or " users from Chennai"  
   • By age: "age above 30" 
   

✏️ **UPDATE** - Modify existing user data
   Example: "update" by id

🗑️ **DELETE** - Remove a user (with confirmation)
   Example: "delete" by id

💡 **Pro Tips:**
• Use voice input by clicking the 🎤 microphone
• Type naturally - I understand conversational language
• All operations are secure and require confirmation

Ready to get started? Just type a command or ask me anything! 🌟`,
  });

  // Enhanced message responses with icons and formatting
  const enhanceMessage = (text, type = 'info') => {
    let icon = '';
    switch (type) {
      case 'success': icon = '✅ '; break;
      case 'error': icon = '❌ '; break;
      case 'search': icon = '🔍 '; break;
      case 'warning': icon = '⚠️ '; break;
      case 'info': icon = 'ℹ️ '; break;
      case 'add': icon = '➕ '; break;
      case 'update': icon = '📝 '; break;
      case 'delete': icon = '🗑️ '; break;
      case 'user': icon = '👤 '; break;
      default: icon = '';
    }
    return icon + text;
  };

  useEffect(() => {
    setMessages([getWelcomeMessage()]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let speechToText = event.results[0][0].transcript.trim();
        speechToText = speechToText.replace(/[.,!?]$/, "");
        setInput(speechToText);
        
        // Add visual feedback for voice input
        const voiceButton = document.querySelector('.voice-button');
        if (voiceButton) {
          voiceButton.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          setTimeout(() => {
            voiceButton.style.background = 'linear-gradient(135deg, #f59e0b, #f97316)';
          }, 1000);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: enhanceMessage("Sorry, I couldn't understand that. Please try again or type your message.", 'error')
        }]);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      // Visual feedback for voice recording
      const voiceButton = document.querySelector('.voice-button');
      if (voiceButton) {
        voiceButton.innerHTML = '🔴';
        voiceButton.style.animation = 'pulse 1s infinite';
        setTimeout(() => {
          voiceButton.innerHTML = '🎤';
          voiceButton.style.animation = '';
        }, 3000);
      }
    } else {
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: enhanceMessage("Voice recognition is not supported in this browser. Please type your message instead.", 'warning')
      }]);
    }
  };

  const formatUser = (user) => {
    return `👤 **User Profile**
━━━━━━━━━━━━━━━━
📝 Name: ${user.name || "N/A"}
🎂 Age: ${user.age || "N/A"}
📧 Email:${user.email || "N/A"}
📱 Phone:${user.phone || "N/A"}
🏠 Address: ${user.address || "N/A"}
🆔 User ID: ${user.user_id || "N/A"}
━━━━━━━━━━━━━━━━`;
  };

  const handleRefresh = () => {
    // Clear all states properly
    setMessages([getWelcomeMessage()]);
    setInput("");
    setLoading(false);
    setConversationState(null);
    setFormData({});
    setMode(null);
    setUpdateData({});
    setUpdateStep(null);
    setPendingDeleteUser(null);
    
    // Add confirmation message
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: enhanceMessage("Session refreshed! All data cleared and ready for new operations.", 'success')
      }]);
    }, 500);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { sender: "user", text: input };
    setMessages(prev => [...prev, newMessage]);
    const lowerInput = input.trim().toLowerCase();

    // ADD FLOW
    if (conversationState) {
      const updatedForm = { ...formData };
      let nextState = null;

      switch (conversationState) {
        case "name":
          updatedForm.name = input;
          nextState = "age";
          break;
        case "age":
          if (isNaN(input) || input <= 0) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage("Please enter a valid age (numbers only).", 'error')
            }]);
            setInput("");
            return;
          }
          updatedForm.age = input;
          nextState = "email";
          break;
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input)) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage("Please enter a valid email address (e.g., user@example.com).", 'error')
            }]);
            setInput("");
            return;
          }
          updatedForm.email = input;
          nextState = "phone";
          break;
        case "phone":
          const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;
          if (!phoneRegex.test(input.replace(/[\s\-\(\)]/g, ''))) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage("Please enter a valid phone number (10+ digits).", 'error')
            }]);
            setInput("");
            return;
          }
          updatedForm.phone = input;
          nextState = "address";
          break;
        case "address":
          updatedForm.address = input;
          nextState = "user_id";
          break;
        case "user_id":
          if (isNaN(input) || input <= 0) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage("Please enter a valid User ID (numbers only).", 'error')
            }]);
            setInput("");
            return;
          }
          updatedForm.user_id = input;
          setFormData(updatedForm);
          setConversationState(null);
          setMode(null);

          setMessages(prev => [
            ...prev,
            { sender: "bot", text: enhanceMessage(`User profile created successfully!\n\n${formatUser(updatedForm)}`, 'success') },
          ]);

          try {
            setLoading(true);
            const res = await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "add", data: updatedForm }),
            });
            const result = await res.json();
            setMessages(prev => [
              ...prev,
              { sender: "bot", text: enhanceMessage(result.message || "User data saved to database successfully!", 'success') },
            ]);
          } catch {
            setMessages(prev => [
              ...prev,
              { sender: "bot", text: enhanceMessage("Failed to save to database. Please try again.", 'error') },
            ]);
          } finally {
            setLoading(false);
          }

          setMessages(prev => [
            ...prev,
            { sender: "bot", text: enhanceMessage("What would you like to do next?\n\n💡 Try: 'add', 'get', 'update', or 'delete'", 'info') },
          ]);
          setInput("");
          return;
      }

      setFormData(updatedForm);

      if (nextState) {
        setConversationState(nextState);
        const prompts = {
          name: "What's the user's full name?",
          age: "How old are they? (Enter age in years)",
          email: "What's their email address?",
          phone: "What's their phone number?",
          address: "What's their address?",
          user_id: "Finally, assign a unique User ID (number)"
        };
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: enhanceMessage(prompts[nextState], 'add') },
        ]);
      }

      setInput("");
      return;
    }

    // GET MODE
    if (mode === "get") {
      try {
        setLoading(true);
        let res;
        const trimmed = input.trim();

        if (/^\d+$/.test(trimmed)) {
          res = await fetch(`${API_URL}?user_id=${trimmed}`);
          const data = await res.json();

          if (!data || data.error || !data.name) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(`No user found with ID: ${trimmed}`, 'error')
            }]);
          } else {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(`User found!\n\n${formatUser(data)}`, 'user')
            }]);
          }
          setMode(null);
        } else {
          res = await fetch(`${API_URL}?name=${encodeURIComponent(trimmed)}`);
          const data = await res.json();

          if (!data || data.error || (Array.isArray(data) && data.length === 0)) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(`No users found with name: "${trimmed}"`, 'error')
            }]);
            setMode(null);
          } else if (Array.isArray(data) && data.length > 1) {
            const summary = data.slice(0, 5).map((u, i) => `**${i + 1}.** ${u.name} (ID: ${u.user_id})`).join('\n');
            const message = data.length > 5
              ? `Found ${data.length} users named "${trimmed}":\n\n${summary}\n\n...and ${data.length - 5} more.\n\n💡 Enter a User ID to view details.`
              : `Found ${data.length} users named "${trimmed}":\n\n${summary}\n\n💡 Enter a User ID to view details.`;

            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(message, 'search')
            }]);
            setMode("get_by_id");
          } else {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(`User found!\n\n${formatUser(data[0])}`, 'user')
            }]);
            setMode(null);
          }
        }
      } catch {
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: enhanceMessage("Network error. Please check your connection and try again.", 'error')
        }]);
        setMode(null);
      } finally {
        setLoading(false);
        setInput("");
      }
      return;
    }

    if (mode === "get_by_id") {
      const userId = input.trim();
      if (!/^\d+$/.test(userId)) {
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: enhanceMessage("Please provide a valid numeric User ID.", 'error')
        }]);
        setInput("");
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}?user_id=${userId}`);
        const data = await res.json();

        if (!data || data.error) {
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: enhanceMessage(`User with ID ${userId} not found.`, 'error')
          }]);
        } else {
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: enhanceMessage(`Here's the user details:\n\n${formatUser(data)}`, 'user')
          }]);
        }
      } catch {
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: enhanceMessage("Error retrieving user data.", 'error')
        }]);
      } finally {
        setLoading(false);
        setMode(null);
        setInput("");
      }
      return;
    }

    // DELETE MODE
    if (mode === "delete") {
      const trimmedInput = input.trim();

      if (trimmedInput.toLowerCase() === "confirm" && pendingDeleteUser) {
        try {
          setLoading(true);
          const res = await fetch(`${API_URL}?user_id=${pendingDeleteUser.user_id}`, { method: "DELETE" });
          const result = await res.json();

          if (result.error) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(`Deletion failed: ${result.error}`, 'error')
            }]);
          } else {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(`User "${pendingDeleteUser.name}" has been permanently deleted.`, 'success')
            }]);
          }
        } catch {
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: enhanceMessage("Network error during deletion. Please try again.", 'error')
          }]);
        } finally {
          setLoading(false);
          setMode(null);
          setInput("");
          setPendingDeleteUser(null);
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: enhanceMessage("What would you like to do next?\n\n💡 Try: 'add', 'get', 'update', or 'delete'", 'info')
          }]);
        }
        return;
      }

      if (/^\d+$/.test(trimmedInput)) {
        try {
          setLoading(true);
          const res = await fetch(`${API_URL}?user_id=${trimmedInput}`);
          const user = await res.json();

          if (!user || user.error || !user.name) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(`User with ID ${trimmedInput} not found.`, 'error')
            }]);
            setMode(null);
          } else {
            setPendingDeleteUser(user);
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(`⚠️ **DELETION CONFIRMATION REQUIRED**\n\n${formatUser(user)}\n\n🚨 **WARNING:** This action cannot be undone!\n\nType 'confirm' to permanently delete this user, or anything else to cancel.`, 'warning')
            }]);
          }
        } catch {
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: enhanceMessage("Error fetching user for deletion.", 'error')
          }]);
        } finally {
          setLoading(false);
          setInput("");
        }
        return;
      } else {
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: enhanceMessage("Please enter a valid numeric User ID or type 'confirm' to proceed with deletion.", 'error')
        }]);
        setInput("");
        return;
      }
    }

    // UPDATE MODE
    if (mode === "update") {
      if (updateStep === "awaiting_id") {
        try {
          setLoading(true);
          const userId = input.trim();
          if (!/^\d+$/.test(userId)) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage("Please enter a valid numeric User ID.", 'error')
            }]);
            setInput("");
            setLoading(false);
            return;
          }

          const res = await fetch(`${API_URL}?user_id=${userId}`);
          const user = await res.json();

          if (!user || user.error || !user.name) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(`User with ID ${userId} not found.`, 'error')
            }]);
            setMode(null);
          } else {
            setUpdateData(user);
            setUpdateStep("awaiting_field");
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage(`Current user details:\n\n${formatUser(user)}\n\n📝 Which field would you like to update?\n\n• **name** - Full name\n• **age** - Age in years\n• **email** - Email address\n• **phone** - Phone number\n• **address** - Home address\n\nJust type the field name:`, 'update')
            }]);
          }
        } catch {
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: enhanceMessage("Error fetching user data.", 'error')
          }]);
          setMode(null);
        } finally {
          setLoading(false);
        }
        setInput("");
        return;
      }

      if (updateStep === "awaiting_field") {
        const field = lowerInput;
        if (["name", "age", "email", "phone", "address"].includes(field)) {
          setUpdateStep(`updating_${field}`);
          const prompts = {
            name: "Enter the new full name:",
            age: "Enter the new age (numbers only):",
            email: "Enter the new email address:",
            phone: "Enter the new phone number:",
            address: "Enter the new address:"
          };
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: enhanceMessage(prompts[field], 'update')
          }]);
        } else {
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: enhanceMessage("Invalid field selection. Please choose from: name, age, email, phone, or address", 'error')
          }]);
        }
        setInput("");
        return;
      }

      if (updateStep.startsWith("updating_")) {
        const fieldToUpdate = updateStep.replace("updating_", "");
        
        // Validation for specific fields
        if (fieldToUpdate === "age" && (isNaN(input) || input <= 0)) {
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: enhanceMessage("Please enter a valid age (numbers only).", 'error')
          }]);
          setInput("");
          return;
        }
        
        if (fieldToUpdate === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input)) {
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: enhanceMessage("Please enter a valid email address.", 'error')
            }]);
            setInput("");
            return;
          }
        }

        const updated = { ...updateData, [fieldToUpdate]: input };

        try {
          setLoading(true);
          const res = await fetch(`${API_URL}?user_id=${updated.user_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [fieldToUpdate]: input }),
          });
          const result = await res.json();

          setMessages(prev => [
            ...prev,
            { sender: "bot", text: enhanceMessage(result.message || `${fieldToUpdate} updated successfully!`, 'success') },
            { sender: "bot", text: enhanceMessage(`Updated user profile:\n\n${formatUser(updated)}`, 'user') },
            { sender: "bot", text: enhanceMessage("What would you like to do next?\n\n💡 Try: 'add', 'get', 'update', or 'delete'", 'info') },
          ]);
        } catch {
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: enhanceMessage("Failed to update user data. Please try again.", 'error')
          }]);
        } finally {
          setLoading(false);
          setMode(null);
          setUpdateStep(null);
          setUpdateData({});
          setInput("");
        }
        return;
      }
    }

    // COMMAND DETECTION
    if (["add", "update", "get", "delete"].includes(lowerInput)) {
      if (lowerInput === "add") {
        setFormData({});
        setMode("add");
        setConversationState("name");
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: enhanceMessage("Let's create a new user profile! I'll guide you through each step.\n\nFirst, what's the user's full name?", 'add')
        }]);
      } else if (lowerInput === "update") {
        setMode("update");
        setUpdateStep("awaiting_id");
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: enhanceMessage("I'll help you update a user's information.\n\nPlease enter the User ID of the person you want to update:", 'update')
        }]);
      } else if (lowerInput === "get") {
        setMode("get");
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: enhanceMessage("I can help you find users! You can search by:\n\n🆔 User ID: Just enter the number\n👤 Name: Enter the full name or partial name\n🌍 ", 'search')
        }]);
      } else if (lowerInput === "delete") {
        setMode("delete");
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: enhanceMessage("⚠️ **User Deletion**\n\nThis will permanently remove a user from the database.\n\nPlease enter the User ID of the user you want to delete:", 'delete')
        }]);
      }
      setInput("");
      return;
    }

    // DEFAULT MESSAGE TO API (for natural language queries)
    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }), 
      });
      const data = await res.json();
      
      let formatted = enhanceMessage("I couldn't process that request. Please try one of the available commands.", 'warning');
      
      if (data?.message) {
        formatted = enhanceMessage(data.message, 'info');
      } else if (Array.isArray(data)) {
        if (data.length === 0) {
          formatted = enhanceMessage("No users found matching those criteria.", 'error');
        } else {
          const userList = data.map((u, i) => `**${i + 1}.** ${formatUser(u)}`).join('\n\n');
          formatted = enhanceMessage(`Found ${data.length} user(s):\n\n${userList}`, 'search');
        }
      } else if (typeof data === "object" && data !== null) {
        if (data.name) {
          formatted = enhanceMessage(`User found:\n\n${formatUser(data)}`, 'user');
        } else {
          formatted = enhanceMessage(Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n'), 'info');
        }
      }
      
      setMessages(prev => [...prev, { sender: "bot", text: formatted }]);
    } catch {
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: enhanceMessage("Server connection failed. Please check your network and try again.", 'error')
      }]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>CRUD Chatbot</h2>
        <p className="subtitle">Your intelligent data management assistant</p>
        <button className="refresh-button" onClick={handleRefresh}>
          🔄 New Session
        </button>
      </div>

      <div className="chat-box" ref={chatBoxRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>🚀 Ready to start!</h3>
            <p>Type a command or ask me anything</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              {msg.sender === "bot" && <strong>Assistant</strong>}
              <span>{msg.text}</span>
            </div>
          ))
        )}

        {loading && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="input-section">
        <div className="input-wrapper">
          <textarea
            className="chat-input"
            rows="1"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here... or click 🎤 to speak"
          />
          <button
            className="voice-button"
            onClick={handleVoiceInput}
            title="Click to speak"
            disabled={loading}
          >
            🎤
          </button>
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? "⏳ Sending..." : "Send 📤"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;