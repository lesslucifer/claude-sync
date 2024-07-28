// FileList.ts

import { deleteSyncFile, hardDeleteFiles, resyncFile } from '../appService';
import { formatRelativeTime } from '../helper';
import { SyncedFile, SyncedFileStatus } from '../types';
import { DeletedIcon, FileChangedIcon, ReloadIcon, TrashIcon } from './icons';
import { createLoadingSpinner, runWithLoadingElement as runWithLoading } from './uiHelper';

export const createFileList = (): HTMLUListElement => {
  const fileList = document.createElement('ul');
  fileList.className = 'flex flex-col py-1 mx-4';
  return fileList;
};

export const addFileElement = (file: SyncedFile): void => {
  const fileList = document.querySelector('.sync-file-section ul');
  if (!fileList) return;

  const li = document.createElement('li');
  resetFileElementContent(file, li)
  fileList.appendChild(li);
};

export const getFileElement = (fileId: string): HTMLElement | undefined => {
  return document.querySelector(`li[id="${fileId}"]`) as HTMLElement
}

export const getAllFilesFromElement = (): SyncedFile[] => {
  const elems = document.querySelectorAll("li.sycned-file-element")
  const files: SyncedFile[] = []
  elems.forEach(elem => {
    if (!elem?.id || !elem?.getAttribute("uuid")) return
    files.push({
      fileName: elem.getAttribute("fileName") ?? '',
      filePath: elem.getAttribute("filePath") ?? '',
      lastUpdated: Number(elem.getAttribute("lastUpdated")),
      status: (elem.getAttribute("status") as SyncedFileStatus) ?? 'synced',
      uuid: elem.getAttribute("uuid") ?? '',
    })
  })
  return files
}

export const resetFileElementContent = (file: SyncedFile, elem?: HTMLElement) => {
  elem ??= getFileElement(file.uuid)
  if (!elem) return

  elem.innerHTML = `
    <div class="group -mr-2 flex items-center gap-2 rounded-lg py-0.5 transition-colors lg:-mx-1 lg:pl-1 lg:pr-3 lg:hover:bg-bg-500/10">
      <div class="min-w-0 flex-1" title="Path: ${file.filePath}">
        <div class="mb-0.5 mt-1 line-clamp-2 break-words text-sm" style="display: flex; flex-direction: row; align-items: center;">
          ${file.status === 'changed' ? `<span class="mr-2" title="File has changed">${FileChangedIcon}</span>` : ''}
          ${file.status === 'deleted' ? `<span class="mr-2" title="File has been deleted">${DeletedIcon}</span>` : ''}
          ${file.status === 'broken' ? `<span class="mr-2" title="File is broken">${DeletedIcon}</span>` : ''}
          ${file.fileName}
          ${createLoadingSpinner().outerHTML}
        </div>
        <div class="text-text-400 flex items-center gap-1 text-xs">Last sync: ${formatRelativeTime(file.lastUpdated)}</div>
      </div>
      <div class="transition-opacity group-hover:opacity-100 lg:opacity-0 flex items-center">
        <button class="reload-file-btn inline-flex items-center justify-center relative shrink-0 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none text-text-200 transition-all font-styrene active:bg-bg-400 hover:bg-bg-500/40 hover:text-text-100 h-8 w-8 rounded-md active:scale-95 mr-2" aria-label="Reload file" file-id="${file.uuid}" data-filepath="${file.filePath}">
          ${ReloadIcon}
        </button>
        <button class="delete-file-btn inline-flex items-center justify-center relative shrink-0 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none text-text-200 transition-all font-styrene active:bg-bg-400 hover:bg-bg-500/40 hover:text-text-100 h-8 w-8 rounded-md active:scale-95" aria-label="Remove from synced files" file-id="${file.uuid}">
          ${TrashIcon}
        </button>
      </div>
    </div>
  `;
  elem.id = file.uuid
  elem.className = 'overflow-hidden sycned-file-element';
  elem.setAttribute("lastUpdated", file.lastUpdated.toString())
  elem.setAttribute("path", file.filePath)
  elem.setAttribute("status", file.status)
  elem.setAttribute("fileName", file.fileName)
  elem.setAttribute("uuid", file.uuid)

  const reloadButton = elem.querySelector('.reload-file-btn');
  if (reloadButton) {
    reloadButton.addEventListener('click', async () => {
      runWithLoading(elem, () => resyncFile(file))();
    });
  }

  const deleteButton = elem.querySelector('.delete-file-btn');
  if (deleteButton) {
    deleteButton.addEventListener('click', runWithLoading(elem, (event) => {
      if ((event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey) {
        return hardDeleteFiles(file);
      } else {
        return deleteSyncFile(file)
      }
    }));
  }
}

export const removeFileFromUI = (fileId: string): void => {
  getFileElement(fileId)?.remove()
};