import { saveToHistory } from "./lib/messageUtils.js";

chrome.action.onClicked.addListener((tab) => {
  const whatsappUrl = "https://web.whatsapp.com/";

  // Check if WhatsApp Web is already open
  chrome.tabs.query({}, function (tabs) {
    let whatsappTab = tabs.find(
      (tab) => tab.url && tab.url.includes("web.whatsapp.com")
    );
    console.log(whatsappTab, "current tabs");

    if (whatsappTab) {
      // If WhatsApp Web is open, switch to that tab
      chrome.tabs.update(whatsappTab.id, { active: true });
    } else {
      // If not open, navigate the current tab to WhatsApp Web
      chrome.tabs.update(tab.id, { url: whatsappUrl });
    }
  });
});

console.log("background working fine !");

async function ensureWhatsAppIsReady(tabId) {
  return new Promise((resolve) => {
    let checkInterval = setInterval(async () => {
      try {
        let result = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => !!document.querySelector("#side"),
        });

        if (result[0]?.result) {
          clearInterval(checkInterval);
          resolve();
        }
      } catch (error) {
        clearInterval(checkInterval);
        console.error("Error checking WhatsApp readiness:", error);
        resolve();
      }
    }, 1000);
  });
}

let messageQueue = [];
let isProcessing = false;


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message in background:", request);

  if (request.action === "updateChats") {
    console.log("Received chats in background.js:", request.chats);
    chrome.runtime.sendMessage({ action: "displayChats", chats: request.chats });
  }

  if (request.action === "fetchChats") {
    chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getChats" }, (response) => {
          console.log("response", response);
          if (chrome.runtime.lastError) {
            console.error("Error sending message to content.js:", chrome.runtime.lastError.message);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, response });
          }
        });
      } else {
        sendResponse({ success: false, error: "WhatsApp Web tab not found" });
      }
    });

    return true; // Important to keep the message channel open
  }

  if (request.action === "contentjsToBackgroundQueue") {
    console.log("Processing queue message:", {
      numbers: request.numbers,
      hasImage: !!request.imageData,
      imageDataLength: request.imageData ? request.imageData.length : 0,
    });

    request.numbers.forEach((number) => {
      messageQueue.push({
        text: request.text,
        mobile: number,
        imageData: request.imageData,
        isImageOnly: request.isImageOnly || false,
      });
    });

    sendResponse({ success: true });
    processQueue();
    return true;
  }

  if (request.action === "sendImageMessages") {
    console.log("Received image message request:", request);

    request.numbers.forEach((number) => {
      messageQueue.push({
        mobile: number,
        imageData: request.imageData,
        isImageOnly: true,
      });
    });

    processQueue();
    sendResponse({ success: true }); // Added sendResponse here
    return true;
  }
});


