# <img src="src/assets/images/firestore_logo.png" alt="icon" width="38" align="top" /> Firestore Manager

[![Mozilla Add-on version](https://img.shields.io/amo/v/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/?src=external-github-shield-downloads)
[![Mozilla Add-on downloads](https://img.shields.io/amo/dw/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/?src=external-github-shield-downloads)
[![Mozilla Add-on users](https://img.shields.io/amo/users/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/statistics/)
[![Mozilla Add-on stars](https://img.shields.io/amo/stars/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/reviews/)
[![Donate](https://img.shields.io/badge/PayPal-Donate-gray.svg?style=flat&logo=paypal&colorA=0071bb&logoColor=fff)](https://www.paypal.me/axeldev)

A simple, fast and intuitive web-extension to manage firestore databases, made with [Angular](https://github.com/angular).

![screenshot](screenshots/popup.png)

:warning: This project is still work in progress & may not be suited for production use.

## Features

<!-- - Clean UI (based on [ng-zorro-antd](https://github.com/NG-ZORRO/ng-zorro-antd)). -->
- Easily Add/Clone/Rename/Delete/Filter collections & documents.
- 3 editing modes (thanks to [jsoneditor](https://github.com/josdejong/jsoneditor) project).
- Powerful diff viewer (using [diff-match-patch](https://github.com/google/diff-match-patch) & [diff2html](https://github.com/rtfpessoa/diff2html)).
- JSON export/import.
- Firebase Authentication Support (Anonymous, email & password, JWT token).
- [Experimental] Databases Auto Backup (webextension only).

## Installation

[![Get it for Firefox!](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png)](https://addons.mozilla.org/firefox/addon/firestore-manager/?src=external-github-download)
[![Get it for Chrome!](https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_206x58.png)](https://github.com/FirebaseGoodies/firestore-manager/releases)

Or [try it as a web application](https://firebasegoodies.github.io/firestore-manager/manager).

## Tips

<table>
  <tr align="center">
    <td>
      <img src="screenshots/tips/right_click_context_menu.png" alt="right click to open context menu"/>
    </td>
    <td>
      <img src="screenshots/tips/settings.png" alt="settings"/>
    </td>
  </tr>
  <tr align="center">
    <td>
      Right click on any collection or document name to get more options
    </td>
    <td>
      You can set global settings for all your databases
    </td>
  </tr>
  <tr align="center">
    <td colspan="2">
      <img src="screenshots/tips/json_editor_menu.png" alt="json editor menu"/>
    </td>
  </tr>
  <tr align="center">
    <td colspan="2">
    Use the json editor menu options to perform actions like auto-fix json errors, undo/redo changes & also switch the editor mode
    </td>
  </tr>
</table>

## Todo

- [x] Translations
- [x] Add collections filter (field - operator - value)
- [ ] Refactor long components code (by decomposition)
- [ ] Handle sub-collections
- [ ] Add unit tests

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Package

Make sure you have the following package installed `npm install -g web-ext`. Then run:

```
npm run build && npm run package
```

## Deploy on github pages

Make sure you have the following package installed `npm install -g angular-cli-ghpages`. Then run:

```
npm run build:github && npm run deploy:github
```

## License

Firestore Manager is licensed under the [MPL2](LICENSE) license.
