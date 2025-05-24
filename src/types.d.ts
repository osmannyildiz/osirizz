declare global {
  interface SavedWindowTab {
    url: string;
    title: string;
  }

  interface SavedWindow {
    name: string;
    timestamp: string;
    tabs: SavedWindowTab[];
  }

  interface RestoreWindowMessage {
    type: "restoreWindow";
    windowId: string;
    windowData: SavedWindow;
  }

  type Message = RestoreWindowMessage;
}

export {};
