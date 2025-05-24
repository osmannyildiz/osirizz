import browser from "webextension-polyfill";

async function restoreWindow(windowId: string, windowData: SavedWindow) {
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
  const { savedWindows = {} } = (await browser.storage.local.get(
    "savedWindows"
  )) as { savedWindows: Record<string, SavedWindow> };
  delete savedWindows[windowId];
  await browser.storage.local.set({ savedWindows });

  // The popup will close, so no need to bother updating the UI
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const msg = message as Message;
  switch (msg.type) {
    case "restoreWindow":
      restoreWindow(msg.windowId, msg.windowData);
      break;
    default:
      throw new Error(`Unknown message type: ${msg.type}`);
  }
  return true;
});
