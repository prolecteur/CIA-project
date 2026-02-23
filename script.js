const SECRET_CODE = "4920318576";

// --- CONFIGURATION TES DOSSIERS ICI ---
const myFolders = [
    {
        name: "DRACO",
        files: [
            { fileName: "dossier n°1.pdf", url: "dossier/Dossier n°1.pdf" },
            { fileName: "mission_report.pdf", url: "dossiers/report.pdf" }
        ]
    },
    {
        name: "Alien",
        files: [
            { fileName: "intercepted_comms.pdf", url: "dossiers/comms.pdf" }
        ]
    }
];

function checkCode() {
    const val = document.getElementById('access-code').value;
    if (val === SECRET_CODE) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('database').style.display = 'block';
        renderGrid();
    } else {
        alert("ACCESS DENIED");
    }
}

function renderGrid() {
    const grid = document.getElementById('folder-grid');
    grid.innerHTML = "";

    myFolders.forEach((folder, index) => {
        const div = document.createElement('div');
        div.className = "folder";
        // Détecte le double clic
        div.ondblclick = () => openFolder(index);
        
        div.innerHTML = `
            <div class="folder-icon"></div>
            <span>${folder.name}</span>
        `;
        grid.appendChild(div);
    });
}

function openFolder(index) {
    const modal = document.getElementById('folder-modal');
    const content = document.getElementById('modal-body');
    const folder = myFolders[index];

    document.getElementById('modal-title').innerText = "DIRECTORY: " + folder.name;
    content.innerHTML = "";

    folder.files.forEach(file => {
        content.innerHTML += `
            <div class="file-row">
                <span>📄 ${file.fileName}</span>
                <a href="${file.url}" target="_blank" class="read-btn">READ</a>
            </div>
        `;
    });

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById('folder-modal').style.display = "none";
}