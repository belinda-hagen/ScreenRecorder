# Screen Recorder

A simple desktop screen recording application built with Electron.

## Download

Download the latest release from the [Releases](https://github.com/belinda-hagen/ScreenRecorder/releases) page.

**Available formats:**
- **Windows**: `.exe` installer or portable version
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` or `.deb` package

## Features

- Record your entire screen or specific windows
- Capture system audio and microphone input
- Live preview while recording
- Pause and resume recordings
- Save recordings as WebM files

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

To create distributable packages:

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Built files will be in the `dist` folder.

## Usage

1. Select a screen source from the list
2. Toggle audio options (System audio / Microphone)
3. Click **Start Recording** to begin
4. Use **Pause** to pause/resume the recording
5. Click **Stop** to finish and save your recording

## Tech Stack

- Electron
- HTML/CSS/JavaScript
- MediaRecorder API

## License

ISC