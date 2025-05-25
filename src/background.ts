import browser from "webextension-polyfill";
import { getSavedWindows, setSavedWindows } from "./utils/data";
import { downloadJsonFile } from "./utils/misc";

async function exportData() {
  const savedWindows = await getSavedWindows();

  const dateStr = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  downloadJsonFile(`osirizz_${dateStr}.json`, savedWindows);
}

async function restoreWindow(windowId: SavedWindowId, windowData: SavedWindow) {
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
  const savedWindows = await getSavedWindows();
  delete savedWindows[windowId];
  await setSavedWindows(savedWindows);

  // The popup will close, so no need to bother updating the UI
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const msg = message as Message;
  switch (msg.type) {
    case "exportData":
      exportData();
      break;
    case "restoreWindow":
      restoreWindow(msg.windowId, msg.windowData);
      break;
    default:
      throw new Error("Unknown message type");
  }
  return true;
});
