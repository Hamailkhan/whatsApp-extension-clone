import {
  createGroup,
  saveGroupToLocalStorage,
  updateGroupDropdown,
  insertNumbersFromGroup,
} from "./lib/createCustomGroup.js";
import { executeToggleBlur } from "./lib/blurFunction.js";
import { handleExcelUpload } from "./lib/uploadExcel.js";
import {
  setupMainHeaderNavigation,
  setupGroupHeaderNavigation,
  setupProHeaderNavigation,
} from "./lib/header.js";
import { loadMessageHistory } from "./lib/loadhistory.js";
import { sendMessages } from "./event/sendMessage.js";

// Initialize header navigation
setupMainHeaderNavigation();
setupGroupHeaderNavigation();
setupProHeaderNavigation();

chrome.action.onClicked.addListener((tab) => {
  const whatsappUrl = "https://web.whatsapp.com/";

  // Check if WhatsApp Web is already open
  chrome.tabs.query({}, function (tabs) {
    let whatsappTab = tabs.find(
      (tab) => tab.url && tab.url.includes("web.whatsapp.com")
    );

    if (whatsappTab) {
      // If WhatsApp Web is open, switch to that tab
      chrome.tabs.update(whatsappTab.id, { active: true });
    } else {
      // If not open, navigate the current tab to WhatsApp Web
      chrome.tabs.update(tab.id, { url: whatsappUrl });
    }
  });
});

console.log("popup working fine !");



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("message", message);
  if (message.action === "displayChats") {
    console.log("displayChats", message.chats);
    const chatContainer = document.getElementById("messageHistory");
    chatContainer.innerHTML = "";

    message.chats.forEach(chat => {
      let chatElement = document.createElement("div");
      chatElement.classList.add("chat-item");
      chatElement.innerHTML = `
              <strong>${chat.formattedTitle}</strong><br>
              Last Message: ${chat.lastMessage ? chat.lastMessage.body : "No messages"}
          `;
      chatContainer.appendChild(chatElement);
    });
  }
});

// Popup open hone par chats request karna
document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ action: "fetchChats" }, (response) => {
    if (chrome.runtime.lastError) {
        console.error("Error fetching chats:", chrome.runtime.lastError.message);
    } else if (!response.success) {
        console.error("Failed to fetch chats:", response.error);
    } else {
        console.log("Chats fetched successfully!", response.response);
    }
}); 
});



document.addEventListener("DOMContentLoaded", function () {
  const numbersTextarea = document.getElementById("numbers");
  const messageTextarea = document.getElementById("message");
  const sendButton = document.getElementById("sendButton");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const successCount = document.getElementById("successCount");
  const numbersError = document.getElementById("numbersError");
  const messageError = document.getElementById("messageError");
  const nextDelay = document.getElementById("nextDelay");
  const messageHistory = document.getElementById("messageHistory");

  const sendGroupMessageBtn = document.getElementById("sendGroupMessage");
  const groupNumbersTextArea = document.getElementById("selectedNumbers");
  const groupMessageTextArea = document.getElementById("groupMessage");
  const groupMessageError = document.getElementById("GroupMessageError");
  const groupNumbersError = document.getElementById("GroupNumberError");

  const imageNumbersTextarea = document.getElementById("imageNumbers");
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const imagePreviewContainer = document.getElementById("imagePreviewContainer");
  const sendImageButton = document.getElementById("sendImageButton");

  sendButton.addEventListener("click", () => {
    console.log("hi");

  })

  loadMessageHistory();
  console.log("enter in load ", numbersTextarea, messageTextarea);


  // Send messages for normal and group
  sendButton.addEventListener("click", () => sendMessages({
    numbersInput: numbersTextarea,
    messageInput: messageTextarea,
    sendBtn: sendButton,
    numbersError: numbersError,
    messageError: messageError,
  }));

  sendGroupMessageBtn.addEventListener("click", () => sendMessages({
    numbersInput: groupNumbersTextArea,
    messageInput: groupMessageTextArea,
    sendBtn: sendGroupMessageBtn,
    numbersError: groupNumbersError,
    messageError: groupMessageError,
  }));

  // Image preview handler
  imageInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreviewContainer.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.src = "";
      imagePreviewContainer.style.display = "none";
    }
  });

  // Send image handler
  sendImageButton.addEventListener("click", async () => {
    const numbers = imageNumbersTextarea.value.trim().split(",").map(num => num.trim()).filter(num => num !== "");

    if (numbers.length === 0) {
      alert("Please enter at least one phone number");
      return;
    }

    if (!imageInput.files[0]) {
      alert("Please select an image");
      return;
    }

    sendImageButton.disabled = true;
    sendImageButton.textContent = "Sending...";

    try {
      const imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(imageInput.files[0]);
      });

      // Base64 debug
      debugBase64(imageData);

      sendMessages({
        numbersInput: imageNumbersTextarea,
        imageData: imageData,
        sendBtn: sendImageButton,
        numbersError: numbersError,
        messageError: messageError,
      });

      // chrome.runtime.sendMessage({
      //   action: "sendImageMessages",
      //   numbers: numbers,
      //   imageData: imageData
      // });

      alert("Image sending process started!", imageData);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Error processing image. Please try again.");
    } finally {
      sendImageButton.disabled = false;
      sendImageButton.textContent = "Send Image";
    }
  });
});





document.addEventListener("DOMContentLoaded", function () {
  const blurNameBtn = document.getElementById("blurName");
  const blurLastMessageBtn = document.getElementById("blurLastMessage");
  const blurPhotoBtn = document.getElementById("blurPhoto");

  blurNameBtn.addEventListener("click", () => {
    executeToggleBlur("_ak8q");
  });

  blurLastMessageBtn.addEventListener("click", () => {
    executeToggleBlur("_ak8k");
  });

  blurPhotoBtn.addEventListener("click", () => {
    executeToggleBlur("_ak8h");
  });
});

//  image handler
const imagePreviewContainer = document.getElementById(
  "imagePreviewContainer"
);


imageInput.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      imagePreviewContainer.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.src = "";
    imagePreviewContainer.style.display = "none";
  }
});

//    excel handler
document
  .getElementById("uploadExcel")
  .addEventListener("change", handleExcelUpload);

// create custom group
document.addEventListener("DOMContentLoaded", () => {
  updateGroupDropdown(); // Populate dropdown on page load
});

// Event listener for creating a group
document.getElementById("createGroup").addEventListener("click", createGroup);

// Event listener for handling group dropdown selection
document
  .getElementById("groupDropdown")
  .addEventListener("change", insertNumbersFromGroup);

// Additional event listener for saving a group
document.getElementById("createGroup").addEventListener("click", () => {
  const groupName = document.getElementById("groupName").value.trim();
  const numbers = document
    .getElementById("numbers")
    .value.trim()
    .split("\n")
    .filter((num) => num !== "");
  saveGroupToLocalStorage(groupName, numbers);
});

// Add this debug logging
function debugBase64(base64String) {
  console.log("Base64 string length:", base64String.length);
  console.log("Base64 string preview:", base64String.substring(0, 100) + "...");
}
