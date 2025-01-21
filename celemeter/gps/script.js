// Initialize the map
const map = L.map('map').setView([37.7749, -122.4194], 13); // Set initial view to San Francisco

// Add OpenStreetMap tiles with increased maxZoom
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 22, // Set this to your desired maximum zoom level
}).addTo(map);

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

        // Check if we have enough data to extract latitude, longitude, speed, and time
        if (data.length >= 12) {
            const lat = parseFloat(data[9].trim()); // 10th item (index 9)
            const lon = parseFloat(data[10].trim()); // 11th item (index 10)
            const speed = parseFloat(data[11].trim()); // 12th item (index 11)
            const time = data[0].trim(); // Assuming the timestamp is in the first item (adjust as needed)

            // Check if lat, lon, speed, and time are valid
            if (!isNaN(lat) && !isNaN(lon) && !isNaN(speed)) {
                gpsData.push({ coords: [lat, lon], speed: speed, time: time });
            }
        }
    }

    // Check if we have valid GPS data before updating the polyline and fitting bounds
    if (gpsData.length > 0) {
        // Create segments based on speed
        for (let i = 0; i < gpsData.length - 1; i++) {
            const start = gpsData[i].coords;
            const end = gpsData[i + 1].coords;
            const speed = gpsData[i].speed;
            const time = gpsData[i].time;

            // Determine color based on speed using gradient
            const color = getColorGradient(speed);

            // Create a polyline segment for each pair of points
            const segment = L.polyline([start, end], { color: color }).addTo(map);

            // Add tooltip for the segment that shows speed, coordinates, and time on hover
            segment.bindTooltip(`Speed: ${speed} km/h<br>Coords: ${start[0].toFixed(6)}, ${start[1].toFixed(6)}<br>Time: ${time}`, { permanent: false, direction: 'top' });

            // Show tooltip on mouseover and hide on mouseout
            segment.on('mouseover', function() {
                this.openTooltip();
            });
            segment.on('mouseout', function() {
                this.closeTooltip();
            });
        }

        // Fit the map to the bounds of the path
        map.fitBounds(L.polyline(gpsData.map(data => data.coords)).getBounds());

        // Add a marker for the last known position with additional data
        const lastPosition = gpsData[gpsData.length - 1].coords;
        const lastSpeed = gpsData[gpsData.length - 1].speed;
        const lastTime = gpsData[gpsData.length - 1].time;
        const lastMarker = L.marker(lastPosition).addTo(map);
        lastMarker.bindTooltip(`Last Position<br>Speed: ${lastSpeed} km/h<br>Coords: ${lastPosition[0].toFixed(6)}, ${lastPosition[1].toFixed(6)}<br>Time: ${lastTime}`, { permanent: false, direction: 'top' });

        // Show tooltip on mouseover for the last position marker
        lastMarker.on('mouseover', function() {
            this.openTooltip();
        });
        lastMarker.on('mouseout', function() {
            this.closeTooltip();
        });
    } else {
        alert("No valid GPS data found in the file.");
    }
}

// Function to determine color based on speed using a gradient
function getColorGradient(speed) {
    const minSpeed = 0; // Minimum speed
    const maxSpeed = 30; // Maximum speed (adjust as needed)

    // Normalize speed to a value between 0 and 1
    const normalizedSpeed = Math.min(Math.max((speed - minSpeed) / (maxSpeed - minSpeed), 0), 1);

    // Define colors for the gradient (green to red)
    const startColor = [0, 255, 0]; // Green
    const endColor = [255, 0, 0]; // Red

    // Interpolate color
    const color = startColor.map((start, index) => {
        return Math.round(start + normalizedSpeed * (endColor[index] - start));
    });

    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
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
