import browser from "webextension-polyfill";

export async function getSavedWindows() {
  const { savedWindows = {} } = (await browser.storage.local.get(
    "savedWindows"
  )) as { savedWindows: SavedWindows };
  return savedWindows;
}

export async function setSavedWindows(savedWindows: SavedWindows) {
  await browser.storage.local.set({ savedWindows });
}
