import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const userEmailDisplay = document.getElementById('userEmailDisplay');

// Dynamic Identity State Listener Configuration
onAuthStateChanged(auth, (user) => {
    if (user) {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userEmailDisplay.innerText = user.email;
        // Trigger safe event loop for operational systems execution
        window.dispatchEvent(new CustomEvent('authSuccess'));
    } else {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

// Structural Form Request Authentication Loop
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert('Authentication Pipeline Fault: ' + error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
});