import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const sections = document.querySelectorAll('.app-section');
const navButtons = document.querySelectorAll('.nav-btn');
const player = document.getElementById('player');
const closePlayerBtn = document.getElementById('closePlayerBtn');
const audioElement = document.getElementById('audioElement');
const compactPlayBtn = document.getElementById('compactPlayBtn');
const expandedPlayBtn = document.getElementById('expandedPlayBtn');
const progressBarContainer = document.getElementById('progressBarContainer');
const progressBarFill = document.getElementById('progressBarFill');
const timeCurrent = document.getElementById('timeCurrent');
const timeDuration = document.getElementById('timeDuration');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        
        navButtons.forEach(b => b.classList.remove('active-nav'));
        document.querySelectorAll(`[data-target="${target}"]`).forEach(b => b.classList.add('active-nav'));

        sections.forEach(sec => {
            sec.classList.add('hidden');
            if(sec.id === `section-${target}`) sec.classList.remove('hidden');
        });
        
        if(target === 'playlist') renderPlaylist();
        if(target === 'home') loadHomeSongs();
    });
});

player.addEventListener('click', (e) => {
    if(e.target.closest('#compactPlayBtn') || e.target.closest('#closePlayerBtn') || e.target.closest('#progressBarContainer')) {
        return;
    }
    player.classList.add('fullscreen-active');
});

closePlayerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    player.classList.remove('fullscreen-active');
});

function toggleAudio() {
    if(!audioElement.src || audioElement.src === window.location.href) {
        alert("Please select a track first!");
        return;
    }
    
    if(audioElement.paused) {
        audioElement.play().then(() => {
            updateUIPlaybackState(true);
        }).catch(err => console.error(err));
    } else {
        audioElement.pause();
        updateUIPlaybackState(false);
    }
}

function updateUIPlaybackState(isPlaying) {
    const symbolStr = isPlaying ? "pause" : "play_arrow";
    compactPlayBtn.querySelector('.material-symbols-outlined').innerText = symbolStr;
    expandedPlayBtn.querySelector('.material-symbols-outlined').innerText = symbolStr;
}

compactPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleAudio(); });
expandedPlayBtn.addEventListener('click', toggleAudio);

window.loadTrack = function(title, url, artist = "Unknown Artist") {
    document.getElementById('currentTitle').innerText = title;
    document.getElementById('currentArtist').innerText = artist;
    document.getElementById('expandedTitle').innerText = title;
    document.getElementById('expandedArtist').innerText = artist;
    
    audioElement.src = url;
    audioElement.play().then(() => {
        updateUIPlaybackState(true);
    }).catch(err => console.error(err));
};

audioElement.addEventListener('timeupdate', () => {
    if(!audioElement.duration) return;
    const trackingRatio = (audioElement.currentTime / audioElement.duration) * 100;
    progressBarFill.style.width = `${trackingRatio}%`;
    timeCurrent.innerText = parseSeconds(audioElement.currentTime);
    timeDuration.innerText = parseSeconds(audioElement.duration);
});

audioElement.addEventListener('ended', () => {
    updateUIPlaybackState(false);
    progressBarFill.style.width = `0%`;
    timeCurrent.innerText = "0:00";
});

function parseSeconds(secs) {
    if(isNaN(secs)) return "0:00";
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

progressBarContainer.addEventListener('click', (e) => {
    const elementWidth = progressBarContainer.clientWidth;
    const trackingCoordX = e.offsetX;
    const duration = audioElement.duration;
    if(duration) {
        audioElement.currentTime = (trackingCoordX / elementWidth) * duration;
    }
});

const themeSelect = document.getElementById('themeSelect');

if (themeSelect) {
    const savedTheme = localStorage.getItem('sk_theme') || 'dark';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);

    themeSelect.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        applyTheme(selectedTheme);
        localStorage.setItem('sk_theme', selectedTheme);
    });
}

