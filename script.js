/* ============================================
   CLASSIFIED ARCHIVE DATABASE - JAVASCRIPT
   Interactions & Animations + Authentication
   With Firebase Firestore Integration
   ============================================ */

// Local Storage & Firebase Management
const DOSSIER_KEY = 'classifiedDossiers';
const DOCUMENTS_KEY = 'classifiedDocuments';
const IMAGES_KEY = 'classifiedImages';
const AUTH_KEY = 'archiveAuth';

// Admin Credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Firebase reference (initialized in firebase-init.js)
let firebaseReady = false;
let firestoreDb = null;

// Check if Firebase is ready
function checkFirebaseReady() {
    // Ensure Firebase SDK is loaded and an app has been initialized before accessing Firestore
    if (typeof firebase !== 'undefined' && firebase.firestore && Array.isArray(firebase.apps) && firebase.apps.length > 0) {
        try {
            firestoreDb = firebase.firestore();
            // optional: storage reference
            try { firestoreStorage = firebase.storage(); } catch (e) { console.warn('Firebase storage not available yet', e); }
            firebaseReady = true;
            console.log('✓ Firebase Firestore ready');
            return true;
        } catch (e) {
            console.warn('Firebase exists but could not access Firestore yet:', e);
            return false;
        }
    }
    return false;
}

// Helper: convert dataURL to Blob
function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',');
    const meta = parts[0];
    const content = parts[1];
    const isBase64 = meta.indexOf('base64') !== -1;
    const mime = meta.split(':')[1].split(';')[0];
    let byteString;
    if (isBase64) {
        byteString = atob(content);
    } else {
        byteString = decodeURIComponent(content);
    }
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ia], { type: mime });
}

// Initialize Storage
function initializeStorage() {
    if (!localStorage.getItem(DOSSIER_KEY)) {
        localStorage.setItem(DOSSIER_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(DOCUMENTS_KEY)) {
        localStorage.setItem(DOCUMENTS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(IMAGES_KEY)) {
        localStorage.setItem(IMAGES_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(AUTH_KEY)) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(null));
    }
    
    // Try to initialize Firebase
    if (!firebaseReady) {
        checkFirebaseReady();
    }
}

// ============ AUTHENTICATION ============

function getCurrentUser() {
    const auth = localStorage.getItem(AUTH_KEY);
    return auth ? JSON.parse(auth) : null;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

function isAuthenticated() {
    return getCurrentUser() !== null;
}

function authenticate() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const auth = {
            username: username,
            role: 'admin',
            loginTime: new Date().toISOString()
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
        window.location.href = 'archive.html';
    } else {
        alert('❌ AUTHENTICATION FAILED\nIncorrect credentials');
        document.getElementById('password').value = '';
    }
}

function enterAsGuest() {
    const auth = {
        username: 'GUEST',
        role: 'guest',
        loginTime: new Date().toISOString()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    window.location.href = 'archive.html';
}

function logout() {
    localStorage.setItem(AUTH_KEY, JSON.stringify(null));
    window.location.href = 'index.html';
}

// ============ ACCESS CONTROL ============

function checkAuthAndLoadArchive() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = getCurrentUser();
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
        userInfoEl.innerHTML = `<span style="color: var(--color-olive); font-size: 0.75rem; margin-top: 0.5rem; display: block;">USER: ${user.username.toUpperCase()} | ROLE: ${user.role.toUpperCase()}</span>`;
    }
    
    // Show admin button only for admins
    const adminBtn = document.getElementById('adminPanelBtn');
    const addBtn = document.getElementById('addDossierBtn');
    if (isAdmin()) {
        if (adminBtn) adminBtn.style.display = 'inline-block';
        if (addBtn) addBtn.style.display = 'inline-block';
    }
    
    loadDossiers();
}

function verifyAdminAccess() {
    if (!isAdmin()) {
        alert('❌ ACCESS DENIED\nAdmin access required');
        window.location.href = 'archive.html';
        return false;
    }
    return true;
}

function checkAdminAccess() {
    if (isAdmin()) {
        alert('✓ VERIFIED\nAdmin privileges confirmed');
    } else {
        alert('❌ INSUFFICIENT PRIVILEGES\nAdmin access required');
    }
}

// DOSSIER OPERATIONS

async function getAllDossiers() {
    // Use local storage as a safe default
    const localDossiers = JSON.parse(localStorage.getItem(DOSSIER_KEY)) || [];

    // Try Firestore and merge only when it returns documents
    if (firebaseReady && firestoreDb) {
        try {
            const snapshot = await firestoreDb.collection('dossiers').get();
            if (!snapshot.empty) {
                const dossiers = [];
                snapshot.forEach(doc => {
                    dossiers.push({id: doc.id, ...doc.data()});
                });
                localStorage.setItem(DOSSIER_KEY, JSON.stringify(dossiers));
                return dossiers;
            } else {
                // Firestore returned no documents: keep local data
                console.log('Firestore returned no dossiers; using local storage');
                return localDossiers;
            }
        } catch(e) {
            console.log('Firestore unavailable:', e);
            return localDossiers;
        }
    }

    return localDossiers;
}

