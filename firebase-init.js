// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU0wnT-ZrDCfAM05GMGSLhPHM0YnZ5HLs",
  authDomain: "cia-project-ddaba.firebaseapp.com",
  databaseURL: "https://cia-project-ddaba-default-rtdb.firebaseio.com",
  projectId: "cia-project-ddaba",
  storageBucket: "cia-project-ddaba.firebasestorage.app",
  messagingSenderId: "880397465769",
  appId: "1:880397465769:web:d83d99e168a22761d891b8"
};

// Wait for Firebase SDK to load
let firebaseInitialized = false;
let initAttempts = 0;

function initFirebase() {
    initAttempts++;
    
    if (typeof firebase === 'undefined' || !firebase.initializeApp) {
        if (initAttempts < 30) {
            setTimeout(initFirebase, 200);
        } else {
            console.error('❌ Firebase SDK failed to load after 6 seconds');
        }
        return;
    }
    
    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        firebaseInitialized = true;
        console.log('✓ Firebase initialized');
    } catch(e) {
        if (!e.message.includes('already exists')) {
            console.error('Firebase init error:', e);
        } else {
            firebaseInitialized = true;
            console.log('✓ Firebase already initialized');
        }
    }
}

// Start initialization
setTimeout(initFirebase, 100);
