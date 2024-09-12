// SyncFileSection.ts

import { AppService } from "../appService";
import { openWorkspaceInFileExplorer } from "../fileUtils";
import { getWorkspacePath } from "../storageUtils";
import { buildFolderTree, renderFolderTree } from "./FolderTree";
import { createHeader } from "./Header";

export const createSyncFileSection = (): HTMLElement => {
  const section = document.createElement('div');
  section.className = 'border-0.5 border-border-200 rounded-lg pb-4 pt-3 transition-all duration-300 ease-out lg:rounded-2xl mb-4';

  const header = createHeader();
  const workspaceConfig = createWorkspaceConfig();

  section.appendChild(header);
  section.appendChild(workspaceConfig);

  if (getWorkspacePath()) {
    const folderTreeContainer = document.createElement('div');
    folderTreeContainer.id = 'folder-tree-container'
    folderTreeContainer.className = 'overflow-y-auto';
    folderTreeContainer.style.maxHeight = '400px';
    AppService.getSyncedFilesFromClaude().then(files => {
      AppService.FILES = files
      buildFolderTree(files).forEach(node => folderTreeContainer.appendChild(renderFolderTree(node)))
    })
    section.appendChild(folderTreeContainer);
  }
  return section;
};

const createWorkspaceConfig = (): HTMLElement => {
  const container = document.createElement('div');
  container.className = 'mx-4 my-2';

  const workspacePath = getWorkspacePath();
  if (!workspacePath) {
    const button = document.createElement('button');
    button.className = 'w-full py-2 px-4 bg-blue-500 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700';
    button.textContent = 'Configure Workspace';
    button.onclick = () => AppService.selectAndConfigureWorkspace();
    container.appendChild(button);
  } else {
    const text = document.createElement('a');
    text.className = 'text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer';
    text.textContent = `Workspace: ${workspacePath}`;
    text.onclick = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        AppService.selectAndConfigureWorkspace();
      } else {
        openWorkspaceInFileExplorer(workspacePath);
      }
    };
    container.appendChild(text);
  }

  return container;
};