export function isClaudeProjectPage(): boolean {
    return window.location.href.startsWith('https://claude.ai/project/');
};

if (isClaudeProjectPage()) {
    // This is a Claude project page, so we'll inject our UI
    chrome.runtime.sendMessage({ action: 'injectUI' });
}