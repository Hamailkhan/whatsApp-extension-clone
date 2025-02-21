// messageUtils.js


  export async function saveToHistory(number, message) {
    const history = (await chrome.storage.local.get("messageHistory")) || {
      messageHistory: [],
    };
    const messageHistory = history.messageHistory || [];
  
    const newEntry = {
      number: number,
      message: message,
      timestamp: new Date().toISOString(),
    };
  
    // Keep only last 10 messages
    messageHistory.unshift(newEntry);
    if (messageHistory.length > 10) {
      messageHistory.pop();
    }
  
    await chrome.storage.local.set({ messageHistory: messageHistory });
  }
  
  export async function loadMessageHistory() {
    console.log("enter in load message hdaistory");
    
    const history = await chrome.storage.local.get("messageHistory");
    const messageHistory = history.messageHistory || [];
  
    return messageHistory.map((entry) => {
      const date = new Date(entry.timestamp);
      return `
        <div class="history-item">
          <div>To: ${entry.number}</div>
          <div>Message: ${entry.message.substring(0, 50)}${
        entry.message.length > 50 ? "..." : ""
      }</div>
          <div class="timestamp">${date.toLocaleString()}</div>
        </div>
      `;
    }).join("");
  }
  
  export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  //   timer time delay
  export function getRandomDelay() {
    return Math.floor(Math.random() * (10000 - 5000 + 1) + 5000);
  }
  // messageUtils.js
export function validateNumbers(numbers) {
    const numberArray = numbers.split(",").map((n) => n.trim());
    return numberArray.every((num) => /^\d{10,}$/.test(num));
  }
 