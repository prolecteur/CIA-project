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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Firestore references
const dossiersRef = db.collection('dossiers');
const documentsRef = db.collection('documents');
const imagesRef = db.collection('images');
const usersRef = db.collection('users');
