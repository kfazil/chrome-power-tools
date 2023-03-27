console.log("Hellow from content script");

var inputBox: null | HTMLInputElement;
var completeValue: string;
var selectedValue: string;
var startPos: null | number;
var endPos: null | number;
var textToUpdate: string;

const copyToClipboard = async(text: string) => {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText)
    return await navigator.clipboard.writeText(text);
};

chrome.runtime.onMessage.addListener(
  async(message: any, sender: chrome.runtime.MessageSender, sendResponse) => {
    const {action, text, feature} = message;

    console.log({
      action: action,
      text: text,
      feature: feature
    });

    if (action === "Selection") {
      let inputBoxFound = false;
      console.log(
        sender.tab
          ? "from a content script:" + sender.tab.url
          : "from the extension"
      );

      if(inputBox !== null){
        inputBox.value = text ?? "";
        inputBoxFound = true;
        textToUpdate = completeValue.slice(0, startPos ?? 0) + text + completeValue.slice(endPos ?? 0);
        inputBox.value = textToUpdate;
      }

      sendResponse({
        action: action,
        feature: feature,
        convertedText: text,
        message: inputBoxFound ? "text converted" : "Error: Input box not found"
      });

      if(inputBox){
        await copyToClipboard(textToUpdate);
        sendResponse({
          action: action,
          message: "Text copied to clipboard"
        });
      }
      
    } else if(action === "copyToClipboard"){
      await copyToClipboard(text);
      sendResponse({
        action: action,
        message: "Text copied to clipboard"
      });   
    } else {
      sendResponse({
        action: action,
        message: "completed"
      });
    }
  }
);


// Add an event listener for the 'mouseup' event on the document
document.addEventListener('mouseup', async(event: MouseEvent) => {

  // Get the element that triggered the event and cast it as an HTMLElement
  const target = event.target as HTMLElement;

  // Find the nearest ancestor of the target element that matches one of the specified selectors
  // and cast it as an HTMLInputElement
  inputBox = target.closest('input[type=text], input[type=search], input[type=email], input[type=number], input:not([type])') as HTMLInputElement;

  if(inputBox !== null){
    // Get the text that the user has selected on the page
    selectedValue = window.getSelection()?.toString().trim() ?? "";
  
    // Get the current value of the input box
    completeValue = inputBox.value;
  
    // Log the results to the console for debugging purposes
  
    if (selectedValue && inputBox) {
      inputBox.focus();
      startPos = inputBox.selectionStart ?? null;
      endPos = inputBox.selectionEnd ?? null;
    }
  
    console.log({
      inputBox: inputBox,
      selectedValue: selectedValue,
      completeValue: completeValue,
      startPos: startPos,
      endPos: endPos
    });

    // const response = await chrome.runtime.sendMessage({
    //   action: "connection-check",
    //   message: "new-selection"
    // });
    // console.log(response);
  }
});