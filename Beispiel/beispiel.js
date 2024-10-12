// Funktion zum Abrufen der Parkdaten für die letzten 24 Stunden stündlich
async function fetchHourlyParkingData() {
    try {
        // Hier würde der URL-Parameter für die letzten 24 Stunden hinzugefügt werden, falls die API das unterstützt
        const response = await fetch('https://etl.mmp.li/Parking_Air_Quality_ZH/etl/unload.php?last_24_hours=true');
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }
        const data = await response.json();
        const hourlyData = processParkingData(data);
        createHourlyBarChart(hourlyData);
    } catch (error) {
        console.error('Fehler beim Abrufen der stündlichen Daten:', error);
    }
}

// Funktion zur Verarbeitung der stündlichen Daten
function processParkingData(data) {
    const hourlyData = [];

    // Gruppierung der Daten nach Stunden (dies erfordert eine spezifische Datenstruktur des Servers)
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

// Dummy-Funktion zur Gruppierung der Daten nach Stunde (dies würde angepasst werden, je nach Datenstruktur des Servers)
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

// Funktion zur Erstellung des Balkendiagramms für die stündliche Auslastung
function createHourlyBarChart(hourlyData) {
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
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Stündliche Parkhaus-Auslastung in den letzten 24 Stunden'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,  // Y-Achse bis 100%
                    title: {
                        display: true,
                        text: 'Auslastung in %'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Stunde des Tages'
                    },
                    ticks: {
                        maxTicksLimit: 24  // 24 Stunden anzeigen
                    }
                }
            }
        }
    });
}

// Daten für die letzten 24 Stunden abrufen und das Balkendiagramm erstellen
fetchHourlyParkingData();
