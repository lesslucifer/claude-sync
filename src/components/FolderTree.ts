// src/components/FolderTree.ts

import { AppService } from '../appService';
import { formatRelativeTime, getRelativePath } from '../helper';
import { getWorkspacePath } from '../storageUtils';
import { SyncedFile } from '../types';
import { ChevronDownIcon, ChevronRightIcon, DeletedIcon, FileChangedIcon, FileIcon, FolderIcon, ReloadIcon, TrashIcon } from './icons';
import { createLoadingSpinner, runWithLoadingElement } from './uiHelper';

interface TreeNode {
    name: string;
    path: string;
    isFile: boolean;
    children: TreeNode[];
    file?: SyncedFile;
    element?: HTMLElement;
    status?: 'changed' | 'deleted' | 'synced';
}

export const buildFolderTree = (files: SyncedFile[]): TreeNode[] => {
    const root: TreeNode = { name: 'root', isFile: false, path: '', children: [] };

    files.forEach(file => {
        const parts = getRelativePath(getWorkspacePath() ?? '', file.filePath).split(/[\\/]/);
        let currentNode = root;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            let child = currentNode.children.find(c => c.name === part);

            if (!child) {
                child = { name: part, isFile, children: [], path: currentNode.path + `/${part}`, file: isFile ? file : undefined };
                currentNode.children.push(child);
            }

            currentNode = child;
        });
    });

    const sortNode = (node: TreeNode) => {
        node.children.sort((a, b) => {
            if (a.isFile === b.isFile) {
                return a.name.localeCompare(b.name);
            }
            return a.isFile ? 1 : -1;
        });
        node.children.forEach(sortNode);
    };
    sortNode(root);

    return root.children;
};

export const renderFolderTree = (node: TreeNode, level = 0): HTMLElement => {
    if (node.isFile) {
        return createFileElement(node.file!);
    } else {
        const folderNode = createFolderNode(node.name, node.path, level);
        const childrenContainer = folderNode.querySelector('.folder-children') as HTMLElement;

        node.children.forEach(child => {
            childrenContainer.appendChild(renderFolderTree(child, level + 1));
        });

        node.element = folderNode;
        return folderNode;
    }
};

export const addFileElement = (file: SyncedFile): void => {
    const folderTreeContainer = document.getElementById('folder-tree-container');
    if (!folderTreeContainer) return;

    const parts = getRelativePath(getWorkspacePath() ?? '', file.filePath).split(/[\\/]/);
    let currentNode = folderTreeContainer;
    let path = ''
    let currentLevel = 0;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        path = [path, part].join('/')
        const isFile = i === parts.length - 1;

        if (isFile) {
            const fileElement = createFileElement(file);
            const insertIndex = Array.from(currentNode.children).findIndex(child => 
                child.classList.contains('synced-file-element') && 
                child.querySelector('.text-sm')!.textContent!.localeCompare(part) > 0
            );
            if (insertIndex === -1) {
                currentNode.appendChild(fileElement);
            } else {
                currentNode.insertBefore(fileElement, currentNode.children[insertIndex]);
            }
        } else {
            let folderNode = Array.from(currentNode.children).find(
                child => child.querySelector('.folder-name')?.textContent === part
            ) as HTMLElement;

            if (!folderNode) {
                folderNode = createFolderNode(part, path, currentLevel);
                const insertIndex = Array.from(currentNode.children).findIndex(child => 
                    child.classList.contains('folder-tree-node') && 
                    child.querySelector('.folder-name')!.textContent!.localeCompare(part) > 0
                );
                if (insertIndex === -1) {
                    currentNode.appendChild(folderNode);
                } else {
                    currentNode.insertBefore(folderNode, currentNode.children[insertIndex]);
                }
            }

            currentNode = folderNode.querySelector('.folder-children') as HTMLElement;
            currentLevel++;
        }
    }
};

