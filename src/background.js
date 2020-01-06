
// Workaround to allow importing databases on firefox
// @see https://discourse.mozilla.org/t/getting-file-from-file-chooser-after-extension-popup-closed/32881

var browser = browser || chrome;
var isChrome = navigator.userAgent.indexOf('Chrome') != -1;

function importDatabases() {
  if (isChrome) {
    chrome.tabs.create({url: chrome.extension.getURL('index.html?page=manager')});
  } else {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (event) => {
      if (event.target.files.length) {
        const selectedFile = event.target.files[0];
        // Read file
        const fileReader = new FileReader();
        fileReader.readAsText(selectedFile, 'UTF-8');
        fileReader.onload = () => {
          // Parse data from file
          try {
            const databases = JSON.parse(fileReader.result);
            if (databases && databases.length) {
              // ToDo: check if databases config is valid
              browser.storage.local.set({'databases': databases});
            }
          }
          catch(error) {
            console.log(error.message);
          }
        };
        fileReader.onerror = (error) => {
          console.log(error.message);
        };
      }
      document.body.removeChild(fileInput);
    };
    document.body.appendChild(fileInput);
    fileInput.click();
  }
}
