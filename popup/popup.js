document.addEventListener("DOMContentLoaded", () => {
  // Load saved windows when popup opens
  loadSavedWindows();

  // Add event listener for save button
  document
    .getElementById("save-window")
    .addEventListener("click", saveCurrentWindow);
});

async function saveCurrentWindow() {
  const windowName = document.getElementById("window-name").value.trim();

  if (!windowName) {
    alert("Please enter a window name");
    return;
  }

  try {
    // Get current window
    const currentWindow = await browser.windows.getCurrent({ populate: true });

    // Get tab information
    const tabsData = currentWindow.tabs.map((tab) => ({
      url: tab.url,
      title: tab.title,
    }));

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
    alert("Error saving window");
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

      const restoreButton = document.createElement("button");
      restoreButton.className = "restore-btn";
      restoreButton.textContent = "Restore";
      restoreButton.onclick = () => restoreWindow(name, data);

      windowItem.appendChild(nameSpan);
      windowItem.appendChild(restoreButton);
      windowsList.appendChild(windowItem);
    });
  } catch (error) {
    console.error("Error loading saved windows:", error);
  }
}

async function restoreWindow(windowName, windowData) {
  try {
    // Create new window with first tab
    const firstTab = windowData.tabs[0];
    const newWindow = await browser.windows.create({
      url: firstTab.url,
    });

    // Create remaining tabs in the window
    const remainingTabs = windowData.tabs.slice(1);
    for (const tab of remainingTabs) {
      await browser.tabs.create({
        windowId: newWindow.id,
        url: tab.url,
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
    alert("Error restoring window");
  }
}
