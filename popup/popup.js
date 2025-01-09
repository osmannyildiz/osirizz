document.addEventListener("DOMContentLoaded", () => {
  // Load saved windows when popup opens
  loadSavedWindows();

  // Add event listener for save button
  document
    .getElementById("save-window-btn")
    .addEventListener("click", saveCurrentWindow);
});

function showMessage(text, type) {
  const messageEl = document.getElementById("message");
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function clearMessage() {
  const messageEl = document.getElementById("message");
  messageEl.textContent = "";
  messageEl.className = "message";
}

async function saveCurrentWindow() {
  try {
    // Get current window with tabs
    const currentWindow = await browser.windows.getCurrent({ populate: true });

    // Get tab information (excluding about: URLs)
    const tabsData = currentWindow.tabs
      .filter((tab) => !tab.url.startsWith("about:"))
      .map((tab) => ({
        url: tab.url,
        title: tab.title,
      }));

    if (tabsData.length === 0) {
      showMessage("Cannot save window: No valid URLs found", "error");
      return;
    }

    // Use first tab's title as window name
    const windowName = tabsData[0].title;

    // Get existing saved windows
    const { savedWindows = {} } = await browser.storage.local.get(
      "savedWindows"
    );

    // Save new window data
    savedWindows[windowName] = {
      tabs: tabsData,
      timestamp: new Date().toISOString(),
    };

    // Store updated data
    await browser.storage.local.set({ savedWindows });

    // Close current window
    await browser.windows.remove(currentWindow.id);
  } catch (error) {
    console.error("Error saving window:", error);
    showMessage("Error saving window", "error");
  }
}

async function loadSavedWindows() {
  try {
    const { savedWindows = {} } = await browser.storage.local.get(
      "savedWindows"
    );
    const windowsList = document.getElementById("windows-list");
    windowsList.innerHTML = "";

    Object.entries(savedWindows).forEach(([name, data]) => {
      const windowItem = document.createElement("div");
      windowItem.className = "window-item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "window-name";
      nameSpan.textContent = name;

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "window-actions";

      const restoreButton = document.createElement("button");
      restoreButton.className = "icon-button restore-btn";
      restoreButton.innerHTML = '<span class="material-icons">restore</span>';
      restoreButton.title = "Restore window";
      restoreButton.onclick = () => restoreWindow(name, data);

      const deleteButton = document.createElement("button");
      deleteButton.className = "icon-button delete-btn";
      deleteButton.innerHTML = '<span class="material-icons">delete</span>';
      deleteButton.title = "Delete window";
      deleteButton.onclick = () => deleteWindow(name);

      actionsDiv.appendChild(restoreButton);
      actionsDiv.appendChild(deleteButton);

      windowItem.appendChild(nameSpan);
      windowItem.appendChild(actionsDiv);
      windowsList.appendChild(windowItem);
    });
  } catch (error) {
    console.error("Error loading saved windows:", error);
    showMessage("Error loading saved windows", "error");
  }
}

async function deleteWindow(windowName) {
  try {
    // Get existing saved windows
    const { savedWindows = {} } = await browser.storage.local.get(
      "savedWindows"
    );

    // Remove the window
    delete savedWindows[windowName];

    // Update storage
    await browser.storage.local.set({ savedWindows });

    // Refresh the displayed list
    loadSavedWindows();
  } catch (error) {
    console.error("Error deleting window:", error);
    showMessage("Error deleting window", "error");
  }
}

async function restoreWindow(windowName, windowData) {
  try {
    // Create new window with first tab
    const firstTab = windowData.tabs[0];
    const newWindow = await browser.windows.create({
      url: firstTab.url,
    });

    // Create remaining tabs in the window (discarded until activated)
    const remainingTabs = windowData.tabs.slice(1);
    for (const tab of remainingTabs) {
      await browser.tabs.create({
        windowId: newWindow.id,
        url: tab.url,
        active: false,
        discarded: true,
        title: tab.title,
      });
    }

    // Remove the saved window from storage
    const { savedWindows = {} } = await browser.storage.local.get(
      "savedWindows"
    );
    delete savedWindows[windowName];
    await browser.storage.local.set({ savedWindows });

    // Refresh the displayed list
    loadSavedWindows();
  } catch (error) {
    console.error("Error restoring window:", error);
    showMessage("Error restoring window", "error");
  }
}
