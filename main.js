const { app, BrowserWindow, ipcMain, protocol } = require("electron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

let win;
let lastTrackId = "";
let cachedArt = "";


const artPath = path.join(app.getPath("userData"), "current_art.jpg");

function createWindow() {
    win = new BrowserWindow({
        width: 260,
        height: 360,
        frame: false,
        transparent: true,
        vibrancy: "sidebar",
        visualEffectState: "active",
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    win.setAlwaysOnTop(true, "screen-saver");
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.loadFile("index.html");

    setInterval(getAppleMusicTrack, 800);
}

// ========== APPLE MUSIC DATA ==========



// Helper for strict matching
function normalize(str) {
    if (!str) return "";
    return str.toLowerCase()
        .replace(/[^\w\s]/g, '') // remove punctuation
        .replace(/\s+/g, ' ')    // collapse spaces
        .trim();
}

function fetchArtwork(trackId, artist, album) {
    const script = `
        set artPath to "${artPath}"
        tell application "Music"
            try
                if (count of artworks of current track) < 1 then
                    return "no_art"
                end if
                
                set rawData to raw data of artwork 1 of current track
                set fileRef to open for access POSIX file artPath with write permission
                set eof fileRef to 0
                write rawData to fileRef
                close access fileRef
                return "success"
            on error e
                try
                    close access file artPath
                end try
                return "error"
            end try
        end tell
    `;

    exec(`osascript -e '${script}'`, (err, out) => {
        if (!err && out.trim() === "success") {
            cachedArt = `file://${artPath}?t=${Date.now()}`;
            getAppleMusicTrack();
        } else {
            // Smart Fallback
            const term = `${trackId.replace("::", " ")}`;
            fetchOnlineArtwork(term, artist, album);
        }
    });
}

async function fetchOnlineArtwork(term, targetArtist, targetAlbum) {
    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const normArtist = normalize(targetArtist);
            const normAlbum = normalize(targetAlbum);

            const bestMatch = data.results.find(result => {
                const resArtist = normalize(result.artistName);
                const resAlbum = normalize(result.collectionName);

                // Strict Check: Artist MUST match, Album MUST match (contains logic allowed)
                const artistMatch = resArtist.includes(normArtist) || normArtist.includes(resArtist);
                const albumMatch = resAlbum.includes(normAlbum) || normAlbum.includes(resAlbum);

                return artistMatch && albumMatch;
            });

            if (bestMatch && bestMatch.artworkUrl100) {
                cachedArt = bestMatch.artworkUrl100.replace("100x100", "600x600");
            } else {
                console.log("No strict match found for:", targetArtist, targetAlbum);
                cachedArt = "";
            }
        } else {
            cachedArt = "";
        }
    } catch (error) {
        console.error("iTunes API Error:", error);
        cachedArt = "";
    }
    getAppleMusicTrack();
}

function getAppleMusicTrack() {
    // We use || as a delimiter
    const script = `
        tell application "Music"
            if player state is playing then
                set tName to name of current track
                set tArtist to artist of current track
                set tAlbum to album of current track
                set tPos to player position
                set tDur to duration of current track
                set tState to player state
                return tName & "||" & tArtist & "||" & tAlbum & "||" & tPos & "||" & tDur & "||" & tState
            else
                return "paused"
            end if
        end tell
    `;

    exec(`osascript -e '${script}'`, (err, out) => {
        if (err) return;
        const output = out.trim();
        if (output === "paused" || output === "") return;

        const [name, artist, album, pos, dur, state] = output.split("||");
        const trackId = `${name}::${artist}`;

        if (trackId !== lastTrackId) {
            lastTrackId = trackId;
            fetchArtwork(trackId, artist, album);
        }

        if (win) {
            win.webContents.send("track-update", {
                name, artist, album,
                art: cachedArt,
                position: parseFloat(pos),
                duration: parseFloat(dur),
                isPlaying: state === "playing"
            });
        }
    });
}

// ========== IPC HANDLERS ==========

ipcMain.on("music-playpause", () => exec(`osascript -e 'tell application "Music" to playpause'`));
ipcMain.on("music-next", () => exec(`osascript -e 'tell application "Music" to next track'`));
ipcMain.on("music-prev", () => exec(`osascript -e 'tell application "Music" to previous track'`));

ipcMain.on("toggle-always-on-top", (event, isPinned) => {
    if (win) {
        if (isPinned) {
            win.setAlwaysOnTop(true, "screen-saver");
            win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        } else {
            win.setAlwaysOnTop(false, "normal");
            win.setVisibleOnAllWorkspaces(false);
            win.hide();
            setTimeout(() => win.show(), 10);
        }
    }
});

ipcMain.on("set-opacity", (event, opacity) => {
    if (win) win.setOpacity(opacity);
});



app.whenReady().then(() => {

    protocol.registerFileProtocol('file', (request, callback) => {
        const pathname = decodeURI(request.url.replace('file://', ''));
        callback(pathname);
    });

    createWindow();
});