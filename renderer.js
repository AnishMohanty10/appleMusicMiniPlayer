const { ipcRenderer } = require("electron");

let lastTrackId = "";
let isPinned = true;

ipcRenderer.on("track-update", (event, data) => {
    const album = document.getElementById("album");
    const title = document.getElementById("song-title");
    const playIcon = document.getElementById("play-icon");

    title.textContent = data.name;
    title.textContent = data.name;

    if (data.art) {
        if (album.src !== data.art) {
            album.src = data.art;
            applyColorTheme(data.art);
            album.style.display = "block";
        }
    } else {
        album.src = "";
        album.style.display = "none";
        document.getElementById("card").style.background = "rgba(210, 180, 255, 0.35)"; // Default background
    }

    playIcon.src = data.isPlaying ? "icons/pause-ios.svg" : "icons/play-ios.svg";
    const pct = (data.position / data.duration) * 100;
    document.getElementById("progress-fill").style.width = pct + "%";
});

function applyColorTheme(url) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        document.getElementById("card").style.background = `rgba(${r + 50}, ${g + 50}, ${b + 50}, 0.35)`;
    };
}

document.getElementById("pin-btn").addEventListener("click", function () {
    isPinned = !isPinned;


    this.classList.toggle("active", isPinned);


    this.innerText = isPinned ? "📌" : "📍";

    ipcRenderer.send("toggle-always-on-top", isPinned);
});

document.getElementById("play").addEventListener("click", () => ipcRenderer.send("music-playpause"));
document.getElementById("next").addEventListener("click", () => ipcRenderer.send("music-next"));
document.getElementById("prev").addEventListener("click", () => ipcRenderer.send("music-prev"));