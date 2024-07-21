export function isClaudeProjectPage(): boolean {
    return window.location.href.startsWith('https://claude.ai/project/');

};

if (isClaudeProjectPage()) {
    // This is a Claude project page, so we'll inject our UI
    chrome.runtime.sendMessage({ action: 'injectUI' });
    fetch(chrome.runtime.getURL(`D:\\proj\\llm\\claude-sync\\src\\components\\Header.ts`)).then(res => res.text())
    .then((data) => console.log(`Load file`, data))
    .catch(err => console.log(err));
}