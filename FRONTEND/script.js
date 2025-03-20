const API_BASE_URL = "http://127.0.0.1:8000";  // Change this if API is deployed

// Function to get treatment based on symptom
async function getTreatment() {
    let symptom = document.getElementById("symptomInput").value;
    
    if (!symptom) {
        alert("Please enter a symptom!");
        return;
    }

    let response = await fetch(`${API_BASE_URL}/get_treatment/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ symptom: symptom })
    });

    let data = await response.json();
    document.getElementById("treatmentResult").innerHTML = JSON.stringify(data, null, 2);
}

// Function to upload an image and get recognition result
async function uploadImage() {
    let fileInput = document.getElementById("imageUpload").files[0];

    if (!fileInput) {
        alert("Please select an image!");
        return;
    }

    let formData = new FormData();
    formData.append("file", fileInput);

    let response = await fetch(`${API_BASE_URL}/scan_image/`, {
        method: "POST",
        body: formData
    });

    let data = await response.json();
    document.getElementById("scanResult").innerHTML = JSON.stringify(data, null, 2);
}