function saveDossiers(dossiers) {
    localStorage.setItem(DOSSIER_KEY, JSON.stringify(dossiers));
}

async function addDossier(dossier) {
    dossier.id = 'DOS-' + Date.now();
    dossier.createdDate = formatDate(new Date());

    // Save to Firestore (best-effort)
    if (firebaseReady && firestoreDb) {
        try {
            await firestoreDb.collection('dossiers').doc(dossier.id).set(dossier);
            console.log('✓ Dossier saved to Firestore', dossier.id);
        } catch(e) {
            console.log('Firestore save failed:', e);
        }
    }

    // Ensure we read the current list (await async function)
    const dossiers = await getAllDossiers();
    // If getAllDossiers returned null/undefined for any reason, fallback to array
    const list = Array.isArray(dossiers) ? dossiers : [];
    list.push(dossier);
    saveDossiers(list);
    console.log('✓ Dossier saved to localStorage', dossier.id);
    return dossier.id;
}

function getDossier(id) {
    const dossiers = JSON.parse(localStorage.getItem(DOSSIER_KEY)) || [];
    return dossiers.find(d => d.id === id);
}

async function updateDossier(id, updatedData) {
    const dossiers = JSON.parse(localStorage.getItem(DOSSIER_KEY)) || [];
    const index = dossiers.findIndex(d => d.id === id);
    if (index !== -1) {
        dossiers[index] = { ...dossiers[index], ...updatedData };
        saveDossiers(dossiers);
        
        if (firebaseReady && firestoreDb) {
            try {
                await firestoreDb.collection('dossiers').doc(id).update(updatedData);
            } catch(e) {
                console.log('Firestore update failed:', e);
            }
        }
    }
}

async function deleteDossier(id) {
    const dossiers = JSON.parse(localStorage.getItem(DOSSIER_KEY)) || [];
    const filtered = dossiers.filter(d => d.id !== id);
    saveDossiers(filtered);
    
    // Also delete associated documents and images
    const documents = JSON.parse(localStorage.getItem(DOCUMENTS_KEY)) || [];
    const filteredDocs = documents.filter(d => d.dossierId !== id);
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(filteredDocs));
    
    const images = JSON.parse(localStorage.getItem(IMAGES_KEY)) || [];
    const filteredImages = images.filter(i => i.dossierId !== id);
    localStorage.setItem(IMAGES_KEY, JSON.stringify(filteredImages));
    
    if (firebaseReady && firestoreDb) {
        try {
            await firestoreDb.collection('dossiers').doc(id).delete();
            const docsSnapshot = await firestoreDb.collection('documents')
                .where('dossierId', '==', id).get();
            docsSnapshot.forEach(doc => doc.ref.delete());
        } catch(e) {
            console.log('Firestore delete failed:', e);
        }
    }
}

// DOCUMENT OPERATIONS

function getDocumentsForDossier(dossierId) {
    const documents = JSON.parse(localStorage.getItem(DOCUMENTS_KEY)) || [];
    return documents.filter(d => d.dossierId === dossierId);
}

async function addDocument(dossierId, document) {
    // Prepare id and basic fields
    const documents = JSON.parse(localStorage.getItem(DOCUMENTS_KEY)) || [];
    document.id = 'DOC-' + Date.now();
    document.dossierId = dossierId;

    // If we have firebase and a file (data URL) we should upload to Storage and store downloadURL
    if (firebaseReady && firestoreDb && typeof firebase !== 'undefined' && firebase.storage) {
        try {
            if (document.fileName && document.content && document.content.startsWith('data:')) {
                const blob = dataURLtoBlob(document.content);
                const storageRef = firebase.storage().ref().child(`dossiers/${dossierId}/documents/${document.id}/${document.fileName}`);
                const putResult = await storageRef.put(blob);
                const downloadURL = await storageRef.getDownloadURL();
                document.downloadURL = downloadURL;
                // Remove heavy inline content to save Firestore/localStorage space
                try { delete document.content; } catch(e){}
                console.log('Uploaded document to Storage:', document.fileName, downloadURL);
            }

            // Save metadata to Firestore
            await firestoreDb.collection('documents').doc(document.id).set(document);
            console.log('✓ Document metadata saved to Firestore', document.id);
        } catch (e) {
            console.warn('Firestore/Storage save failed, will fallback to localStorage:', e);
        }
    }

    // Always keep local copy (metadata + content if present)
    documents.push(document);
    try {
        localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
    } catch (e) {
        console.error('Failed to save document to localStorage:', e);
        if (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22)) {
            // Don't throw here — localStorage may be full; we've already saved to Firestore/Storage when available.
            console.warn('LocalStorage quota exceeded; skipping local save for document', document.id);
            return document.id;
        }
        // For other errors, rethrow
        throw e;
    }
    return document.id;
}

