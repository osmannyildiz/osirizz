async function restoreWindow(windowId, windowData) {
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
    delete savedWindows[windowId];
    await browser.storage.local.set({ savedWindows });

    // The popup will close, so no need to bother updating the UI
  } catch (error) {
    console.error("Error restoring window:", error);
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "restoreWindow") {
    restoreWindow(message.windowId, message.windowData);
  }

  // sendResponse("done");
});
