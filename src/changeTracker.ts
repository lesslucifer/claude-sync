// changeTracker.ts

let hasChanges = false;

export const trackChange = (): void => {
    hasChanges = true;
    showReloadDescription();
};

export const resetChangeTracker = (): void => {
    hasChanges = false;
    hideReloadDescription();
};

const showReloadDescription = (): void => {
    const description = document.querySelector('.sync-file-reload-description');
    if (description) {
        description.classList.remove('hidden');
    }
};

const hideReloadDescription = (): void => {
    const description = document.querySelector('.sync-file-reload-description');
    if (description) {
        description.classList.add('hidden');
    }
};