async function updateDocument(dossierId, docId, updatedData) {
    const documents = JSON.parse(localStorage.getItem(DOCUMENTS_KEY)) || [];
    const index = documents.findIndex(d => d.dossierId === dossierId && d.id === docId);
    if (index !== -1) {
        documents[index] = { ...documents[index], ...updatedData };
        localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
        
        if (firebaseReady && firestoreDb) {
            try {
                await firestoreDb.collection('documents').doc(docId).update(updatedData);
            } catch(e) {
                console.log('Firestore update failed:', e);
            }
        }
    }
}

async function deleteDocument(dossierId, docId) {
    const documents = JSON.parse(localStorage.getItem(DOCUMENTS_KEY)) || [];
    const filtered = documents.filter(d => !(d.dossierId === dossierId && d.id === docId));
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(filtered));
    
    if (firebaseReady && firestoreDb) {
        try {
            await firestoreDb.collection('documents').doc(docId).delete();
        } catch(e) {
            console.log('Firestore delete failed:', e);
        }
    }
}

// IMAGE OPERATIONS

function getImagesForDossier(dossierId) {
    const images = JSON.parse(localStorage.getItem(IMAGES_KEY)) || [];
    return images.filter(i => i.dossierId === dossierId);
}

async function addImage(dossierId, image) {
    const images = JSON.parse(localStorage.getItem(IMAGES_KEY)) || [];
    image.id = 'IMG-' + Date.now();
    image.dossierId = dossierId;

    // If firebase available, upload image data to Storage
    if (firebaseReady && firestoreDb && typeof firebase !== 'undefined' && firebase.storage) {
        try {
            if (image.data && image.data.startsWith('data:')) {
                const blob = dataURLtoBlob(image.data);
                const storageRef = firebase.storage().ref().child(`dossiers/${dossierId}/images/${image.id}/${image.code || 'image'}`);
                await storageRef.put(blob);
                const downloadURL = await storageRef.getDownloadURL();
                image.downloadURL = downloadURL;
                try { delete image.data; } catch(e){}
                console.log('Uploaded image to Storage:', image.code || image.id, downloadURL);
            }

            // Save metadata to Firestore
            await firestoreDb.collection('images').doc(image.id).set(image);
            console.log('✓ Image metadata saved to Firestore', image.id);
        } catch (e) {
            console.warn('Firestore/Storage save failed, will fallback to localStorage:', e);
        }
    }

    // Always save locally as fallback
    images.push(image);
    try {
        localStorage.setItem(IMAGES_KEY, JSON.stringify(images));
    } catch (e) {
        console.error('Failed to save image to localStorage:', e);
        if (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22)) {
            console.warn('LocalStorage quota exceeded; skipping local save for image', image.id);
            return image.id;
        }
        throw e;
    }
    return image.id;
}

// TERMINAL EFFECTS

function createTypingAnimation(elements) {
    elements.forEach(element => {
        if (element.classList.contains('typing')) {
            const text = element.textContent;
            element.textContent = '';
            let index = 0;
            
            const interval = setInterval(() => {
                if (index < text.length) {
                    element.textContent += text[index];
                    index++;
                } else {
                    clearInterval(interval);
                }
            }, 30);
        }
    });
}

function initTerminalAnimation() {
    const typingElements = document.querySelectorAll('.typing');
    createTypingAnimation(typingElements);
}

// LOAD & DISPLAY DOSSIERS

