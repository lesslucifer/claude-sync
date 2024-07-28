// SyncFileSection.ts

import { selectWorkspacePath } from "../fileUtils";
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

// Add this function
const createWorkspaceConfig = (): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'mx-4 my-2';

    const workspacePath = getWorkspacePath();
    if (!workspacePath) {
        const button = document.createElement('button');
        button.className = 'w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600';
        button.textContent = 'Configure Workspace';
        button.onclick = configureWorkspace;
        container.appendChild(button);
    } else {
        const text = document.createElement('p');
        text.className = 'text-sm text-gray-600';
        text.textContent = `Workspace: ${workspacePath}`;
        container.appendChild(text);
  }

  return container;
};

const configureWorkspace = async () => {
  const path = await selectWorkspacePath();
  if (path) {
    setWorkspacePath(path);
    location.reload();
  }
};
