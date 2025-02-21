import { validateNumbers } from "../lib/messageUtils.js";
import { displayError } from "../ui/uiElement.js";



export async function sendMessages(elements) {
  const { numbersInput, messageInput, sendBtn, numbersError, messageError, imageData } = elements;
  const numbers = numbersInput.value;

  if (imageData) {
    if (!numbers) return displayError(numbersError, "Please enter mobile numbers");
    if (!validateNumbers(numbers)) return displayError(numbersError, "Please enter valid mobile numbers");

    try {
      const numberArray = numbers.split(",").map((n) => n.trim());

      const response = await chrome.runtime.sendMessage({
        action: "sendImageMessages",
        numbers: numberArray,
        imageData: imageData,
      });

      if (response.success) {
        alert("Messages will be sent in the background.");
      } else {
        alert("Failed to queue messages.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

  }

  const message = messageInput.value;

  if (!numbers) return displayError(numbersError, "Please enter mobile numbers");
  if (!validateNumbers(numbers)) return displayError(numbersError, "Please enter valid mobile numbers");
  if (!message) return displayError(messageError, "Please enter a message");

  numbersError.style.display = "none";
  messageError.style.display = "none";

  const numberArray = numbers.split(",").map((n) => n.trim());

  // Disable inputs and show progress UI
  numbersInput.disabled = true;
  messageInput.disabled = true;
  sendBtn.disabled = true;
  document.getElementById("progressContainer").style.display = "block";

  // Send all numbers to background.js at once
  try {
    const response = await chrome.runtime.sendMessage({
      action: "contentjsToBackgroundQueue",
      numbers: numberArray,
      text: message,
    });

    if (response.success) {
      alert("Messages will be sent in the background.");
    } else {
      alert("Failed to queue messages.");
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }

  // Re-enable UI
  numbersInput.disabled = false;
  messageInput.disabled = false;
  sendBtn.disabled = false;
}

