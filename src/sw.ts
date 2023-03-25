import { log, error } from "console";

const features = {
  lowercase: "lowercase",
  uppercase: "uppercase",
};

const handleContextMenuSelection = async (
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined
) => {
  try {
    const { menuItemId, selectionText } = info;
    const feature = menuItemId;
    if (
      selectionText === "" ||
      selectionText === undefined ||
      selectionText === null
    ) {
      return;
    }

    let textToUpdate: string = selectionText;

    if (feature === features.lowercase) {
      textToUpdate = textToUpdate.toLowerCase();
    }

    if (feature === features.uppercase) {
      textToUpdate = textToUpdate.toUpperCase();
    }

    log({
      feature: feature,
      selectedText: selectionText,
      update: textToUpdate,
      onTab: tab,
    });

    if (tab && tab.id !== undefined) {
      const response = await chrome.tabs.sendMessage(tab.id, {
        event: "Selection",
        text: textToUpdate,
        feature: feature,
      });
      log(response);
    } else {
      error("Tab not found", tab);
    }
  } catch (err: any) {
    error(err.message);
  }
};

try {
  chrome.runtime.onInstalled.addListener(async () => {
    for (const [feature] of Object.entries(features)) {
      chrome.contextMenus.create({
        id: feature,
        title: feature,
        type: "normal",
        contexts: ["all"],
      });
    }
  });

  chrome.contextMenus.onClicked.addListener(handleContextMenuSelection);

  // chrome.runtime.onMessage.addListener(
  //   (message: any, sender: chrome.runtime.MessageSender, sendResponse) => {
  //     sendResponse({
  //       event: message?.event,
  //       message: "completed"
  //     });
  // });
} catch (err: any) {
  error(err.message);
}
