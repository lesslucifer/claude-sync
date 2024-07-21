chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'injectUI') {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab!.id! },
            files: ['uiInjector.js']
        });
    }
});