async function processQueue() {
  if (isProcessing || messageQueue.length === 0) return;

  isProcessing = true;
  console.log("Starting to process queue:", messageQueue.length, "items");

  console.log("messageQueue", messageQueue);

  while (messageQueue.length > 0) {
    let msg = messageQueue.shift();
    console.log("Processing message:", {
      hasImage: !!msg.imageData,
      hasText: !!msg.text,
      mobile: msg.mobile,
    });

    let [tab] = await chrome.tabs.query({ url: "https://web.whatsapp.com/*" });

    if (!tab) {
      console.error("WhatsApp Web is not open.");
      break;
    }

    let messageData = {
      action: "backgroundToWhatsapp",
      text: msg.text,
      receiver: msg.mobile,
      uid: generateUniqueId(),
      isImageOnly: msg.isImageOnly || false,
    };

    // Process image data if available
    if (msg.imageData) {
      try {
        const mediaData = await processImageData(msg.imageData);
        messageData.media = mediaData;
        console.log("Prepared media data:", {
          mimetype: mediaData.mimetype,
          filename: mediaData.filename,
          dataLength: mediaData.data.length,
        });
      } catch (error) {
        console.error("Error processing image data:", error);
      }
    }

    try {
      console.log("Sending message to content script:", {
        hasImage: !!messageData.media,
        hasText: !!messageData.text,
        receiver: messageData.receiver,
      });

      console.log("messageData", messageData);

      await chrome.tabs.sendMessage(tab.id, messageData);
      console.log("Message sent successfully", messageData);

      if (msg.text) {
        saveToHistory(messageData.receiver, messageData.text);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

    // Wait 6 seconds before processing next message
    await new Promise((resolve) => setTimeout(resolve, 6000));
  }

  isProcessing = false;
}

async function processImageData(imageData) {
  // If imageData is a URL, download the media and return info
  if (isURL(imageData)) {
    const downloaded = await downloadMediaFromUrl(imageData);
    let ext = downloaded.mimetype.split('/')[1]; // e.g., "jpeg" or "png"
    const filename = `image_${Date.now()}.${ext}`;
    const payload = {
      data: downloaded.data,
      mimetype: downloaded.mimetype,
      filename: filename,
    };

    console.log("payload url", payload);

    return payload
  }

  // If imageData is a Base64 string with data URI prefix, parse it
  if (isBase64(imageData)) {
    const parts = imageData.split(',');
    const header = parts[0];
    const data = parts[1];
    const mimetype = header.split(':')[1].split(';')[0];
    const extension = mimetype.split('/')[1];
    const payload = {
      data: data,
      mimetype: mimetype,
      filename: `image_${Date.now()}.${extension}`,
    };
    console.log("payload base64", payload);
    return payload
  }

  // If imageData is a Blob (or File), convert to Base64
  if (isBlob(imageData)) {
    const base64Data = await readFileAsBase64(imageData);
    const mimetype = imageData.type;
    const extension = mimetype.split('/')[1];
    return {
      data: base64Data,
      mimetype: mimetype,
      filename: `image_${Date.now()}.${extension}`,
    };
  }

  // Otherwise, assume raw Base64 string without prefix (default to PNG)
  const payload = {
    data: imageData,
    mimetype: "image/png",
    filename: `image_${Date.now()}.png`,
  };

  console.log("payload raw", payload);
  return payload
}

// async function processImageData(imageData) {
//   if (!imageData || imageData.trim() === "") {
//     throw new Error("Empty image data");
//   }

//   // Regular expression jo Data URL (Base64) format match karta hai
//   const base64Regex = /^data:(.+\/.+);base64,(.*)$/;
//   const match = imageData.match(base64Regex);

//   if (match && match.length === 3) {
//     const mimetype = match[1];
//     const data = match[2];
//     const extension = mimetype.split('/')[1];
//     const payload = {
//       data: data,
//       mimetype: mimetype,
//       filename: `image_${Date.now()}.${extension}`,
//     };
//     console.log("Processed image payload:", payload);
//     return payload;
//   } else {
//     throw new Error("Invalid image data format");
//   }
// }


function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function downloadMediaFromUrl(url, options = {}) {
  const pUrl = new URL(url);

  async function fetchData(url, options) {
    const reqOptions = Object.assign(
      {
        headers: { accept: "image/*, video/*, text/*, audio/*, application/pdf" },
      },
      options
    );
    const response = await fetch(url, reqOptions);
    const mime = response.headers.get("Content-Type");
    const size = response.headers.get("Content-Length");
    const contentDisposition = response.headers.get("Content-Disposition");
    const nameMatch = contentDisposition
      ? contentDisposition.match(/(?<=filename=")([^"]+)/)
      : null;
    const filename = nameMatch ? nameMatch[0] : `image_${Date.now()}.png`;

    let data = "";
    if (response.buffer) {
      data = (await response.buffer()).toString("base64");
    } else {
      const bArray = new Uint8Array(await response.arrayBuffer());
      bArray.forEach((b) => {
        data += String.fromCharCode(b);
      });
      data = btoa(data);
    }

    return {
      data: data,
      mimetype: mime,
      filename: filename,
      filesize: size,
    };
  }

  const res = await fetchData(url);
  return res;
}

function isBlob(data) {
  return data instanceof Blob;
}

function isBase64(data) {
  const base64Regex = /^data:(.+\/.+);base64,(.*)$/;
  return typeof data === "string" && base64Regex.test(data);
}

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch (error) {
    return false;
  }
}

function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return timestamp + randomStr;
}
