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

  type SavedWindowId = string;

  type SavedWindows = Record<SavedWindowId, SavedWindow>;

  interface ExportDataMessage {
    type: "exportData";
  }

  interface RestoreWindowMessage {
    type: "restoreWindow";
    windowId: SavedWindowId;
    windowData: SavedWindow;
  }

  type Message = ExportDataMessage | RestoreWindowMessage;
}

export {};
