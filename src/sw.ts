import { log, error } from "console";

interface Features {
  [key: string]: string;
}

const features: Features = {
  lowercase: "lowercase",
  uppercase: "uppercase",
};

const handleContextMenuClickEvent = async (
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
        action: "Selection",
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

function addResultSection(text: string) {
  // Create a div element
  const div = document.createElement("div");
  // Set the innerHTML to display the converted text
  div.innerHTML = `<b>Converted Text</b>: ${text}`;

  // Add some styling to make it look like a Google search result item
  div.style.backgroundColor = "#fff";
  div.style.border = "1px solid #ddd";
  div.style.padding = "10px";
  div.style.marginBottom = "10px";
  div.style.boxShadow = "0 2px 2px 0 rgba(0,0,0,.2)";
  div.style.borderRadius = "2px";
  div.style.fontFamily = "arial,sans-serif";
  div.style.fontSize = "14px";
  div.style.lineHeight = "1.4";
  div.style.color = "#222";
  div.style.maxWidth = "50%";

  // Inject the div element into the page
  // find the #extabar element and insert the HTML element
  const extabarElement = document.querySelector('#extabar');
  if (extabarElement !== null) {
    extabarElement.insertAdjacentElement('beforeend', div);
  }
}

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

  chrome.contextMenus.onClicked.addListener(handleContextMenuClickEvent);

  // chrome.runtime.onMessage.addListener(
  //   (message: any, sender: chrome.runtime.MessageSender, sendResponse) => {
  //     sendResponse({
  //       action: message?.action,
  //       message: "completed"
  //     });
  // });
} catch (err: any) {
  error(err.message);
}



/** omnibox */
chrome.omnibox.setDefaultSuggestion({
  description: `Please provide a valid feature (${Object.values(features).join(", ")}) and text to convert (for example, "${Object.keys(features)[0]} Some text to convert")`
});

// This event is fired with the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener((text: string, disposition: chrome.omnibox.OnInputEnteredDisposition) => {
  // Validate input format using regular expression
  const inputRegexString = `(${Object.keys(features).join("|")}) .+`;
  const inputRegex = new RegExp(inputRegexString);
  if (!inputRegex.test(text)) {
    // If input format is invalid, suggest correct format
    chrome.omnibox.setDefaultSuggestion({
      description: `Please provide a valid feature (${Object.values(features).join(", ")}) and text to convert (for example, "${Object.keys(features)[0]} Some text to convert")`
    });
    return;
  }
  
  // If input format is valid, proceed with conversion
  const feature: string = text.split(" ", 1)[0];
  const inputText: string = text.replace(/<.*?>/g, "").substring(feature.length + 1);
  let outputText: string = "";
  if (feature === features.lowercase) {
    outputText = inputText.toLowerCase();
  } else if (feature === features.uppercase) {
    outputText = inputText.toUpperCase();
  }

  // Set default suggestion to display converted text
  chrome.omnibox.setDefaultSuggestion({
    description: outputText
  });
  
  const query = `text=${encodeURIComponent(outputText)}`;
  
  const url = `https://www.google.com/search?q=%20&${query}`;

  chrome.tabs.create({ url }, function(tab) {
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.scripting.executeScript({
          target : {tabId : tab.id!, allFrames : true},
          func : addResultSection,
          args: [outputText]    
        }).then(() => console.log("Text converted successfully"));
      }
    });    
  });
});


// execute script
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === "complete" && tab && tab.url!.startsWith("chrome://newtab")) {
//     chrome.scripting.executeScript({
//       target : {tabId : tabId},
//       files: ["scripts/content_script.js"] 
//     }).then(() => console.log("script injected"));
//   }
// });

// send a message to content script
// chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//   if (tabs.length > 0) {
//     const tab = tabs[0];
//     const message = {
//       action: "copyToClipboard",
//       text: outputText,
//     };
//     chrome.tabs.sendMessage(tab.id!, message);
//   }
// });