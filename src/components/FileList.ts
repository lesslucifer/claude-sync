// FileList.ts

import { deleteFile } from '../apiUtils';
import { trackChange } from '../changeTracker';
import { formatRelativeTime } from '../helper';
import { SyncedFile } from '../types';
import { TrashIcon } from './icons';

export const createFileList = (): HTMLUListElement => {
    const fileList = document.createElement('ul');
    fileList.className = 'flex flex-col py-1 mx-4';
    return fileList;
};

export const addFileElement = (file: SyncedFile): void => {
    const fileList = document.querySelector('.sync-file-section ul');
    if (!fileList) return;

    const li = document.createElement('li');
    li.className = 'overflow-hidden';
    li.innerHTML = `
    <div class="group -mr-2 flex items-center gap-2 rounded-lg py-0.5 transition-colors lg:-mx-1 lg:pl-1 lg:pr-3 lg:hover:bg-bg-500/10">
      <div class="min-w-0 flex-1">
        <div class="mb-0.5 mt-1 line-clamp-2 break-words text-sm">${file.fileName}</div>
        <div class="text-text-400 flex items-center gap-1 text-xs">Last sync: ${formatRelativeTime(file.lastUpdated)}</div>
      </div>
      <div class="transition-opacity group-hover:opacity-100 lg:opacity-0">
        <button class="delete-file-btn inline-flex items-center justify-center relative shrink-0 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none text-text-200 transition-all font-styrene active:bg-bg-400 hover:bg-bg-500/40 hover:text-text-100 h-8 w-8 rounded-md active:scale-95" aria-label="Remove from synced files" data-uuid="${file.uuid}">
          ${TrashIcon}
        </button>
      </div>
    </div>
  `;

    const deleteButton = li.querySelector('.delete-file-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            deleteFile(file.uuid);
            trackChange();
        });
    }

    fileList.appendChild(li);
};

export const removeFileFromUI = (uuid: string): void => {
    const fileElement = document.querySelector(`[data-uuid="${uuid}"]`)?.closest('li');
    if (fileElement) {
        fileElement.remove();
        trackChange();
    }
};