// Header.ts

import { selectAndUploadFiles, sortFiles, syncAllChangedFiles } from "../appService";
import { getAllFilesFromElement } from "./FileList";
import { ReloadIcon, SortIcon, SyncIcon } from "./icons";
import { createLoadingSpinner, runWithLoadingElement } from "./uiHelper";

export const createHeader = (): HTMLElement => {
    const header = document.createElement('div');
    header.className = 'mb-1.5 flex w-full items-center pl-4 pr-3';

    const titleContainer = document.createElement('div');
    titleContainer.className = 'flex-1 px-0.5';

    const title = document.createElement('h2');
    title.className = 'text-text-200 mb-0.5 flex items-center gap-1.5 pl-px text-sm font-medium';
    title.innerHTML = `${SyncIcon} Sync File`;

    titleContainer.appendChild(title);
    header.appendChild(titleContainer);

    const addButton = createAddButton();
    const controlButton = createControlButtons();

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'flex items-center';
    controlsContainer.appendChild(addButton);
    controlsContainer.appendChild(controlButton);

    header.appendChild(controlsContainer);

    return header;
};

const addButtonClasses = "inline-flex items-center justify-center relative shrink-0 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none text-text-200 transition-all font-styrene active:bg-bg-400 hover:bg-bg-500/40 hover:text-text-100 px-0.5 rounded-[0.25rem] rounded py-1 px-2 max-w-full whitespace-nowrap text-ellipsis overflow-hidden outline-none ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 focus:backdrop-blur-xl hover:backdrop-blur-xl hover:bg-bg-400/50 !text-accent-secondary-100 gap-1.5 !rounded-lg text-sm font-medium tracking-tight"

const createAddButton = (): HTMLButtonElement => {
    const addButton = document.createElement('button');
    addButton.className = addButtonClasses;
    addButton.textContent = 'Add Files';

    addButton.appendChild(createLoadingSpinner());

    addButton.onclick = runWithLoadingElement(addButton, () => selectAndUploadFiles())

    return addButton;
};

const createControlButtons = (): HTMLElement => {
    const controlContainer = document.createElement('div');
    controlContainer.className = 'relative ml-2 z-10';

    const sortButton = document.createElement('button');
    sortButton.className = addButtonClasses;
    sortButton.innerHTML = SortIcon;
    sortButton.setAttribute('title', 'Sort files');

    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden z-10';
    dropdownContent.innerHTML = `
    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md" data-sort="name">Sort by Name</a>
    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md" data-sort="date">Sort by Date</a>
    `;

    sortButton.onclick = () => {
        dropdownContent.classList.toggle('hidden');
    };

    dropdownContent.onclick = (e) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        if (target.hasAttribute('data-sort')) {
            const sortBy = target.getAttribute('data-sort') as 'name' | 'date';
            sortFiles(sortBy);
            dropdownContent.classList.add('hidden');
        }
    };

    document.addEventListener('click', (e) => {
        if (!controlContainer.contains(e.target as Node)) {
            dropdownContent.classList.add('hidden');
        }
    });

    controlContainer.appendChild(sortButton);
    controlContainer.appendChild(dropdownContent);

    const syncAllButton = createSyncAllButton();
    controlContainer.appendChild(syncAllButton);

    return controlContainer;
};

const createSyncAllButton = (): HTMLButtonElement => {
    const syncAllButton = document.createElement('button');
    syncAllButton.className = `${addButtonClasses} ml-2 hidden sync-all-button`;
    syncAllButton.innerHTML = `${ReloadIcon}`;
    syncAllButton.setAttribute('title', 'Sync all changed files');

    syncAllButton.appendChild(createLoadingSpinner());

    syncAllButton.onclick = () => {
        const fileList = document.querySelector('.fileList')
        console.log("FILE_LIST", fileList)
        runWithLoadingElement(fileList!, () => syncAllChangedFiles())();
    }

    return syncAllButton;
};

export const updateSyncAllButtonVisibility = (): void => {
    const syncAllButton = document.querySelector('.sync-all-button') as HTMLButtonElement;
    if (!syncAllButton) return;

    const files = getAllFilesFromElement();
    const hasChangedFiles = files.some(file => file.status === 'changed');

    syncAllButton.classList.toggle('hidden', !hasChangedFiles);
};
