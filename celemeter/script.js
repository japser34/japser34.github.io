// Initialize the map
const map = L.map('map').setView([37.7749, -122.4194], 13); // Set initial view to San Francisco

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Create a polyline to represent the path
let path = L.polyline([], { color: 'blue' }).addTo(map);

// Function to handle file drop
function handleFileDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            parseGPSData(content);
            showPopup(file.name); // Show the filename in the popup
        };
        reader.readAsText(file);
    }
}

// Function to parse GPS data from the file content
function parseGPSData(content) {
    const gpsData = [];
    const regex = />23\|01:(.*?)(<.*)?$/gm; // Regex to match the required lines
    let match;

    // Loop through all matches in the content
    while ((match = regex.exec(content)) !== null) {
        const data = match[1].split(','); // Split the matched data by comma

        // Check if we have enough data to extract latitude and longitude
        if (data.length >= 11) {
            const lat = parseFloat(data[9].trim()); // 10th item (index 9)
            const lon = parseFloat(data[10].trim()); // 11th item (index 10)

            // Check if lat and lon are valid numbers
            if (!isNaN(lat) && !isNaN(lon)) {
                gpsData.push([lat, lon]);
            }
        }
    }

    // Check if we have valid GPS data before updating the polyline and fitting bounds
    if (gpsData.length > 0) {
        // Update the polyline with the new GPS data
        path.setLatLngs(gpsData);
        map.fitBounds(path.getBounds());

        // Optionally, add a marker for the last known position
        const lastPosition = gpsData[gpsData.length - 1];
        L.marker(lastPosition).addTo(map).bindPopup('Last known position').openPopup();
    } else {
        alert("No valid GPS data found in the file.");
    }
}

// Function to show the popup with the filename
function showPopup(filename) {
    const popup = document.getElementById('popup');
    popup.textContent = `File uploaded: ${filename}`;
    popup.style.display = 'block';

    // Hide the popup after 3 seconds
    setTimeout(() => {
        popup.style.display = 'none';
    }, 3000);
}

// Prevent default behavior for drag events
function preventDefaults(event) {
    event.preventDefault();
    event.stopPropagation();
}

// Add event listeners for drag-and-drop on the entire body
document.body.addEventListener('dragover', preventDefaults, false);
document.body.addEventListener('dragleave', preventDefaults, false);
document.body.addEventListener('drop', handleFileDrop, false);

// Optional: Add visual feedback for drag-and-drop
document.body.addEventListener('dragover', (event) => {
    event.preventDefault();
    document.body.classList.add('drag-over');
});

document.body.addEventListener('dragleave', () => {
    document.body.classList.remove('drag-over');
});

document.body.addEventListener('drop', () => {
    document.body.classList.remove('drag-over');
});
