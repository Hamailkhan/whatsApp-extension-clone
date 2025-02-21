
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
  