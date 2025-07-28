import { useEffect, useRef, useState } from "react";
import "./Chatbot.css";

const Chatbot = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 Welcome! What would you like to do?\nYou can say things like:\n• 'add user'\n• 'user name eg:user muthu '\n• 'users from location name'\n• 'get id 123'\n• 'age above 30'\n• 'delete user Sarah'",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [conversationStep, setConversationStep] = useState("initial");
  const [context, setContext] = useState({});
  const [userData, setUserData] = useState({});
  const bottomRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
const recognitionRef = useRef(null);


  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://ewdih13v02.execute-api.eu-north-1.amazonaws.com/default/CRUD_app_chatbot";

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

  recognition.onresult = (event) => {
  let transcript = event.results[0][0].transcript;
  transcript = transcript.toLowerCase().replace(/\.+$/, ""); // lowercase & remove trailing periods
  setInput(transcript);
  setTimeout(() => {
    const fakeEvent = { preventDefault: () => {} }; // dummy event
    handleInput(fakeEvent); // simulate Enter
  }, 500);
}

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  } else {
    console.warn("Speech recognition not supported in this browser.");
  }
}, []);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const encodeQueryParam = (str) => encodeURIComponent(str);

  const extractId = (text) => {
    const match = text.match(/\b\d+\b/);
    return match ? parseInt(match[0]) : null;
  };
