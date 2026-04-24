# client-side-qr-code-generator

Private, client-side QR code generator for links, files, text, contacts, and quick actions like SMS, email, and phone.

Live demo: [https://jawwadfirdousi.github.io/client-side-qr-code-generator](https://jawwadfirdousi.github.io/client-side-qr-code-generator)

## Overview

This project is a static, in-browser QR code generator built with plain HTML, CSS, and JavaScript.

All QR payloads are generated on the client side. The app does not submit form data to a backend, set cookies, or load analytics scripts.

Note: if you host the site on GitHub Pages or another static host, the host may still keep standard request logs for page visits. The generator itself does not send the QR content you create to an application server because this project does not include one.

## Supported QR Types

- URL
- PDF URL
- Contact (`vCard`)
- Plain Text
- App Link / Deep Link
- SMS
- Email
- Phone

## Features

- Single-page interface with mode switching
- Instant QR generation in the browser
- Payload preview for every generated code
- No backend required
- Published on GitHub Pages

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- [`qrcode-generator`](https://www.npmjs.com/package/qrcode-generator)

## Local Development

### Install dependencies

```bash
npm install
```

### Start the local server

```bash
npm start
```

The app runs locally at:

`http://127.0.0.1:4173`

## Project Structure

```text
.
├── .github/workflows/deploy-pages.yml
├── app.js
├── index.html
├── styles.css
├── package.json
└── README.md
```

## Privacy Positioning

This app is intentionally branded as private-by-default:

- QR content is generated in-browser
- No form submission to an app backend
- No cookies
- No analytics scripts