const API_BASE_URL = "http://127.0.0.1:8000";
let isLoginMode = true;

// --- INITIALIZATION & SESSION CHECK ---

window.onload = function() {
    const savedUser = localStorage.getItem("vedaura_user");
    if (savedUser) {
        showPortal(savedUser);
    }
};

// --- AUTHENTICATION HANDLERS ---

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById("authTitle");
    const toggleText = event.target; 
    
    title.innerText = isLoginMode ? "Login to Ved Aura" : "Register for Ved Aura";
    toggleText.innerText = isLoginMode ? "New here? Register" : "Already have an account? Login";
}

async function handleAuth() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value; // Used for login
    
    if (isLoginMode) {
        // Login logic remains the same
    } else {
        // Updated Registration to match your new main.py
        // Note: Adding mock age and history for now to satisfy the new backend requirements
        const response = await fetch(`${API_BASE_URL}/register/?username=${user}&age=25&history=none`, {
            method: "POST"
        });
        
        if (response.ok) {
            alert("Registration Successful!");
            toggleAuthMode();
        }
    }
}
// UI Transition to Main App
function showPortal(username) {
    document.getElementById("authContainer").classList.add("hidden");
    document.getElementById("mainPortal").classList.remove("hidden");
    
    // Check if element exists before setting text
    const displayElement = document.getElementById("userDisplayName");
    if (displayElement) {
        displayElement.innerText = `Welcome, ${username}`;
    }
}

function logout() {
    localStorage.removeItem("vedaura_user"); // Clear session
    location.reload();
}

// --- APP FUNCTIONALITIES ---

function toggleLoader(show) {
    const loader = document.getElementById("loaderOverlay");
    loader.style.display = show ? "flex" : "none";
}

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        const output = document.getElementById('imagePreview');
        output.src = reader.result;
        output.classList.remove('hidden');
        document.getElementById('uploadText').classList.add('hidden');
    }
    if(event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

async function getTreatment() {
    let symptom = document.getElementById("symptomInput").value;
    if (!symptom) return alert("Please enter a symptom!");

    toggleLoader(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/get_treatment/`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ symptom: symptom }) // Key must match Python's SymptomInput class
        });

        // If 422 occurs, log the specific validation error from FastAPI
        if (response.status === 422) {
            const errorDetail = await response.json();
            console.error("Validation Error Details:", errorDetail);
            throw new Error("Data format mismatch. Check console for details.");
        }

        if (!response.ok) throw new Error("Server Error: " + response.statusText);

        let data = await response.json(); 
        
        displayResults(data);
        
        // Optional: Save this to Medical History in LocalStorage
        saveToHistory(symptom, data);

        document.getElementById("downloadBtn").classList.remove("hidden");
    } catch (error) {
        console.error("Fetch Error:", error);
        alert(error.message || "AI Connection Failed. Ensure your backend is running.");
    } finally {
        toggleLoader(false);
    }
}

// Helper to save results to history section
function saveToHistory(symptom, data) {
    let history = JSON.parse(localStorage.getItem("vedaura_history") || "[]");
    const entry = {
        date: new Date().toLocaleString(),
        symptom: symptom,
        results: data
    };
    history.unshift(entry); // Add to beginning
    localStorage.setItem("vedaura_history", JSON.stringify(history));
}

async function uploadImage() {
    let fileInput = document.getElementById("imageUpload").files[0];
    if (!fileInput) return alert("Select an image first!");

    toggleLoader(true);
    let formData = new FormData();
    formData.append("file", fileInput);

    try {
        let response = await fetch(`${API_BASE_URL}/scan_image/`, {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) throw new Error("Upload Failed");
        
        let data = await response.json();
        
        document.getElementById("scanResult").innerHTML = `
            <div class="result-card">
                <div class="medical-header" style="font-weight: bold; color: #2D6A4F; margin-bottom: 10px;">
                    AI Identification Result
                </div>
                <p><strong>Detected:</strong> ${data["Detected Item"] || data.analysis || "Unknown"}</p>
                <p><strong>Properties:</strong> ${data["Healing Properties"] || "N/A"}</p>
                <p class="warning"><strong>Warnings:</strong> ${data["Side Effects"] || "Consult a professional"}</p>
            </div>
        `;
        document.getElementById("downloadBtn").classList.remove("hidden");
    } catch (e) {
        alert("Scan failed. Check your internet or server.");
    } finally {
        toggleLoader(false);
    }
}

function displayResults(data) {
    const container = document.getElementById("treatmentResult");
    container.innerHTML = ""; 

    for (const [type, info] of Object.entries(data)) {
        const card = `
            <div class="result-card">
                <h3 style="text-transform: capitalize;">${type.replace('_', ' ')}</h3>
                <p><strong>Medicine:</strong> ${info.medicine}</p>
                <p><strong>Recovery:</strong> ${info.healing_time}</p>
                <p class="warning"><strong>Side Effects:</strong> ${info.side_effects}</p>
            </div>
        `;
        container.innerHTML += card;
    }
}

function generateReport() {
    const element = document.body; 
    const opt = {
        margin: 10,
        filename: 'VedAura_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
}