function applyTheme(themeName) {
    if (themeName === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

document.getElementById('backupBtn').addEventListener('click', () => {
    const backupFileContent = JSON.stringify(localStorage);
    const blobPayload = new Blob([backupFileContent], { type: 'application/json' });
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = URL.createObjectURL(blobPayload);
    downloadAnchor.download = 'sk_player_backup.json';
    downloadAnchor.click();
});

const importLinks = document.getElementById('importLinks');
const playlistContainer = document.getElementById('playlistContainer');

let localPlaylist = JSON.parse(localStorage.getItem('sk_playlist')) || [];

function renderPlaylist() {
    if(!playlistContainer) return;
    playlistContainer.innerHTML = '';
    
    if (localPlaylist.length === 0) {
        playlistContainer.innerHTML = '<p class="text-sm text-on-surface-variant p-4 glass-card rounded-xl text-center">No tracks imported yet.</p>';
        return;
    }

    localPlaylist.forEach((song) => {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'glass-card p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-white/10 transition-all border border-white/5';
        
        trackDiv.innerHTML = `
            <div class="flex items-center gap-4 overflow-hidden">
                <div class="w-10 h-10 rounded bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                    <span class="material-symbols-outlined text-xl">music_note</span>
                </div>
                <div class="overflow-hidden">
                    <h4 class="text-sm font-bold text-on-surface truncate">${song.name}</h4>
                    <p class="text-xs text-on-surface-variant truncate">${song.isLocal ? 'Local Session Audio' : 'Cloud Stream Link'}</p>
                </div>
            </div>
            <button class="material-symbols-outlined text-primary hover:scale-110 transition-transform">play_circle</button>
        `;

        trackDiv.addEventListener('click', () => {
            window.loadTrack(song.name, song.url, song.isLocal ? 'Local Session' : 'Cloud Stream');
        });

        playlistContainer.appendChild(trackDiv);
    });
}

if (document.getElementById('section-playlist') && !document.getElementById('section-playlist').classList.contains('hidden')) {
    renderPlaylist();
}

if (importLinks) {
    importLinks.addEventListener('change', (e) => {
        const files = e.target.files;
        if (!files.length) return;

        Array.from(files).forEach(file => {
            if (file.type === "text/plain") {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const lines = e.target.result.split('\n').filter(line => line.trim() !== '');
                    lines.forEach((line) => {
                        localPlaylist.push({ 
                            name: `Imported Stream ${Math.floor(Math.random() * 1000)}`, 
                            url: line.trim(),
                            isLocal: false
                        });
                    });
                    localStorage.setItem('sk_playlist', JSON.stringify(localPlaylist.filter(s => !s.isLocal)));
                    renderPlaylist();
                };
                reader.readAsText(file);
            } 
            else if (file.type.startsWith("audio/")) {
                const fileURL = URL.createObjectURL(file);
                localPlaylist.push({ 
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    url: fileURL,
                    isLocal: true 
                });
                renderPlaylist();
            }
        });
        
        importLinks.value = '';
    });
}

const supportForm = document.getElementById('supportForm');
if(supportForm) {
    supportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = supportForm.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = "Sending...";

        try {
            await addDoc(collection(db, "support"), {
                name: document.getElementById('supportName').value,
                email: document.getElementById('supportEmail').value,
                message: document.getElementById('supportComment').value,
                timestamp: new Date()
            });
            alert('Message sent successfully!');
            supportForm.reset();
        } catch (error) {
            console.error(error);
            alert('Error sending message. Please try again.');
        } finally {
            btn.innerText = "Send Message";
        }
    });
}

async function loadHomeSongs() {
    const homeGrid = document.getElementById('homeSongGrid');
    if(!homeGrid) return;

    try {
        const q = query(collection(db, "songs"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        homeGrid.innerHTML = '';
        
        if(querySnapshot.empty) {
            homeGrid.innerHTML = '<p class="text-on-surface-variant">No recently uploaded songs found.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const card = document.createElement('div');
            card.className = 'glass-card flex items-center gap-4 p-3 rounded group hover:bg-white/20 transition-all cursor-pointer overflow-hidden border border-white/5';
            
            const coverImg = data.coverURL && data.coverURL !== 'default-cover.jpg' ? data.coverURL : 'https://via.placeholder.com/150/00A3FF/131313?text=Music';

            card.innerHTML = `
                <div class="h-16 w-16 flex-shrink-0 rounded overflow-hidden">
                    <img class="h-full w-full object-cover group-hover:scale-110 transition-transform" src="${coverImg}" alt="Cover">
                </div>
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-bold text-on-surface truncate">${data.title}</h4>
                    <p class="text-xs text-on-surface-variant truncate">${data.artist || 'Unknown'}</p>
                </div>
                <div class="pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined text-primary">play_circle</span>
                </div>
            `;

            card.addEventListener('click', () => {
                window.loadTrack(data.title, data.audioURL, data.artist);
            });

            homeGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Firebase error: ", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadHomeSongs();
});