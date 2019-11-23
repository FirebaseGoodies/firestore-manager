# <img src="src/assets/images/firestore_logo.png" alt="icon" width="38"/> Firestore Manager

[![Mozilla Add-on version](https://img.shields.io/amo/v/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/?src=external-github-shield-downloads)
[![Mozilla Add-on downloads](https://img.shields.io/amo/dw/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/?src=external-github-shield-downloads)
[![Mozilla Add-on users](https://img.shields.io/amo/users/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/statistics/)
[![Mozilla Add-on stars](https://img.shields.io/amo/stars/firestore-manager.svg)](https://addons.mozilla.org/firefox/addon/firestore-manager/reviews/)

A simple, fast and intuitive web-extension to manage firestore databases, made with [Angular](https://github.com/angular).

![screenshot](screenshots/popup.png)

> **Warning:** This project is still work in progress & may not be suited for production use.

## Features

- Clean UI (based on [ng-zorro-antd](https://github.com/NG-ZORRO/ng-zorro-antd)).
- 3 editing modes (thanks to [jsoneditor](https://github.com/josdejong/jsoneditor) project).
- Powerful diff viewer (using [diff-match-patch](https://github.com/google/diff-match-patch) & [diff2html](https://github.com/rtfpessoa/diff2html)).

## Installation

[![Get it for Firefox!](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png)](https://addons.mozilla.org/firefox/addon/firestore-manager/?src=external-github-download)
[![Get it for Chrome!](https://raw.githubusercontent.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton_small.png)](screenshots/soon.gif)

Or [try it as a web application](https://axel-dev.github.io/firestore-manager/manager).

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Todo

- [x] Translations
- [ ] Handle sub-collections
- [ ] Add filter for documents (field - operator - value)

## License

Firestore Manager is licensed under the [MPL2](LICENSE) license.
