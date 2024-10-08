// Dein bestehender Code für das Auf- und Zuklappen der Nachrichten

document.addEventListener('DOMContentLoaded', function () {
    const messages = document.querySelectorAll('.message');
    
    let activeMessage = null; // Track the currently active (open) message

    messages.forEach((message) => {
        const fullText = message.querySelector('p');
        const toggleButton = document.createElement('span');
        
        // Save full text and reduce to first sentence
        const firstSentence = fullText.textContent.split('. ')[0] + '.';
        const remainingText = fullText.textContent.substring(firstSentence.length);

        // Create toggle button and set its style
        toggleButton.textContent = ' + ';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.display = 'block'; // Make it a block element
        toggleButton.style.textAlign = 'center'; // Center the symbol
        toggleButton.style.fontSize = '1.5rem'; // Increase the font size
        toggleButton.style.marginTop = '10px'; // Add space above the symbol

        // Initially show only the first sentence
        fullText.textContent = firstSentence;

        // Toggle function
        function toggleMessage() {
            if (activeMessage && activeMessage !== message) {
                // Close the currently active message
                const activeText = activeMessage.querySelector('p');
                const activeButton = activeMessage.querySelector('span');
                const activeFirstSentence = activeText.textContent.split('. ')[0] + '.';
                activeText.textContent = activeFirstSentence;
                activeButton.textContent = ' + ';
                activeMessage.style.height = 'auto'; // Reset the height
            }
            
            if (toggleButton.textContent === ' + ') {
                fullText.textContent = firstSentence + remainingText;
                toggleButton.textContent = ' - ';
                activeMessage = message;
                message.style.height = 'auto'; // Set height for opened message
            } else {
                fullText.textContent = firstSentence;
                toggleButton.textContent = ' + ';
                activeMessage = null;
                message.style.height = 'auto'; // Reset the height
            }
        }

        // Append toggle button to the message box
        message.appendChild(toggleButton);

        // Add click event to the entire message box
        message.style.cursor = 'pointer';
        message.addEventListener('click', toggleMessage);
    });
});

// Neuer Bildtausch-Code beim Hovern (füge diesen am Ende ein)

document.addEventListener('DOMContentLoaded', function () {
    const messages = document.querySelectorAll('.message');

    messages.forEach((message) => {
        const imgElement = message.querySelector('img');

        // Bild tauschen beim Hover
        message.addEventListener('mouseenter', function () {
            imgElement.src = 'images/car-pollution.png'; // Neues Bild beim Hover
        });

        // Originalbild wiederherstellen, wenn der Hover endet
        message.addEventListener('mouseleave', function () {
            imgElement.src = 'images/car-pollution (1).png'; // Originalbild
        });
    });
});






// Funktion zum Abrufen der Parkdaten für die letzten 24 Stunden stündlich
async function fetchHourlyParkingData() {
    try {
        const response = await fetch('https://etl.mmp.li/Parking_Air_Quality_ZH/etl/unload.php?last_24_hours=true');
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }
        const data = await response.json();
        const hourlyData = processHourlyData(data);
        createStyledBarChart(hourlyData);
    } catch (error) {
        console.error('Fehler beim Abrufen der stündlichen Daten:', error);
    }
}

// Funktion zur Verarbeitung der stündlichen Daten
function processHourlyData(data) {
    const hourlyData = [];

    // Gruppierung der Daten nach Stunden
    const groupedByHour = groupDataByHour(data);

    // Berechne die Auslastung (in Prozent) für jede Stunde
    for (const hour in groupedByHour) {
        const totalSpaces = groupedByHour[hour].reduce((sum, entry) => sum + entry.parkhaus_total, 0);
        const freeSpaces = groupedByHour[hour].reduce((sum, entry) => sum + entry.parkhaus_free, 0);
        const occupancyRate = ((totalSpaces - freeSpaces) / totalSpaces) * 100;
        hourlyData.push({
            hour: hour,
            occupancyRate: occupancyRate.toFixed(2) // auf 2 Dezimalstellen runden
        });
    }

    return hourlyData;
}

// Funktion zur Gruppierung der Daten nach Stunden
function groupDataByHour(data) {
    const grouped = {};
    data.forEach(entry => {
        const hour = new Date(entry.timestamp).getHours(); // Extrahiere die Stunde
        if (!grouped[hour]) {
            grouped[hour] = [];
        }
        grouped[hour].push(entry);
    });
    return grouped;
}

// Funktion zur Erstellung des gestylten Balkendiagramms
function createStyledBarChart(hourlyData) {
    const labels = hourlyData.map(entry => `${entry.hour}:00`);
    const occupancyRates = hourlyData.map(entry => entry.occupancyRate);

    const ctx = document.getElementById('parkhausChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',  // Balkendiagramm
        data: {
            labels: labels,
            datasets: [{
                label: 'Auslastung in %',
                data: occupancyRates,
                backgroundColor: '#97AABD',  // Helles Blau-Grau für die Balken
                borderColor: '#405c6c',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Stündliche Parkhaus-Auslastung in den letzten 24 Stunden',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (tooltipItem) {
                            return `Parkhäuser: ${tooltipItem.raw}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,  // Y-Achse bis 100%
                    title: {
                        display: true,
                        text: 'Auslastung Parkhäuser in Prozent',
                        font: {
                            size: 14
                        },
                        color: '#405c6c'
                    },
                    grid: {
                        color: '#ccc'
                    },
                    ticks: {
                        color: '#405c6c',
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                     ticks: {
                        color: '#405c6c',
                        font: {
                            size: 12
                        },
                        maxTicksLimit: 24  // 24 Stunden anzeigen
                    },
                    grid: {
                        display: false  // Kein Raster auf der X-Achse
                    }
                }
            }
        }
    });
}

// Daten für die letzten 24 Stunden abrufen und das Diagramm erstellen
fetchHourlyParkingData();