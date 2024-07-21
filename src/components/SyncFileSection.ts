// SyncFileSection.ts

import { resetChangeTracker } from "../changeTracker";
import { createFileList } from "./FileList";
import { createHeader } from "./Header";

export const createSyncFileSection = (): HTMLElement => {
    const section = document.createElement('div');
    section.className = 'border-0.5 border-border-200 rounded-lg pb-4 pt-3 transition-all duration-300 ease-out lg:rounded-2xl mb-4';

    const header = createHeader();
    const fileList = createFileList();
    const reloadDescription = createReloadDescription();

    section.appendChild(header);
    section.appendChild(fileList);
    section.appendChild(reloadDescription);

    return section;
};

const createReloadDescription = (): HTMLElement => {
    const description = document.createElement('p');
    description.className = 'sync-file-reload-description text-xs text-text-400 mt-2 mx-4 cursor-pointer hover:underline hidden';
    description.textContent = 'Changes may not be reflected in Project Knowledge. Click here to reload the page and update data.';
    description.onclick = () => {
        resetChangeTracker();
        window.location.reload();
    };
    return description;
};