async function loadDossiers() {
    const container = document.getElementById('dossierContainer');
    if (!container) return;
    
    const dossiers = await getAllDossiers();
    const emptyMsg = document.getElementById('emptyMessage');
    
    if (dossiers.length === 0) {
        container.innerHTML = '<div class="empty-message"><p>NO DOSSIERS AVAILABLE</p><p style="font-size: 0.8rem; color: var(--color-text);">Contact administrator to create classified records</p></div>';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    
    if (emptyMsg) emptyMsg.style.display = 'none';
    
    container.innerHTML = dossiers.map(dossier => `
        <div class="folder-placeholder">
            ${isAdmin() ? `
                <button class="folder-delete-btn" onclick="deleteDossierFromList('${dossier.id}')" title="Delete Dossier">🗑️</button>
            ` : ''}
            <div class="folder-icon">📁</div>
            <div class="folder-code">${dossier.name}</div>
            <div class="folder-date">DECLASSIFIED: ${formatDate(dossier.declassified)}</div>
            <button class="folder-button" onclick="openDossier('${dossier.id}')">OPEN</button>
        </div>
    `).join('');
    
    // Update statistics
    const totalEl = document.getElementById('totalDossiers');
    const lastEl = document.getElementById('lastUpdated');
    if (totalEl) totalEl.textContent = dossiers.length;
    if (lastEl) lastEl.textContent = new Date().toLocaleTimeString();
}

function openDossier(dossierId) {
    if (!dossierId) {
        console.error('No dossier ID provided');
        return;
    }
    window.location.href = `dossier.html?id=${dossierId}`;
}

function deleteDossierFromList(dossierId) {
    if (!isAdmin()) {
        alert('❌ ADMIN ACCESS REQUIRED');
        return;
    }
    
    const dossier = getDossier(dossierId);
    if (!dossier) {
        alert('Dossier not found');
        return;
    }
    
    if (confirm(`⚠️ DELETE DOSSIER?\n\n"${dossier.name}"\n\nAll documents and images will be deleted.\nThis action cannot be undone.`)) {
        deleteDossier(dossierId);
        alert('✓ DOSSIER DELETED');
        loadDossiers();
    }
}

function viewImage() {
    const modal = document.getElementById('imageViewerModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeImageViewer() {
    const modal = document.getElementById('imageViewerModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function editDossier() {
    if (!isAdmin()) {
        alert('❌ ADMIN ACCESS REQUIRED');
        return;
    }
    alert('EDIT MODE: Go to Admin Panel to modify dossier');
    window.location.href = 'admin.html';
}

function deleteDossierConfirm() {
    if (!isAdmin()) {
        alert('❌ ADMIN ACCESS REQUIRED');
        return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const dossierId = params.get('id');
    
    if (confirm('⚠️ DELETE DOSSIER? This action cannot be undone.')) {
        deleteDossier(dossierId);
        window.location.href = 'archive.html';
    }
}

// ADMIN PANEL

function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`tab-${tabId}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Mark button as active
    event.target.classList.add('active');
    
    // Load dossier lists for dropdowns
    if (tabId === 'add-document' || tabId === 'add-image') {
        loadDossierDropdowns();
    }
}

function switchDocTab(tabType) {
    // Hide all doc input sections
    document.querySelectorAll('.doc-input-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from buttons
    document.querySelectorAll('.doc-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    if (tabType === 'manual') {
        document.getElementById('manualInputSection').style.display = 'block';
        event.target.classList.add('active');
    } else if (tabType === 'file') {
        document.getElementById('fileInputSection').style.display = 'block';
        event.target.classList.add('active');
    }
}

// FORM HANDLERS

// FORM HANDLERS

document.addEventListener('DOMContentLoaded', function() {
    initializeStorage();
    
    // Terminal animation on home page
    if (document.querySelector('.terminal-screen')) {
        initTerminalAnimation();
    }
    
    // Allow Enter key to login
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                authenticate();
            }
        });
    }
    
    // Admin Form - Add Dossier
    const addDossierForm = document.getElementById('addDossierForm');
    if (addDossierForm) {
        addDossierForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!isAdmin()) {
                alert('❌ ADMIN ACCESS REQUIRED');
                return;
            }
            
            const dossier = {
                name: document.getElementById('dossierName').value,
                classification: document.getElementById('classificationLevel').value,
                declassified: document.getElementById('declassifiedDate').value,
                status: document.getElementById('status').value,
                description: document.getElementById('description').value,
                createdAt: new Date().toISOString()
            };
            console.log('Creating dossier:', dossier);
            await addDossier(dossier);
            alert('✓ DOSSIER CREATED SUCCESSFULLY');
            addDossierForm.reset();

            // Redirect to archive to show the new dossier
            window.location.href = 'archive.html';
        });
    }
    
    // Admin Form - Add Document (Manual Input)
    const addDocumentForm = document.getElementById('addDocumentForm');
    if (addDocumentForm) {
        addDocumentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!isAdmin()) {
                alert('❌ ADMIN ACCESS REQUIRED');
                return;
            }
            
            const dossierId = document.getElementById('selectDossier').value;
            const docObj = {
                code: document.getElementById('documentCode').value,
                content: document.getElementById('documentContent').value,
                date: document.getElementById('documentDate').value
            };
            
            await addDocument(dossierId, docObj);
            alert('✓ DOCUMENT ADDED SUCCESSFULLY');
            addDocumentForm.reset();
        });
    }
    
    // Admin Form - Add Document (File Import)
    const addDocumentFileForm = document.getElementById('addDocumentFileForm');
    if (addDocumentFileForm) {
        addDocumentFileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!isAdmin()) {
                alert('❌ ADMIN ACCESS REQUIRED');
                return;
            }
            
            const fileInput = document.getElementById('documentFile');
            const files = fileInput ? fileInput.files : null;
            console.log('Import documents handler: files object:', files);

            if (!files || files.length === 0) {
                alert('❌ Please select at least one file');
                return;
            }

            const dossierId = document.getElementById('selectDossierFile').value;
            if (!dossierId) {
                alert('❌ Please select a dossier');
                return;
            }

            let imported = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(`Processing file ${i+1}/${files.length}:`, file.name, file.type, file.size);

                // Warn if file is very large
                if (file.size && file.size > 100 * 1024 * 1024) {
                    if (!confirm(`The file "${file.name}" is larger than 100MB and may not be saved. Continue?`)) {
                        console.warn('User cancelled import for large file:', file.name);
                        continue;
                    }
                }

                // Generate a unique code per file if user left the code empty
                const baseCode = document.getElementById('documentCodeFile').value.trim();
                let documentCode = baseCode || (`DOC-${file.name.split('.')[0].toUpperCase().slice(0,15)}-${Date.now().toString().slice(-5)}`);

                // If Firebase Storage is available, upload directly to Storage to avoid localStorage quota
                if (firebaseReady && typeof firebase !== 'undefined' && firebase.storage) {
                    try {
                        const storageRef = firebase.storage().ref().child(`dossiers/${dossierId}/documents/${'DOC-' + Date.now()}/${file.name}`);
                        console.log('Uploading file to Storage:', file.name);
                        await storageRef.put(file);
                        const downloadURL = await storageRef.getDownloadURL();

                        const docObj = {
                            code: documentCode,
                            date: document.getElementById('documentDateFile').value || new Date().toISOString(),
                            fileName: file.name,
                            fileType: file.type,
                            downloadURL: downloadURL
                        };

                        const addedId = await addDocument(dossierId, docObj);
                        console.log('Document saved with Storage URL:', addedId, downloadURL);
                        imported++;
                        continue;
                    } catch (err) {
                        console.error('Upload to Firebase Storage failed for', file.name, err);
                        alert('Upload to server failed for ' + file.name + '. Aborting import.');
                        break;
                    }
                }

                // Fallback: if Firebase not available, read as dataURL/text and store locally (may fill localStorage)
                const fileContent = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = function(evt) { resolve(evt.target.result); };
                    reader.onerror = function() { console.error('Error reading file', file.name); resolve(null); };
                    // Determine if file should be read as binary/data URL (PDF, images, docs)
                    const lowerName = (file.name || '').toLowerCase();
                    const binaryExt = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.bmp'];
                    const hasBinaryExt = binaryExt.some(ext => lowerName.endsWith(ext));
                    const isImageType = file.type && file.type.startsWith('image/');
                    const isPdfType = file.type === 'application/pdf';

                    if (isPdfType || isImageType || hasBinaryExt) {
                        reader.readAsDataURL(file);
                    } else {
                        reader.readAsText(file);
                    }
                });

                if (fileContent === null) {
                    console.warn('File content is null for', file.name);
                    continue;
                }

                const docObj = {
                    code: documentCode,
                    content: fileContent,
                    date: document.getElementById('documentDateFile').value || new Date().toISOString(),
                    fileName: file.name,
                    fileType: file.type
                };

                try {
                    const addedId = await addDocument(dossierId, docObj);
                    console.log('Document saved locally:', addedId, docObj.fileName || docObj.code);
                    imported++;
                } catch (err) {
                    console.error('Document save error:', err);
                    // If quota exceeded, show a visible alert and stop processing further files
                    if (err.message && err.message.toLowerCase().includes('localstorage quota')) {
                        alert('Import stopped: localStorage is full. Try smaller files or enable server storage.');
                        break;
                    }
                }
            }

            console.log('Import result: imported count =', imported);
            alert(`✓ DOCUMENTS IMPORTED SUCCESSFULLY\nImported: ${imported} file(s)`);
            addDocumentFileForm.reset();
        });
    }
    
    // Admin Form - Add Image
    const addImageForm = document.getElementById('addImageForm');
    if (addImageForm) {
        addImageForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!isAdmin()) {
                alert('❌ ADMIN ACCESS REQUIRED');
                return;
            }
            const fileInput = document.getElementById('imageFile');
            const files = fileInput ? fileInput.files : null;
            console.log('Import images handler: files object:', files);

            if (!files || files.length === 0) {
                alert('❌ Please select at least one image');
                return;
            }

            const dossierId = document.getElementById('selectDossierImage').value;
            if (!dossierId) {
                alert('❌ Please select a dossier');
                return;
            }

            let added = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(`Processing image ${i+1}/${files.length}:`, file.name, file.type, file.size);
                if (file.size && file.size > 100 * 1024 * 1024) {
                    if (!confirm(`The image "${file.name}" is larger than 100MB and may not be saved to localStorage. Continue?`)) {
                        console.warn('User cancelled import for large image:', file.name);
                        continue;
                    }
                }
                // If Firebase Storage is available, upload image directly to Storage
                if (firebaseReady && typeof firebase !== 'undefined' && firebase.storage) {
                    try {
                        const storageRef = firebase.storage().ref().child(`dossiers/${dossierId}/images/${'IMG-' + Date.now()}/${file.name}`);
                        await storageRef.put(file);
                        const downloadURL = await storageRef.getDownloadURL();
                        const imageMeta = {
                            code: (document.getElementById('imageCode').value || file.name.split('.')[0]).toString() + `-${Date.now().toString().slice(-5)}`,
                            category: document.getElementById('imageCategory').value,
                            date: document.getElementById('imageDate').value || new Date().toISOString(),
                            fileName: file.name,
                            fileType: file.type,
                            downloadURL: downloadURL
                        };

                        await addImage(dossierId, imageMeta);
                        added++;
                        continue;
                    } catch (err) {
                        console.error('Upload to Firebase Storage failed for image', file.name, err);
                        alert('Upload to server failed for image ' + file.name + '. Aborting import.');
                        break;
                    }
                }

                // Fallback: read as data URL and store locally
                const reader = new FileReader();
                const imgData = await new Promise((resolve) => {
                    reader.onload = function(evt) { resolve(evt.target.result); };
                    reader.onerror = function() { console.error('Error reading image', file.name); resolve(null); };
                    reader.readAsDataURL(file);
                });

                if (!imgData) {
                    console.warn('Image data is null for', file.name);
                    continue;
                }

                const image = {
                    code: (document.getElementById('imageCode').value || file.name.split('.')[0]).toString() + `-${Date.now().toString().slice(-5)}`,
                    category: document.getElementById('imageCategory').value,
                    data: imgData,
                    date: document.getElementById('imageDate').value || new Date().toISOString()
                };

                try {
                    await addImage(dossierId, image);
                    added++;
                } catch (err) {
                    console.error('Image save error:', err);
                }
            }

            alert(`✓ IMAGES ADDED SUCCESSFULLY\nAdded: ${added} image(s)`);
            addImageForm.reset();
        });
    }
    
    // Close modal on background click
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('imageViewerModal');
        if (modal && e.target === modal) {
            closeImageViewer();
        }
    });
});

async function loadDossierDropdowns() {
    const dossiers = await getAllDossiers();

    const select1 = document.getElementById('selectDossier');
    const select2 = document.getElementById('selectDossierFile');
    const select3 = document.getElementById('selectDossierImage');

    const options = '<option value="">-- Choose Dossier --</option>' + 
        (Array.isArray(dossiers) ? dossiers.map(d => `<option value="${d.id}">${d.name}</option>`).join('') : '');

    if (select1) select1.innerHTML = options;
    if (select2) select2.innerHTML = options;
    if (select3) select3.innerHTML = options;
}

// SEARCH & FILTER

document.addEventListener('DOMContentLoaded', function() {
    const searchGallery = document.getElementById('searchGallery');
    if (searchGallery) {
        searchGallery.addEventListener('keyup', function(e) {
            const query = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.gallery-item-large');
            
            items.forEach(item => {
                const code = item.querySelector('.gallery-item-code').textContent.toLowerCase();
                if (code.includes(query)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
    
    const filterGallery = document.getElementById('filterGallery');
    if (filterGallery) {
        filterGallery.addEventListener('change', function(e) {
            const filter = e.target.value;
            // Filter logic implementation
            console.log('Filter:', filter);
        });
    }
});

// Utility: Redacted text placeholder
function createRedactedText(length = 10) {
    return '█'.repeat(length);
}

// Utility: Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// DOSSIER PAGE FUNCTIONS

function loadDossierPage() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const dossierId = params.get('id');
    
    if (!dossierId) {
        console.error('No dossier ID provided');
        window.location.href = 'archive.html';
        return;
    }
    
    const dossier = getDossier(dossierId);
    if (!dossier) {
        console.error('Dossier not found:', dossierId);
        alert('Dossier not found');
        window.location.href = 'archive.html';
        return;
    }
    
    // Store current dossier ID for use in other functions
    window.currentDossierId = dossierId;
    
    // Populate dossier metadata
    document.getElementById('dossierTitle').textContent = dossier.name;
    document.getElementById('dossierCode').textContent = dossier.name;
    document.getElementById('dossierClassification').textContent = dossier.classification;
    document.getElementById('dossierDate').textContent = formatDate(dossier.declassified);
    document.getElementById('dossierStatus').textContent = dossier.status;
    
    // Show admin buttons only for admins
    const adminButtons = document.getElementById('adminButtons');
    if (adminButtons && isAdmin()) {
        adminButtons.style.display = 'flex';
    }
    
    // Load and display documents list
    const documents = getDocumentsForDossier(dossierId);
    const documentsList = document.getElementById('documentsList');
    
    if (documents.length > 0) {
        const adminStatus = isAdmin();
        documentsList.innerHTML = documents.map((doc, index) => {
            const isPDF = doc.fileType === 'application/pdf' || doc.fileName?.endsWith('.pdf');
            const icon = getPdfIcon(doc.fileName || doc.code);
            
            return `
                <div class="document-list-item">
                    <div class="document-list-info">
                        <div class="document-list-icon">${icon}</div>
                        <div class="document-list-details">
                            <div class="document-list-name">${doc.code || 'Document ' + (index + 1)}</div>
                            <div class="document-list-meta">
                                ${doc.fileName ? '📁 ' + doc.fileName + ' | ' : ''}
                                Date: ${doc.date || 'N/A'}
                            </div>
                        </div>
                    </div>
                    <div class="document-list-buttons">
                        <button class="read-button" onclick="readDocument(${index}, '${dossierId}')">
                            📖 READ
                        </button>
                        ${adminStatus ? `
                            <button class="edit-button" onclick="editDocumentModal(${index}, '${dossierId}')" style="padding: 8px 12px;">
                                ✎ EDIT
                            </button>
                            <button class="delete-button" onclick="deleteDocumentConfirm(${index}, '${dossierId}')" style="padding: 8px 12px;">
                                🗑️ DEL
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        documentsList.innerHTML = '<p style="color: var(--color-text); text-align: center; padding: 20px;">No documents added yet</p>';
    }
    
    // Load and display images
    const images = getImagesForDossier(dossierId);
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (images.length > 0) {
        galleryGrid.innerHTML = images.map(img => `
            <div class="gallery-placeholder" onclick="viewImageData('${(img.downloadURL || img.data || '').replace(/'/g, "\\'")}')">
                <span class="placeholder-icon">📷</span>
                <span class="placeholder-code">${img.code}</span>
            </div>
        `).join('');
    } else {
        galleryGrid.innerHTML = '<p style="color: var(--color-text); grid-column: 1/-1; text-align: center; padding: 20px;">No images added yet</p>';
    }
}

function getPdfIcon(fileName) {
    if (!fileName) return '📄';
    const ext = fileName.split('.').pop().toLowerCase();
    
    const icons = {
        'pdf': '📕',
        'txt': '📝',
        'doc': '📘',
        'docx': '📘',
        'jpg': '🖼️',
        'png': '🖼️',
        'jpeg': '🖼️'
    };
    
    return icons[ext] || '📄';
}

function readDocument(docIndex, dossierId) {
    const documents = getDocumentsForDossier(dossierId);
    const doc = documents[docIndex];
    
    if (!doc) {
        alert('Document not found');
        return;
    }
    
    // Prefer a remote download URL if available (uploaded to Firebase Storage)
    if (doc.downloadURL) {
        window.open(doc.downloadURL, '_blank', 'width=1200,height=800');
        return;
    }

    // Check if it's a PDF stored inline
    const isPDF = doc.fileType === 'application/pdf' || doc.fileName?.endsWith('.pdf');
    if (isPDF && doc.content) {
        // Convert base64 to blob and create object URL
        try {
            let base64String = doc.content;
            if (base64String.startsWith('data:')) {
                base64String = base64String.split(',')[1];
            }
            const byteCharacters = atob(base64String);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank', 'width=1200,height=800');
        } catch(e) {
            alert('❌ Error opening PDF: ' + e.message);
        }
        return;
    }

    // Fallback: show text content or viewer
    openDocumentViewer(doc);
}

function openPdfViewer(doc) {
    // Create PDF modal if doesn't exist
    let modal = document.getElementById('pdfViewerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pdfViewerModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 95%; max-height: 95vh; padding: 0;">
                <button class="modal-close" onclick="closePdfViewer()">×</button>
                <iframe id="pdfFrame" style="width: 100%; height: 100%; border: none; margin-top: 40px;"></iframe>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const iframe = document.getElementById('pdfFrame');
    
    // Handle base64 encoded PDFs
    if (doc.content.startsWith('data:') || doc.content.startsWith('/9j') || !doc.content.includes('://')) {
        // It's a base64 encoded PDF
        iframe.src = doc.content.startsWith('data:') ? doc.content : `data:application/pdf;base64,${doc.content}`;
    } else {
        // It's a URL
        iframe.src = doc.content;
    }
    
    modal.classList.remove('hidden');
}

function closePdfViewer() {
    const modal = document.getElementById('pdfViewerModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('pdfFrame').src = '';
    }
}

function openDocumentViewer(doc) {
    // Create modal if doesn't exist
    let modal = document.getElementById('documentViewerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'documentViewerModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <button class="modal-close" onclick="closeDocumentViewer()">×</button>
                <div style="padding: 20px;">
                    <h2 style="color: var(--color-terminal-green); margin-bottom: 10px;" id="modalDocTitle"></h2>
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 4px; max-height: 70vh; overflow-y: auto;" id="modalDocContent"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('modalDocTitle').textContent = doc.code || 'Document';
    document.getElementById('modalDocContent').innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; color: var(--color-text); font-size: 0.9rem;">${escapeHtml(doc.content)}</pre>`;
    
    modal.classList.remove('hidden');
}

function closeDocumentViewer() {
    const modal = document.getElementById('documentViewerModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function viewImageData(imageData) {
    const modal = document.getElementById('imageViewerModal');
    const container = document.getElementById('modalImageContainer');
    if (modal && container) {
        container.innerHTML = `<img src="${imageData}" style="max-width: 100%; max-height: 600px; border-radius: 4px;">`;
        modal.classList.remove('hidden');
    }
}

// DOCUMENT EDIT/DELETE FUNCTIONS

function editDocumentModal(docIndex, dossierId) {
    if (!isAdmin()) {
        alert('❌ ADMIN ACCESS REQUIRED');
        return;
    }
    
    const documents = getDocumentsForDossier(dossierId);
    const doc = documents[docIndex];
    
    if (!doc) {
        alert('Document not found');
        return;
    }
    
    // Create edit modal if doesn't exist
    let modal = document.getElementById('editDocumentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'editDocumentModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <button class="modal-close" onclick="closeEditDocumentModal()">×</button>
                <div style="padding: 20px;">
                    <h2 style="color: var(--color-terminal-green); margin-bottom: 20px;">EDIT DOCUMENT</h2>
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 4px;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; color: var(--color-olive); margin-bottom: 8px;">Document Name/Code:</label>
                            <input type="text" id="editDocCode" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--color-light-gray); color: var(--color-text); border-radius: 2px; font-family: var(--font-mono);">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; color: var(--color-olive); margin-bottom: 8px;">Date:</label>
                            <input type="date" id="editDocDate" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--color-light-gray); color: var(--color-text); border-radius: 2px; font-family: var(--font-mono);">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; color: var(--color-olive); margin-bottom: 8px;">Content:</label>
                            <textarea id="editDocContent" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--color-light-gray); color: var(--color-text); border-radius: 2px; font-family: var(--font-mono); min-height: 200px; resize: vertical;"></textarea>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="saveDocumentChanges('${dossierId}', ${docIndex})" style="flex: 1; padding: 10px; background: var(--color-olive); border: none; color: var(--color-black); cursor: pointer; border-radius: 2px; font-family: var(--font-mono); font-weight: bold;">✓ SAVE CHANGES</button>
                            <button onclick="closeEditDocumentModal()" style="flex: 1; padding: 10px; background: transparent; border: 1px solid var(--color-text); color: var(--color-text); cursor: pointer; border-radius: 2px; font-family: var(--font-mono);">CANCEL</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Populate edit form
    document.getElementById('editDocCode').value = doc.code || '';
    document.getElementById('editDocDate').value = doc.date || '';
    document.getElementById('editDocContent').value = doc.content || '';
    
    // Store for save function
    window.editingDocumentIndex = docIndex;
    window.editingDossierId = dossierId;
    
    modal.classList.remove('hidden');
}

function saveDocumentChanges(dossierId, docIndex) {
    const documents = getDocumentsForDossier(dossierId);
    const doc = documents[docIndex];
    
    if (!doc) {
        alert('Document not found');
        return;
    }
    
    const updatedData = {
        code: document.getElementById('editDocCode').value,
        date: document.getElementById('editDocDate').value,
        content: document.getElementById('editDocContent').value
    };
    
    updateDocument(dossierId, doc.id, updatedData);
    alert('✓ DOCUMENT UPDATED');
    closeEditDocumentModal();
    loadDossierPage();
}

function closeEditDocumentModal() {
    const modal = document.getElementById('editDocumentModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function deleteDocumentConfirm(docIndex, dossierId) {
    if (!isAdmin()) {
        alert('❌ ADMIN ACCESS REQUIRED');
        return;
    }
    
    const documents = getDocumentsForDossier(dossierId);
    const doc = documents[docIndex];
    
    if (!doc) {
        alert('Document not found');
        return;
    }
    
    if (confirm(`⚠️ DELETE DOCUMENT?\n\nCode: ${doc.code}\n\nThis action cannot be undone.`)) {
        deleteDocument(dossierId, doc.id);
        alert('✓ DOCUMENT DELETED');
        loadDossierPage();
    }
}

// Export for browser compatibility
if (typeof window !== 'undefined') {
    window.archiveApp = {
        getDossiers: getAllDossiers,
        getDossier: getDossier,
        addDossier: addDossier,
        updateDossier: updateDossier,
        deleteDossier: deleteDossier,
        openDossier: openDossier,
        viewImage: viewImage,
        closeImageViewer: closeImageViewer,
        switchTab: switchTab,
        formatDate: formatDate,
        createRedactedText: createRedactedText
    };
}
