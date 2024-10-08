import { AppService } from "../appService";
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

    addButton.onclick = runWithLoadingElement(addButton, () => AppService.selectAndUploadFiles())

    return addButton;
};

const createControlButtons = (): HTMLElement => {
    const controlContainer = document.createElement('div');
    controlContainer.className = 'relative ml-2 z-10';
    return controlContainer;
};