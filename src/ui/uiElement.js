// uiElements.js
export function displayError(element, message) {
    element.style.display = "block";
    element.textContent = message;
  }
  
  export function hideError(element) {
    element.style.display = "none";
  }
  