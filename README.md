<p align="center">
  <img src="icon.png" alt="Screen Recorder Icon" width="128" height="128">
</p>

<h1 align="center">Screen Recorder</h1>

<p align="center">
  A simple, elegant desktop screen recording application built with Electron
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.2.0-667eea?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/electron-39.2.7-764ba2?style=for-the-badge&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/platform-Windows-4ade80?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-fbbf24?style=for-the-badge" alt="License">
</p>

<p align="center">
  <a href="https://github.com/belinda-hagen/ScreenRecorder/releases">
    <img src="https://img.shields.io/github/downloads/belinda-hagen/ScreenRecorder/total?style=for-the-badge&color=ef4444&label=Downloads" alt="Downloads">
  </a>
  <a href="https://github.com/belinda-hagen/ScreenRecorder/releases/latest">
    <img src="https://img.shields.io/github/release/belinda-hagen/ScreenRecorder?style=for-the-badge&color=22c55e&label=Latest" alt="Latest Release">
  </a>
</p>

---

## Features

- Record your entire screen or specific windows
- Capture system audio and microphone input
- Live preview while recording
- Pause and resume recordings
- Save recordings as WebM files
- Modern, beautiful purple-themed UI

## Download

Download the latest release from the [Releases](https://github.com/belinda-hagen/ScreenRecorder/releases) page.

**Available for:**
- **Windows**: `.exe` portable version

> **Note**: Currently only Windows builds are available. macOS and Linux users can build from source (see Development section below).

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/belinda-hagen/ScreenRecorder.git
cd ScreenRecorder
```

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
npm start
```

### Building

To create distributable packages for your current platform:

```bash
npm run build
```

To build for a specific platform:

```bash
# Windows
npm run build:win

# macOS (requires macOS)
npm run build:mac

# Linux
npm run build:linux
```

Built files will be in the `dist` folder.

> **Note**: Cross-platform building has limitations. Building macOS apps requires a Mac. Windows and Linux can often be cross-compiled, but native builds are recommended.

## Usage

1. Select a screen source from the list
2. Toggle audio options (System audio / Microphone)
3. Click **Start Recording** to begin
4. Use **Pause** to pause/resume the recording
5. Click **Stop** to finish and save your recording

## Tech Stack

- **Electron** - Cross-platform desktop apps
- **HTML/CSS/JavaScript** - Frontend
- **MediaRecorder API** - Screen capture

## License

MIT License - feel free to use this project for personal or commercial purposes.
