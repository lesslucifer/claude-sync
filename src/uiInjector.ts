// uiInjector.ts

let projectSectionElem: Element | null

const injectSyncButton = (): void => {
  const observer = new MutationObserver((mutations, obs) => {
    const allUploadFileInputs = document.querySelectorAll('[data-testid="project-doc-upload"]');
    const uploadFileInput = allUploadFileInputs.length ? allUploadFileInputs[allUploadFileInputs.length - 1] : null
    const addContentButton = uploadFileInput?.nextElementSibling
    console.log(`Project doc upload`, uploadFileInput)
    if (uploadFileInput && uploadFileInput.parentNode?.parentNode && addContentButton) {
      obs.disconnect(); // Stop observing once we find the button
      
      projectSectionElem = uploadFileInput.parentNode?.parentElement
      const syncButton = document.createElement('button');
      syncButton.textContent = 'Sync Folder';

      syncButton.className = addContentButton.className; // Copy the class for consistent styling
      syncButton.onclick = selectFolder;
      addContentButton?.parentNode?.insertBefore(syncButton, addContentButton);
      loadSyncedFolder(); // Load synced folder after injecting the button
    }
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

const selectFolder = (): void => {
  const input = document.createElement('input');
  input.type = 'file';
  input.webkitdirectory = true;
  
  input.onchange = (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      const folderPath = files[0].webkitRelativePath.split('/')[0];
      console.log('Selected folder:', folderPath);
      updateSyncStatus(folderPath);
      saveSyncedFolder(folderPath);
    }
  };

  input.click();
};

const updateSyncStatus = (path: string): void => {
  if (!projectSectionElem) return

  const filesSection = projectSectionElem.children[1]
  if (filesSection) {
    let statusElement = document.getElementById('sync-status');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'sync-status';
      statusElement.className = 'text-text-400 flex-1 text-xs'; // Consistent styling with other descriptions
      filesSection.appendChild(statusElement);
    }
    statusElement.textContent = `Synced with ${path}`;
  }
};

const saveSyncedFolder = (path: string): void => {
  const projectId = window.location.pathname.split('/').pop();
  if (projectId) {
    chrome.storage.local.set({ [projectId]: path });
  }
};

const loadSyncedFolder = (): void => {
  const projectId = window.location.pathname.split('/').pop();
  if (projectId) {
    chrome.storage.local.get(projectId, (result) => {
      if (result[projectId]) {
        updateSyncStatus(result[projectId]);
      }
    });
  }
};

injectSyncButton();