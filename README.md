# Apple Music Mini Player (macOS)

A desktop mini-player for Apple Music built using Electron, featuring real-time track updates, dynamic UI, and playback controls.

---

## Features

- Displays currently playing track (name, artist, album)
- Real-time progress tracking
- Dynamic UI theme based on album artwork
- Play / Pause / Next / Previous controls
- Always-on-top floating mini-player
- Built with web technologies (HTML, CSS, JavaScript)

---

## Tech Stack

- Electron – Desktop app framework  
- JavaScript (Node.js) – Backend logic  
- HTML/CSS – UI  
- AppleScript (macOS) – Fetching Apple Music data  
- iTunes Search API – Album artwork  

---

## How It Works

1. Uses AppleScript to fetch:
   - current track
   - artist
   - album
   - playback position

2. Sends data from main process to renderer process via IPC

3. Renderer updates:
   - UI text
   - progress bar
   - album artwork
   - color theme

4. Artwork is fetched via iTunes API

---

## Setup & Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/your-username/apple-music-mini-player.git
cd apple-music-mini-player