const findUsersByField = async (field, value) => {
  if (!field || !value) return [];
  const url = `${API_URL}?${encodeURIComponent(field)}=${encodeURIComponent(value)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    const users = await res.json();
    return Array.isArray(users) ? users : [];
  } catch (err) {
    console.error("Error in findUsersByField:", err);
    return [];
  }
};


  const resetConversation = () => {
    setConversationStep("initial");
    setContext({});
    setUserData({});
    addMessage("bot", "Anything else? You can add, get, update, or delete users.");
  };

  const handleInput = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage("user", trimmed);
    setInput("");
    setLoading(true);

    const lower = trimmed.toLowerCase();

    try {
      switch (conversationStep) {
        case "initial": {
          const id = extractId(trimmed);
          const fieldMatch = trimmed.match(/^(name|address|email|phone|age)\s+(.+)/i);

          // Natural language age-only detection
          const justAge = trimmed.match(/^(?:age\s*)?(under|below|less than|above|over|greater than)\s+(\d+)/i);
          if (justAge) {
            const op = justAge[1].toLowerCase();
            const val = parseInt(justAge[2]);
            const query = ["under", "below", "less than"].includes(op) ? `age_lt=${val}` : `age_gt=${val}`;

            const res = await fetch(`${API_URL}?${query}`);
            const users = await res.json();

            if (Array.isArray(users) && users.length) {
              const list = users.map(u => `- ${u.name}, Age: ${u.age}, ID: ${u.user_id}`).join("\n");
              addMessage("bot", `✅ Users ${op} ${val}:\n${list}`);
            } else {
              addMessage("bot", `❗ No users found ${op} ${val}.`);
            }
            resetConversation();
            break;
          }
      
          // Natural language address lookup
          const whoAddressMatch = lower.match(/users.*(live|from|in)\s+([a-z\s]+)/i);
          if (whoAddressMatch) {
            const location = whoAddressMatch[2].trim();
            const users = await findUsersByField("address", location);

            if (users.length) {
              const list = users.map(u => `- ${u.name} (ID: ${u.user_id})`).join('\n');
              addMessage("bot", `✅ Users from ${location}:\n${list}`);
            } else {
              addMessage("bot", `❗ No users found in "${location}".`);
            }
            resetConversation();
            break;
          }
          // Add a quick fallback name lookup
const userOnlyMatch = lower.match(/^user\s+(.+)/i);
if (userOnlyMatch) {
  const name = userOnlyMatch[1].trim();
  const users = await findUsersByField("name", name);

  if (users.length === 1) {
    const user = users[0];
    addMessage("bot", `✅ Found user:\n- Name: ${user.name}\n- ID: ${user.user_id}\n- Email: ${user.email}\n- Age: ${user.age}\n- Phone: ${user.phone}\n- Address: ${user.address}`);
    resetConversation();
  } else if (users.length > 1) {
    const list = users.map(u => `- Name: ${u.name}, ID: ${u.user_id}`).join('\n');
    addMessage("bot", `✅ Found multiple users named "${name}":\n${list}\n\nPlease specify the ID (e.g. 'get id 123').`);
    setContext({ multipleUsersFound: users, operation: "get" });
    setConversationStep("handle_multiple_users");
  } else {
    addMessage("bot", `❗ No users found with the name "${name}".`);
    resetConversation();
  }
  break;
}


// Handle: names starting with a specific letter
const startsWithMatch = lower.match(/^(names|users).*(start|begin)\s+with\s+([a-z])/i);
if (startsWithMatch) {
  const letter = startsWithMatch[3].toUpperCase();
  const users = await findUsersByField("name", `^${letter}`);

  if (users.length) {
    const list = users.map(u => `- ${u.name} (ID: ${u.user_id})`).join('\n');
    addMessage("bot", `✅ Users whose names start with "${letter}":\n${list}`);
  } else {
    addMessage("bot", `❗ No users found with names starting with "${letter}".`);
  }
  resetConversation();
  break;
}

          if (/\badd\b/.test(lower)) {
            setConversationStep("add_name");
            addMessage("bot", "Great! What's the user's name?");
          }
          else if (/\bget\b/.test(lower)) {
            // Natural language age queries
            const agePhrase = lower.match(/(age|users|people).*(above|over|greater than|under|below|less than|between)\s+(\d+)(?:\s*(?:and|to|-)\s*(\d+))?/i);
            if (agePhrase) {
              const operator = agePhrase[2].toLowerCase();
              const num1 = parseInt(agePhrase[3]);
              const num2 = agePhrase[4] ? parseInt(agePhrase[4]) : null;
              let query = "";

              if (["above", "over", "greater than"].includes(operator)) {
                query = `age_gt=${num1}`;
              } else if (["under", "below", "less than"].includes(operator)) {
                query = `age_lt=${num1}`;
              } else if (operator === "between" && num1 && num2) {
                query = `age_gte=${num1}&age_lte=${num2}`;
              }

              if (query) {
                const res = await fetch(`${API_URL}?${query}`);
                const users = await res.json();

                if (Array.isArray(users) && users.length) {
                  const list = users.map(u => `- Name: ${u.name}, ID: ${u.user_id}, Age: ${u.age}`).join('\n');
                  addMessage("bot", `✅ Found ${users.length} users:\n${list}`);
                } else {
                  addMessage("bot", "❗ No users found matching that age filter.");
                }
              } else {
                addMessage("bot", "❗ Couldn't parse the age filter properly.");
              }
              resetConversation();
              break;
            }
            else if (id) {
             const res = await fetch(`${API_URL}/${id}`);
const data = await res.json();

if (data && data.user_id) {
  addMessage("bot", `✅ Found user:
- Name: ${data.name}
- ID: ${data.user_id}
- Email: ${data.email}
- Role: ${data.role}
- Status: ${data.status}`);
} else {
  addMessage("bot", "❗ No user found with that ID.");
}

resetConversation();

            }
            else if (fieldMatch) {
              const field = fieldMatch[1].toLowerCase();
              const value = fieldMatch[2].trim();
              const users = await findUsersByField(field, value);

              if (users.length === 1) {
                addMessage("bot", `✅ Found user:\n${JSON.stringify(users[0], null, 2)}`);
                resetConversation();
              } else if (users.length > 1) {
                const list = users.map(u => `- Name: ${u.name}, ID: ${u.user_id}`).join('\n');
                addMessage("bot", `✅ Found multiple users:\n${list}\n\nPlease specify the ID (e.g. 'get id 123').`);
                setContext({ multipleUsersFound: users, operation: "get" });
                setConversationStep("handle_multiple_users");
              } else {
                addMessage("bot", `❗ No users found with ${field} = "${value}".`);
                resetConversation();
              }
            }
            else {
              setConversationStep("get_id");
              addMessage("bot", "Please specify either:\n• User ID (e.g., 'get 123')\n• Field (e.g., 'get name Abbas', 'get address Chennai')\n• Age filter (e.g., 'get age above 30')");
            }
          }
          else if (/\bdelete\b/.test(lower)) {
            if (id) {
              const res = await fetch(`${API_URL}/${id}`);
              const userData = await res.json();
           if (userData && userData.user_id) {
  addMessage("bot", `📋 User details:
- Name: ${userData.name}
- ID: ${userData.user_id}
- Email: ${userData.email}
- Role: ${userData.role}
- Status: ${userData.status}

Type 'confirm' to delete this user, or 'cancel' to abort.`);
  
  setContext({ deleteId: id, userData });
  setConversationStep("confirm_delete");
}
else {
                addMessage("bot", "❗ No user found with that ID.");
                resetConversation();
              }
            } else {
              setConversationStep("delete_id");
              addMessage("bot", "Please specify the user ID to delete (e.g. 'delete id 123').");
            }
          }
          else if (/\bupdate\b/.test(lower)) {
            if (id) {
              setContext({ user_id: id });
              setConversationStep("update_field");
              addMessage("bot", "Which field do you want to update? (name, email, age, phone, address)");
            } else {
              setConversationStep("update_id");
              addMessage("bot", "Enter the user ID to update:");
            }
          }
          else {
            addMessage("bot", "I didn't understand that. Try:\n• 'add user'\n• 'get name Abbas'\n• 'get id 123'\n• 'get age above 30'");
          }
          break;
        }

        // ADD USER FLOW
        case "add_name": {
          setUserData({ name: trimmed });
          setConversationStep("add_email");
          addMessage("bot", "Perfect! What's their email address?");
          break;
        }

        case "add_email": {
          setUserData(prev => ({ ...prev, email: trimmed }));
          setConversationStep("add_user_id");
          addMessage("bot", "Got it! Please enter a unique user ID (numbers only):");
          break;
        }

        case "add_user_id": {
          const userId = parseInt(trimmed);
          if (isNaN(userId)) {
            addMessage("bot", "❗ Please enter a valid numeric user ID.");
            break;
          }
          setUserData(prev => ({ ...prev, user_id: userId }));
          setConversationStep("add_age");
          addMessage("bot", "Great! How old are they?");
          break;
        }

        case "add_age": {
          const age = parseInt(trimmed);
          if (isNaN(age) || age < 0 || age > 150) {
            addMessage("bot", "❗ Please enter a valid age (between 0 and 150):");
            break;
          }
          setUserData(prev => ({ ...prev, age }));
          setConversationStep("add_phone");
          addMessage("bot", "Awesome! What's their phone number?");
          break;
        }

        case "add_phone": {
          setUserData(prev => ({ ...prev, phone: trimmed }));
          setConversationStep("add_address");
          addMessage("bot", "And finally, what's their address?");
          break;
        }
case "add_address": {
  const finalUserData = { ...userData, address: trimmed };
  setUserData(finalUserData); // optional, for tracking

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(finalUserData),
  });

  if (res.ok) {
    console.log("User created response:", await res.clone().json());

    const readable = `✅ User created successfully!\n\nName: ${finalUserData.name}\nAge: ${finalUserData.age}\nEmail: ${finalUserData.email}\nPhone: ${finalUserData.phone}\nAddress: ${finalUserData.address}\nID: ${finalUserData.user_id}`;
    addMessage("bot", readable);
  } else {
    const error = await res.text();
    addMessage("bot", `❗ Failed to create user: ${error}`);
  }

  resetConversation();
  break;
}


        // UPDATE USER FLOW
        case "update_id": {
          const id = extractId(trimmed);
          if (id) {
            setContext({ user_id: id });
            setConversationStep("update_field");
            addMessage("bot", "Which field do you want to update? (name, email, age, phone, address)");
          } else {
            addMessage("bot", "Please enter a valid user ID (number):");
          }
          break;
        }

        case "update_field": {
          const validFields = ["name", "email", "age", "phone", "address"];
          const field = lower.trim();
          
          if (validFields.includes(field)) {
            setContext(prev => ({ ...prev, field }));
            setConversationStep("update_value");
            addMessage("bot", `What's the new ${field}?`);
          } else {
            addMessage("bot", "Please choose a valid field: name, email, age, phone, or address");
          }
          break;
        }

        case "update_value": {
          const { user_id, field } = context;
          let value = trimmed;
          
          if (field === "age") {
            const age = parseInt(trimmed);
            if (isNaN(age) || age < 0 || age > 150) {
              addMessage("bot", "Please enter a valid age (number between 0-150):");
              break;
            }
            value = age;
          }

          const updateData = { [field]: value };
          
          const res = await fetch(`${API_URL}/${user_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          });

          if (res.ok) {
  const updatedRes = await fetch(`${API_URL}/${user_id}`);
  const updatedUser = await updatedRes.json();

  if (updatedUser && updatedUser.user_id) {
    const readable = `✅ User updated successfully!\n\nName: ${updatedUser.name}\nAge: ${updatedUser.age}\nEmail: ${updatedUser.email}\nPhone: ${updatedUser.phone}\nAddress: ${updatedUser.address}\nID: ${updatedUser.user_id}`;
    addMessage("bot", readable);
  } else {
    addMessage("bot", "✅ User updated, but couldn't fetch updated details.");
  }
} else {
  const error = await res.text();
  addMessage("bot", `❗ Failed to update user: ${error}`);
}

          
          resetConversation();
          break;
        }

        // DELETE USER FLOW
        case "delete_id": {
          const id = extractId(trimmed);
          if (id) {
            const res = await fetch(`${API_URL}/${id}`);
            const userData = await res.json();
            if (userData && userData.user_id) {
              addMessage("bot", `📋 User details:\n${JSON.stringify(userData, null, 2)}\n\nType 'confirm' to delete this user, or 'cancel' to abort.`);
              setContext({ deleteId: id, userData });
              setConversationStep("confirm_delete");
            } else {
              addMessage("bot", "❗ No user found with that ID.");
              resetConversation();
            }
          } else {
            addMessage("bot", "Please enter a valid user ID (number):");
          }
          break;
        }

        case "confirm_delete": {
          if (lower === "confirm") {
            const { deleteId } = context;
            const res = await fetch(`${API_URL}/${deleteId}`, {
              method: "DELETE",
            });

            if (res.ok) {
              addMessage("bot", "✅ User deleted successfully!");
            } else {
              const error = await res.text();
              addMessage("bot", `❗ Failed to delete user: ${error}`);
            }
            resetConversation();
          } else if (lower === "cancel") {
            addMessage("bot", "❌ Delete operation cancelled.");
            resetConversation();
          } else {
            addMessage("bot", "Please type 'confirm' to delete or 'cancel' to abort.");
          }
          break;
        }

        // GET USER FLOW
        case "get_id": {
          const id = extractId(trimmed);
          const fieldMatch = trimmed.match(/^(name|address|email|phone|age)\s+(.+)/i);
          
          if (id) {
            const res = await fetch(`${API_URL}/${id}`);
            const data = await res.json();
            if (data && data.user_id) {
              addMessage("bot", `✅ Found user:\n${JSON.stringify(data, null, 2)}`);
            } else {
              addMessage("bot", "❗ No user found with that ID.");
            }
            resetConversation();
          } else if (fieldMatch) {
            const field = fieldMatch[1].toLowerCase();
            const value = fieldMatch[2].trim();
            const users = await findUsersByField(field, value);

            if (users.length === 1) {
              addMessage("bot", `✅ Found user:\n${JSON.stringify(users[0], null, 2)}`);
              resetConversation();
            } else if (users.length > 1) {
              const list = users.map(u => `- Name: ${u.name}, ID: ${u.user_id}`).join('\n');
              addMessage("bot", `✅ Found multiple users:\n${list}\n\nPlease specify the ID.`);
              resetConversation();
            } else {
              addMessage("bot", `❗ No users found with ${field} = "${value}".`);
              resetConversation();
            }
          } else {
            addMessage("bot", "Please provide a valid ID number or field search (e.g., 'name John'):");
          }
          break;
        }

        case "handle_multiple_users": {
          const id = extractId(trimmed);
          if (id) {
            const res = await fetch(`${API_URL}/${id}`);
            const data = await res.json();
            if (data && data.user_id) {
              addMessage("bot", `✅ Found user:\n${JSON.stringify(data, null, 2)}`);
            } else {
              addMessage("bot", "❗ No user found with that ID.");
            }
            resetConversation();
          } else {
            addMessage("bot", "Please enter a valid user ID from the list above:");
          }
          break;
        }

        default:
          addMessage("bot", "🤖 I'm not sure what you meant. Try saying something like 'add user' or 'get name John'.");
          resetConversation();
          break;
      }
    } catch (err) {
      console.error("Error:", err);
      addMessage("bot", "⚠️ Something went wrong. Please try again.");
      resetConversation();
    }

    setLoading(false);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>💬 Smart CRUD Chatbot</h2>
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span>Online</span>
        </div>
      </div>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <div className="message-bubble">
              <div className="message-header">
                <strong>{m.role === "user" ? "You" : "Bot"}</strong>
              </div>
              <pre className="message-text">{m.text}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <div className="message-bubble loading">
              <div className="typing-indicator">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <span>Bot is typing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-form">
        <div className="input-container">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleInput(e)}
            placeholder="Try: 'get age above 30', 'get name John'..."
            className="message-input"
            disabled={loading}
          />
          <button
            onClick={handleInput}
            disabled={loading || !input.trim()}
            className="send-button"
          >
            {loading ? (
              <div className="button-spinner"></div>
            ) : (
              <svg viewBox="0 0 24 24" className="send-icon">
                <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
              </svg>
            )}
          </button>
          <button
    className={`mic-button ${isListening ? "listening" : ""}`}
    onClick={() => {
      if (recognitionRef.current) {
        if (isListening) {
          recognitionRef.current.stop();
          setIsListening(false);
        } else {
          recognitionRef.current.start();
          setIsListening(true);
        }
      }
    }}
    disabled={loading}
    title="Speak your command"
  ></button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;