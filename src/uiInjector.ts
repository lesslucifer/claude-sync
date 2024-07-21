// uiInjector.ts

let projectSectionElem: Element | null

const injectSyncButton = (): void => {
  const observer = new MutationObserver((mutations, obs) => {
    const allUploadFileInputs = document.querySelectorAll('[data-testid="project-doc-upload"]');
    const uploadFileInput = allUploadFileInputs.length ? allUploadFileInputs[allUploadFileInputs.length - 1] : null
    const addContentButton = uploadFileInput?.nextElementSibling
    if (uploadFileInput && uploadFileInput.parentNode?.parentNode && addContentButton) {
      obs.disconnect(); // Stop observing once we find the button

      projectSectionElem = uploadFileInput.parentNode?.parentElement
      const syncButton = document.createElement('button');
      syncButton.textContent = 'Sync File';

      syncButton.className = addContentButton.className; // Copy the class for consistent styling
      syncButton.onclick = selectFile;
      addContentButton?.parentNode?.insertBefore(syncButton, addContentButton);
    }
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

const selectFile = (): void => {
  const input = document.createElement('input');
  input.type = 'file';

  input.onchange = async (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      const file = files[0];
      await uploadFile(file);
    }
  };

  input.click();
};

const uploadFile = async (file: File): Promise<void> => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target?.result as string;
    const projectId = window.location.pathname.split('/').pop();
    const orgId = getOrganizationId();

    if (!projectId || !orgId) {
      console.error('Unable to determine project or organization ID');
      return;
    }

    try {
      const response = await fetch(`https://claude.ai/api/organizations/${orgId}/projects/${projectId}/docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add other headers as needed
        },
        body: JSON.stringify({
          file_name: file.name,
          content: content
        })
      });

      if (response.ok) {
        console.log('File uploaded successfully');
        updateSyncStatus(file.name);
      } else {
        console.error('Failed to upload file:', await response.text());
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  reader.readAsText(file);
};

const getOrganizationId = (): string | null => {
  const scripts = document.getElementsByTagName('script');
  for (const script of scripts) {
    const content = script.textContent || script.innerText;
    console.log(`getOrganizationId`, content)
    const match = content.match(/\\"memberships\\":\[\{\\"organization\\":\{\\"uuid\\":\\"([^\\"]+)\\"/);
    if (match && match[1]) {
      return match[1];
    }
  }
  console.error('Unable to find organization ID in page scripts');
  return null;
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

const forceReactRerender = (): void => {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      const root = document.getElementById('root') || document.body;
      if (!root || !root._reactRootContainer) {
        console.error('React root not found');
        return;
      }

      const ReactDOM = root._reactRootContainer._internalRoot.current.child.stateNode.updater.renderer.reconciler.renderer.bundleType === 1 
        ? root._reactRootContainer._internalRoot.current.child.stateNode.updater.renderer.reconciler.renderer.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactDOM 
        : window.ReactDOM;

      if (!ReactDOM) {
        console.error('ReactDOM not found');
        return;
      }

      const rootComponent = root._reactRootContainer._internalRoot.current.child.stateNode;
      const rootProps = root._reactRootContainer._internalRoot.current.memoizedProps;

      ReactDOM.unmountComponentAtNode(root);
      ReactDOM.render(React.createElement(rootComponent.constructor, rootProps), root);

      console.log('React application remounted');
    })();
  `;
  document.head.appendChild(script);
  document.head.removeChild(script);
};