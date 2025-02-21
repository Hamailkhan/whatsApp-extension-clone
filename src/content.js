/**
 *  this listening message from "website app" on same tab of web app
 * */
window.addEventListener("message", async (event) => {
    if (event.data.action == 'webAppToContentjs') {
        console.log("Received event in content.js", event)
        // send message to background.js
        event.data.action = 'contentjsToBackground';
        const response = await chrome.runtime.sendMessage(event.data);

        if (!response.success) {
            triggerMessageResponse(response.response, response.success, {
                mobile: event.data.mobile,
                text: event.data.text,
                url: event.data.url ? event.data.url : '',
                base64Data: event.data.media ? event.data.media.data : '',
                mime: event.data.media ? event.data.media.mime : '',
            });
        }
        else {
            triggerMessageResponse(response.response, response.success, {
                mobile: event.data.mobile,
                text: event.data.text,
                url: event.data.url ? event.data.url : '',
                base64Data: event.data.media ? event.data.media.data : '',
                mime: event.data.media ? event.data.media.mime : '',
            });
        }
    }
});


document.addEventListener("whatsappJsToContent", (event) => {
    console.log("whatsappJsToContent", event);
    chrome.runtime.sendMessage({ action: "updateChats", chats: event.detail.chats }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending chats to background.js:", chrome.runtime.lastError.message);
        } else {
            console.log("Chats sent successfully!", response);
        }
    });
});

/** received event from whatsapp.js to receive response */
const responseEvent = 'WhatsappjsResponse';
document.addEventListener(responseEvent, (e) => {
    whatsappTabListenerSendResponse[e.detail.uid](e.detail)
});


const sendResponseEvent = 'whatsappSendResponse';
function triggerMessageResponse(response, isSuccess, message) {
    let data = { message: message, success: isSuccess, response: response };
    document.dispatchEvent(new CustomEvent(sendResponseEvent, { detail: data }));
}


// Injecting username change
let whatsappUrl = 'https://web.whatsapp.com1/';
if (window.location.href == whatsappUrl) {
    setWhatsappLoadingObserver();
}

// Function to be called when the target ID appears in the DOM
function whatsappLoaded() {
    console.log("Attached scripts");

    setTimeout(() => {
        // console.log(window.webpackChunkwhatsapp_web_client);
        // addScriptToDom('src/moduleraid.js');
        // addScriptToDom('src/util/Injected.js');
    }, 1000);
}

function setWhatsappLoadingObserver() {
    // Select the target element by its ID
    const targetId = "side";
    console.log("setting watch")

    // Create a new MutationObserver instance
    const observer = new MutationObserver((mutationsList) => {
        // Check if the target ID is now present in the DOM
        if (document.getElementById(targetId)) {
            // Disconnect the observer
            observer.disconnect();
            // Call the function to handle the event
            whatsappLoaded();
        }
    });

    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
}

function addScriptToDom(path) {
    console.log(path);
    var s = document.createElement('script');
    s.src = chrome.runtime.getURL(path);
    // s.onload = function() { this.remove(); };
    // see also "Dynamic values in the injected code" section in this answer
    (document.head || document.documentElement).appendChild(s);
}

function executeSnippetToDom(source) {
    var script = document.createElement("script");
    script.textContent = source;
    (document.head || document.documentElement).appendChild(script);
}

function postWidownMessage(action, data) {
    window.postMessage({
        action: action,
        ...data
    }, "*");
}







// Store blur states globally in content.js
window.isBlurActive = window.isBlurActive || {};

function toggleBlurByClass(className) {
    // Toggle the blur state
    window.isBlurActive[className] = !window.isBlurActive[className];

    function applyBlur() {
        document.querySelectorAll(`.${className}`).forEach(element => {
            if (window.isBlurActive[className]) {
                element.classList.add("blur_messages_class_SMIT"); // Add blur
            } else {
                element.classList.remove("blur_messages_class_SMIT"); // Remove blur
            }
        });
    }

    applyBlur(); // Apply or remove blur immediately

    // Detect new elements in the DOM and apply blur dynamically
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Ensure it's an element node
                    let newElements = node.querySelectorAll(`.${className}`);
                    newElements.forEach(element => {
                        if (window.isBlurActive[className]) {
                            element.classList.add("blur_messages_class_SMIT");
                        } else {
                            element.classList.remove("blur_messages_class_SMIT");
                        }
                    });
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.log(`${window.isBlurActive[className] ? "Blurred" : "Unblurred"} elements of class: ${className}`);
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log("Content script received message:", {
        hasImage: !!message.media,
        hasText: !!message.text,
        receiver: message.receiver
    });
    if (message.action === "backgroundToWhatsapp") {
        try {
            // Wait for chat input field
            const inputField = await waitForElement('div[contenteditable="true"][data-tab="10"]');

            // If there's text, send it first
            if (message.text) {
                // Set the text in the input field
                inputField.textContent = message.text;
                // Trigger input event to activate send button
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
            }

            if (message.media) {
                console.log("Processing media attachment");
                // Click attach button
                const attachButton = await waitForElement('[data-icon="attach-menu"]');
                attachButton.click();

                // Wait for image input
                const imageInput = await waitForElement('input[type="file"]');
                console.log("Found file input element");

                // Create file from base64
                const blob = await fetch(`data:${message.media.mimetype};base64,${message.media.data}`)
                    .then(r => r.blob());
                const file = new File([blob], message.media.filename || 'image.jpg', { type: message.media.mimetype });

                // Create DataTransfer
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                imageInput.files = dataTransfer.files;

                // Trigger change event
                imageInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log("Triggered file input change event");

                // Wait for image to load and processing
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            // Click send button
            const sendButton = await waitForElement('[data-icon="send"]');
            sendButton.click();
            console.log("Clicked send button");

            sendResponse({ success: true });
        } catch (error) {
            console.error("Error in content script:", error);
            sendResponse({ success: false, error: error.message });
        }
    }

    // Important: Return true to indicate we'll send response asynchronously
    return true;
});


function waitForElement(selector) {

    return new Promise(resolve => {
        const element = document.querySelector(selector);
        if (element) {
            return resolve(element);
        }
        const observer = new MutationObserver((mutations) => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}


function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