const createFolderNode = (folderName: string, path: string, level: number): HTMLElement => {
    const folderNode = document.createElement('div');
    folderNode.className = 'folder-tree-node';
    folderNode.style.paddingLeft = `16px`;
    folderNode.setAttribute("path", path)

    const folderContainer = document.createElement('div');
    folderContainer.className = 'flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-100 rounded';
    folderContainer.appendChild(createLoadingSpinner())

    const toggleIcon = document.createElement('span');
    toggleIcon.innerHTML = ChevronRightIcon;
    toggleIcon.className = 'w-4 h-4 text-gray-500';

    const folderIcon = document.createElement('span');
    folderIcon.innerHTML = FolderIcon;
    folderIcon.className = 'w-5 h-5 text-yellow-500';

    const folderNameSpan = document.createElement('span');
    folderNameSpan.textContent = folderName;
    folderNameSpan.className = 'text-sm font-medium text-gray-700 folder-name';

    const statusIcon = document.createElement('span');
    statusIcon.className = 'folder-status-icon hidden w-4 h-4 ml-2';

    const buttonsContainer = document.createElement('div')
    buttonsContainer.className = 'ml-auto'

    const reloadButton = document.createElement('button');
    reloadButton.innerHTML = ReloadIcon;
    reloadButton.className = 'p-1 rounded hover:bg-gray-200 hidden folder-reload-btn';
    reloadButton.setAttribute('title', 'Reload all changed files in this folder');
    reloadButton.onclick = runWithLoadingElement(folderNode, async (e) => {
        e.stopPropagation();
        await AppService.syncAllChangedFilesInPath(path);
        updateFolderStatus(folderNode);
    });

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = TrashIcon;
    deleteButton.className = 'p-1 rounded hover:bg-gray-200 ml-2';
    deleteButton.setAttribute('title', 'Delete folder and all files inside');
    deleteButton.onclick = runWithLoadingElement(folderNode, async (e) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete the folder "${folderName}" and all its contents?`)) return

        await AppService.deleteAllFilesInPath(path);
        folderNode.remove();
    });

    buttonsContainer.appendChild(reloadButton)
    buttonsContainer.appendChild(deleteButton)

    folderContainer.appendChild(toggleIcon);
    folderContainer.appendChild(folderIcon);
    folderContainer.appendChild(folderNameSpan);
    folderContainer.appendChild(statusIcon);
    folderContainer.appendChild(buttonsContainer);

    const folderChildren = document.createElement('div');
    folderChildren.className = 'folder-children ml-2 hidden';

    folderContainer.onclick = () => {
        folderChildren.classList.toggle('hidden');
        toggleIcon.innerHTML = folderChildren.classList.contains('hidden') ? ChevronRightIcon : ChevronDownIcon;
    };

    folderNode.appendChild(folderContainer);
    folderNode.appendChild(folderChildren);

    return folderNode;
};

const createFileElement = (file: SyncedFile): HTMLElement => {
    const div = document.createElement('div');
    div.id = file.uuid;
    div.className = 'overflow-hidden synced-file-element py-1 px-5 hover:bg-gray-100 rounded';

    div.innerHTML = `
      <div class="group flex items-center gap-2">
        <span class="w-5 h-5 text-blue-500">${FileIcon}</span>
        <div class="min-w-0 flex-1" title="Path: ${file.filePath}">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">${file.fileName}</span>
            ${file.status === 'changed' ? `<span class="text-yellow-500" title="File has changed">${FileChangedIcon}</span>` : ''}
            ${file.status === 'deleted' ? `<span class="text-red-500" title="File has been deleted">${DeletedIcon}</span>` : ''}
            ${file.status === 'broken' ? `<span class="text-red-500" title="File is broken">${DeletedIcon}</span>` : ''}
          </div>
          <div class="text-xs text-gray-500">Last sync: ${formatRelativeTime(file.lastUpdated)}</div>
        </div>
        <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="reload-file-btn p-1 rounded hover:bg-gray-200" aria-label="Reload file" file-id="${file.uuid}" data-filepath="${file.filePath}">
            ${ReloadIcon}
          </button>
          <button class="delete-file-btn p-1 rounded hover:bg-gray-200" aria-label="Remove from synced files" file-id="${file.uuid}">
            ${TrashIcon}
          </button>
        </div>
      </div>
    `;

    const reloadButton = div.querySelector('.reload-file-btn');
    if (reloadButton) {
        reloadButton.addEventListener('click', runWithLoadingElement(div, () => AppService.resyncFile(file)));
    }

    const deleteButton = div.querySelector('.delete-file-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', runWithLoadingElement(div, () => AppService.deleteSyncFile(file)));
    }

    return div;
};

export const updateFolderStatus = (folderNode: HTMLElement): void => {
    const path = folderNode.getAttribute("path")
    if (!path) return

    const statusIcon = folderNode.querySelector('.folder-status-icon') as HTMLElement;
    const reloadButton = folderNode.querySelector('.folder-reload-btn') as HTMLElement;

    const hasChangedFiles = AppService.isFolderHasChangedFile(path)

    if (hasChangedFiles) {
        statusIcon.innerHTML = FileChangedIcon;
        statusIcon.classList.remove('hidden');
        reloadButton.classList.remove('hidden');
    } else {
        statusIcon.classList.add('hidden');
        reloadButton.classList.add('hidden');
    }
};

export const resetFileElementContent = (file: SyncedFile, oldUuid: string | null): void => {
    const elem = getFileElement(oldUuid ?? file.uuid);
    if (!elem) return;

    const newElement = createFileElement(file);
    elem.parentNode?.replaceChild(newElement, elem);

    let node: HTMLElement | null = newElement.parentElement
    while (node) {
        if (node.classList.contains("folder-tree-node")) {
            updateFolderStatus(node);
        }
        node = node?.parentElement
    }
};

export const removeFileFromUI = (fileId: string): void => {
    const fileElement = document.getElementById(fileId);
    if (!fileElement) return;

    const folderNode = fileElement.closest('.folder-tree-node') as HTMLElement;
    fileElement.remove();
    // Check if the folder is empty and remove it if necessary
    if (folderNode && folderNode.querySelector('.folder-children')) {
        const folderChildren = folderNode.querySelector('.folder-children') as HTMLElement;
        if (folderChildren.children.length === 0) {
            folderNode.remove();
        }
    }
};

export const getFileElement = (fileId: string) => {
    return document.getElementById(fileId)
}