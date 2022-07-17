# <img src="src/assets/images/firestore_logo.png" alt="icon" width="38" align="top" /> Firestore Manager

[![Mozilla Add-on version](https://img.shields.io/amo/v/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/?src=external-github-shield-downloads)
[![Mozilla Add-on downloads](https://img.shields.io/amo/dw/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/?src=external-github-shield-downloads)
[![Mozilla Add-on users](https://img.shields.io/amo/users/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/statistics/)
[![Mozilla Add-on stars](https://img.shields.io/amo/stars/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/reviews/)
[![Donate](https://img.shields.io/badge/PayPal-Donate-gray.svg?style=flat&logo=paypal&colorA=0071bb&logoColor=fff)](https://www.paypal.me/axeldev)
[![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2FFirebaseGoodies%2Ffirestore-manager&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false)](https://hits.seeyoufarm.com)

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

[![Get it for Firefox!](https://i.imgur.com/TMOLdK6.png)](https://addons.mozilla.org/firefox/addon/firestore-manager/?src=external-github-download)
[![Get it for Chrome!](https://i.imgur.com/B0i5sn3.png)](https://github.com/FirebaseGoodies/firestore-manager/releases)

Or [try it as a web application](https://firebasegoodies.github.io/firestore-manager/manager).

[How to install?](https://github.com/AXeL-dev/install-webextension)

## Tips

<table>
  <tr align="center">
    <td>
      <img src="screenshots/tips/right_click_context_menu.png" alt="right click to open context menu"/>
    </td>
    <td>
      <img src="screenshots/tips/move_collections.png" alt="move collections"/>
    </td>
  </tr>
  <tr align="center">
    <td>
      Right click on any collection or document name to get more options
    </td>
    <td>
      Move collections using drag-n-drop
    </td>
  </tr>
  <tr align="center">
    <td colspan="2">
      <img src="screenshots/tips/json_editor_menu.png" alt="json editor menu"/>
    </td>
  </tr>
  <tr align="center">
    <td colspan="2">
      Use the json editor menu options to perform actions like auto-fix json errors, fix alignment, undo/redo changes, ...
    </td>
  </tr>
</table>

## Todo

- [x] Translations
- [x] Add collections filter (field - operator - value)
- [ ] Refactor long components code (create a module for each main component)
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
