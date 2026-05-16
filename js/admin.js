import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const fake404 = document.getElementById('fake-404');
const adminDashboard = document.getElementById('admin-dashboard');
const secretTrigger = document.getElementById('secret-trigger');

let clickCount = 0;
let clickTimer;

if(secretTrigger) {
    secretTrigger.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        
        if (clickCount >= 5) {
            fake404.style.display = 'none';
            adminDashboard.classList.remove('hidden');
            loadManageSongs();
            loadSupportMessages();
        }

        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 2000);
    });
}

const tabs = document.querySelectorAll('.admin-tab');
const sections = document.querySelectorAll('.admin-section');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        
        tabs.forEach(t => {
            t.classList.remove('bg-[#00A3FF]/20', 'text-[#00A3FF]', 'border', 'border-[#00A3FF]/30');
            t.classList.add('text-gray-400');
        });
        
        tab.classList.remove('text-gray-400');
        tab.classList.add('bg-[#00A3FF]/20', 'text-[#00A3FF]', 'border', 'border-[#00A3FF]/30');

        sections.forEach(sec => {
            sec.classList.add('hidden');
            sec.classList.remove('block');
            if(sec.id === `sec-${target}`) {
                sec.classList.add('block');
                sec.classList.remove('hidden');
            }
        });
    });
});

const btnUpload = document.getElementById('btn-upload');
if(btnUpload) {
    btnUpload.addEventListener('click', async () => {
        const title = document.getElementById('up-title').value;
        const artist = document.getElementById('up-artist').value;
        const cover = document.getElementById('up-cover').value || "default-cover.jpg";
        const audio = document.getElementById('up-audio').value;
        
        if(title && audio) {
            btnUpload.innerText = "Uploading...";
            try {
                await addDoc(collection(db, "songs"), {
                    title: title,
                    artist: artist || "Unknown Artist",
                    coverURL: cover,
                    audioURL: audio,
                    timestamp: new Date()
                });
                alert('Track Published Successfully!');
                document.getElementById('up-title').value = '';
                document.getElementById('up-artist').value = '';
                document.getElementById('up-cover').value = '';
                document.getElementById('up-audio').value = '';
                btnUpload.innerText = "Publish to Firebase";
                loadManageSongs(); 
            } catch (e) {
                console.error("Error adding document: ", e);
                alert("Upload failed! Please try again.");
                btnUpload.innerText = "Publish to Firebase";
            }
        } else {
            alert("Title and Audio URL are required!");
        }
    });
}

async function loadManageSongs() {
    const list = document.getElementById('manage-list');
    if(!list) return;
    list.innerHTML = '<p class="text-gray-400">Loading library...</p>';
    
    try {
        const q = query(collection(db, "songs"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        list.innerHTML = '';
        
        if (querySnapshot.empty) {
            list.innerHTML = '<p class="text-gray-400">No tracks found. Upload some!</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = 'glass-card p-4 rounded-lg flex justify-between items-center bg-white/5 border border-white/10';
            
            div.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-bold text-white">${data.title}</span>
                    <span class="text-xs text-gray-400">${data.artist}</span>
                </div>
                <button class="delete-song-btn bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm hover:bg-red-500 hover:text-white transition-all" data-id="${docSnap.id}">Delete</button>
            `;
            list.appendChild(div);
        });

        // Fixed Delete Logic
        document.querySelectorAll('.delete-song-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(confirm("Are you sure you want to delete this song?")) {
                    e.currentTarget.innerText = "Deleting...";
                    await deleteDoc(doc(db, "songs", id));
                    loadManageSongs();
                }
            });
        });

    } catch(e) {
        console.error(e);
        list.innerHTML = `<p class="text-red-400">Error loading data.</p>`;
    }
}

async function loadSupportMessages() {
    const list = document.getElementById('support-list');
    if(!list) return;
    list.innerHTML = '<p class="text-gray-400">Checking messages...</p>';
    
    try {
        const q = query(collection(db, "support"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        list.innerHTML = '';
        
        if (querySnapshot.empty) {
            list.innerHTML = '<p class="text-gray-400 col-span-2">No support messages yet.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = 'glass-card p-5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2';
            
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-[#00A3FF]">${data.name}</h4>
                    <button class="delete-msg-btn text-gray-500 hover:text-red-400" data-id="${docSnap.id}"><span class="material-symbols-outlined text-sm pointer-events-none">delete</span></button>
                </div>
                <p class="text-xs text-gray-400">${data.email}</p>
                <div class="mt-2 text-sm text-white bg-black/30 p-3 rounded-lg border border-white/5">
                    ${data.message}
                </div>
            `;
            list.appendChild(div);
        });

        // Fixed Delete Logic for Messages
        document.querySelectorAll('.delete-msg-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(confirm("Are you sure you want to delete this message?")) {
                    await deleteDoc(doc(db, "support", id));
                    loadSupportMessages();
                }
            });
        });

    } catch(e) {
        console.error(e);
        list.innerHTML = `<p class="text-red-400">Error loading messages.</p>`;
    }
}