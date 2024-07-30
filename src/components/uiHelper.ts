export const createLoadingSpinner = (): HTMLDivElement => {
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner hidden';
    return loadingSpinner;
};

export const runWithLoadingElement = <T extends (...args: any[]) => Promise<any>>(elem: Element, fn: T) => {
    if (!elem) return fn

    return <T>(async (...args: any[]) => {
        const spinner = elem.querySelector('div.loading-spinner')

        try {
            if (elem instanceof HTMLButtonElement) {
                elem.disabled = true
            }
            else {
                elem.classList.add('opacity-50', 'pointer-events-none');
            }
            spinner?.classList?.remove('hidden')
    
            return await fn(...args)
        }
        finally {
            if (elem instanceof HTMLButtonElement) {
                elem.disabled = false
            }
            else {
                elem.classList.remove('opacity-50', 'pointer-events-none');
            }
            spinner?.classList?.add('hidden')
        }
    })
}

// Add this style to your CSS or in a <style> tag in your HTML
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);