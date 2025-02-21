export function executeToggleBlur(className) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: toggleBlurByClass,
                args: [className],
            });
        }
    });
}

// Function to toggle blur effect
function toggleBlurByClass(className) {
    function applyBlur() {
        document.querySelectorAll(`.${className}`).forEach((element) => {
            element.classList.toggle("blur_messages_class_SMIT");
        });
    }

    applyBlur();

    // Detect new elements in the DOM and apply blur dynamically
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    let newElements = node.querySelectorAll(`.${className}`);
                    newElements.forEach((element) => {
                        element.classList.toggle("blur_messages_class_SMIT");
                    });
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.log(`Toggled blur for elements of class: ${className}`);
}


