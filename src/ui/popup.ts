import browser from "webextension-polyfill";

// Constants
const colorEmojis = {
  red: "🔴",
  orange: "🟠",
  yellow: "🟡",
  green: "🟢",
  blue: "🔵",
  purple: "🟣",
};

// Types
type ColorFilter = keyof typeof colorEmojis;

// State
let activeFilter: ColorFilter | null = null;

document.addEventListener("DOMContentLoaded", () => {
  // Load saved windows when popup opens
  loadSavedWindows();

  // Add event listener for save button
  document
    .getElementById("save-window-btn")!
    .addEventListener("click", saveCurrentWindow);

  // Add event listener for open in tab button
  document
    .getElementById("open-tab-btn")!
    .addEventListener("click", openInNewTab);

  // Add event listeners for color filters
  document.querySelectorAll(".color-filter").forEach((button) => {
    button.addEventListener("click", () => {
      const color = (button as HTMLButtonElement).dataset.color as ColorFilter;
      if (activeFilter === color) {
        // Deactivate filter if clicking active one
        activeFilter = null;
        button.classList.remove("active");
      } else {
        // Remove active class from previous filter
        if (activeFilter) {
          document
            .querySelector(`.color-filter[data-color="${activeFilter}"]`)!
            .classList.remove("active");
        }
        // Activate new filter
        activeFilter = color;
        button.classList.add("active");
      }
      loadSavedWindows(); // Refresh list with filter
    });
  });
});

async function openInNewTab() {
  try {
    // Get the extension's popup URL
    const extensionURL = browser.runtime.getURL("ui/popup.html");

    // Create a new tab with the popup URL
    await browser.tabs.create({
      url: extensionURL,
      active: true,
    });

    // Close the popup
    window.close();
  } catch (error) {
    console.error("Error opening in new tab:", error);
    showMessage("Error opening in new tab", "error");
  }
}

function showMessage(text: string, type: "error") {
  const messageEl = document.getElementById("message")!;
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function clearMessage() {
  const messageEl = document.getElementById("message")!;
  messageEl.textContent = "";
  messageEl.className = "message";
}

async function saveCurrentWindow() {
  try {
    // Get current window with tabs
    const currentWindow = await browser.windows.getCurrent({ populate: true });

    // Get tab information (excluding about: URLs)
    if (!currentWindow.tabs) throw new Error("No tabs found in current window");
    const tabsData = currentWindow.tabs
      .filter((tab) => {
        if (!tab.url) throw new Error("No URL found in tab");
        return !tab.url.startsWith("about:");
      })
      .map((tab) => ({
        url: tab.url!,
        title: tab.title || "Untitled",
      }));

    if (tabsData.length === 0) {
      showMessage("Cannot save window: No valid URLs found", "error");
      return;
    }

    // Use first tab's title as window name
    const windowName = tabsData[0].title || "Untitled";

    // Generate unique ID for the window
    const windowId = crypto.randomUUID();

    // Get existing saved windows
    const { savedWindows = {} } = (await browser.storage.local.get(
      "savedWindows"
    )) as { savedWindows: Record<string, SavedWindow> };

    // Save new window data
    savedWindows[windowId] = {
      name: windowName,
      timestamp: new Date().toISOString(),
      tabs: tabsData,
    };

    // Store updated data
    await browser.storage.local.set({ savedWindows });

    // Close current window
    if (typeof currentWindow.id !== "number")
      throw new Error("No window ID found");
    await browser.windows.remove(currentWindow.id);
  } catch (error) {
    console.error("Error saving window:", error);
    showMessage("Error saving window", "error");
  }
}

async function loadSavedWindows() {
  try {
    const { savedWindows = {} } = (await browser.storage.local.get(
      "savedWindows"
    )) as { savedWindows: Record<string, SavedWindow> };
    const windowsList = document.getElementById("windows-list")!;
    windowsList.innerHTML = "";

    // Filter windows based on active color filter
    const entries = Object.entries(savedWindows).filter(([_, data]) => {
      if (!activeFilter) return true;
      const emoji = colorEmojis[activeFilter];
      return data.name.startsWith(emoji);
    });

    entries.forEach(([id, data]) => {
      const windowItem = document.createElement("div");
      windowItem.className = "window-item";

      const windowInfo = document.createElement("div");
      windowInfo.className = "window-info";

      const nameSpan = document.createElement("span");
      nameSpan.className = "window-name";
      nameSpan.textContent = data.name;
      windowInfo.appendChild(nameSpan);

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "window-actions";

      const restoreButton = document.createElement("button");
      restoreButton.className = "icon-button restore-btn";
      restoreButton.innerHTML = '<span class="material-icons">restore</span>';
      restoreButton.title = "Restore window";
      restoreButton.onclick = () => restoreWindow(id, data);

      const deleteButton = document.createElement("button");
      deleteButton.className = "icon-button delete-btn";
      deleteButton.innerHTML = '<span class="material-icons">delete</span>';
      deleteButton.title = "Delete window";
      deleteButton.onclick = () => deleteWindow(id);

      actionsDiv.appendChild(restoreButton);
      actionsDiv.appendChild(deleteButton);

      windowItem.appendChild(windowInfo);
      windowItem.appendChild(actionsDiv);
      windowsList.appendChild(windowItem);
    });
  } catch (error) {
    console.error("Error loading saved windows:", error);
    showMessage("Error loading saved windows", "error");
  }
}

async function deleteWindow(windowId: string) {
  try {
    // Get existing saved windows
    const { savedWindows = {} } = (await browser.storage.local.get(
      "savedWindows"
    )) as { savedWindows: Record<string, SavedWindow> };

    // Remove the window
    delete savedWindows[windowId];

    // Update storage
    await browser.storage.local.set({ savedWindows });

    // Refresh the displayed list
    loadSavedWindows();
  } catch (error) {
    console.error("Error deleting window:", error);
    showMessage("Error deleting window", "error");
  }
}

async function restoreWindow(windowId: string, windowData: SavedWindow) {
  await browser.runtime.sendMessage({
    type: "restoreWindow",
    windowId: windowId,
    windowData: windowData,
  });
}
