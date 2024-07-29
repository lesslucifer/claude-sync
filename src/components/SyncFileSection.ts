// SyncFileSection.ts

import { selectAndConfigureWorkspace } from "../appService";
import { openWorkspaceInFileExplorer, selectWorkspacePath } from "../fileUtils";
import { getWorkspacePath, setWorkspacePath } from "../storageUtils";
import { createFileList } from "./FileList";
import { createHeader } from "./Header";

export const createSyncFileSection = (): HTMLElement => {
    const section = document.createElement('div');
    section.className = 'border-0.5 border-border-200 rounded-lg pb-4 pt-3 transition-all duration-300 ease-out lg:rounded-2xl mb-4';
  
    const header = createHeader();
    const workspaceConfig = createWorkspaceConfig();
  
    section.appendChild(header);
    section.appendChild(workspaceConfig);

    if (getWorkspacePath()) {
      const fileList = createFileList();
      section.appendChild(fileList);
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
      button.onclick = selectAndConfigureWorkspace;
      container.appendChild(button);
    } else {
      const text = document.createElement('a');
      text.className = 'text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer';
      text.textContent = `Workspace: ${workspacePath}`;
      text.onclick = (e) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          selectAndConfigureWorkspace();
        } else {
          openWorkspaceInFileExplorer(workspacePath);
        }
      };
      container.appendChild(text);
    }
  
    return container;
  };