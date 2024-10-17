// Eventlistener, um die Kernaussage-Interaktion beim DOM-Laden zu initialisieren
document.addEventListener('DOMContentLoaded', function () {
    const messages = document.querySelectorAll('.message');
    
    let activeMessage = null; // Verfolgt die aktuell geöffnete Nachricht

    messages.forEach((message) => {
        const fullText = message.querySelector('p');
        const toggleButton = document.createElement('span');
        
        // Speichert den ersten Satz und den Rest des Textes für das Ein-/Ausklappen
        const firstSentence = fullText.textContent.split('. ')[0] + '.';
        const remainingText = fullText.textContent.substring(firstSentence.length);

        // Erstellt den Umschaltknopf und setzt dessen Stil
        toggleButton.textContent = ' + ';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.display = 'block'; // Blockelement, um den Button sichtbar zu machen
        toggleButton.style.textAlign = 'center'; // Zentriere das Symbol
        toggleButton.style.fontSize = '1.5rem'; // Vergrößere die Schriftgröße
        toggleButton.style.marginTop = '10px'; // Abstand über dem Symbol

        // Zeigt zunächst nur den ersten Satz an
        fullText.textContent = firstSentence;

        // Umschaltfunktion für das Ein- und Ausklappen der Kernaussage
        function toggleMessage() {
            if (activeMessage && activeMessage !== message) {
                // Schließt die aktuell aktive Kernaussage, wenn eine andere geöffnet wird
                const activeText = activeMessage.querySelector('p');
                const activeButton = activeMessage.querySelector('span');
                const activeFirstSentence = activeText.textContent.split('. ')[0] + '.';
                activeText.textContent = activeFirstSentence;
                activeButton.textContent = ' + ';
                activeMessage.style.height = 'auto'; // Setzt die Höhe zurück
            }
            
            if (toggleButton.textContent === ' + ') {
                fullText.textContent = firstSentence + remainingText;
                toggleButton.textContent = ' - ';
                activeMessage = message;
                message.style.height = 'auto'; // Höhe für die geöffnete Kernaussage setzen
            } else {
                fullText.textContent = firstSentence;
                toggleButton.textContent = ' + ';
                activeMessage = null;
                message.style.height = 'auto'; // Setzt die Höhe zurück
            }
        }

        // Fügt den Umschaltknopf zur Nachricht hinzu
        message.appendChild(toggleButton);

        // Klick-Ereignis auf die gesamte Nachricht setzen
        message.style.cursor = 'pointer';
        message.addEventListener('click', toggleMessage);
    });
});

// Bildtausch beim Hovern über Kernaussage
document.addEventListener('DOMContentLoaded', function () {
    const messages = document.querySelectorAll('.message');

    messages.forEach((message) => {
        const imgElement = message.querySelector('img');

        // Bild tauschen, wenn die Maus über die Nachricht fährt
        message.addEventListener('mouseenter', function () {
            imgElement.src = 'images/car-pollution.png'; // Neues Bild beim Hover
        });

        // Originalbild wiederherstellen, wenn die Maus die Nachricht verlässt
        message.addEventListener('mouseleave', function () {
            imgElement.src = 'images/car-pollution (1).png'; // Originalbild wiederherstellen
        });
    });
});

// Funktion zum Abrufen der Parkdaten für die letzten 24 Stunden
async function fetchHourlyParkingData(offset=1) {
    try {
        // Berechne das Datum, von dem die Daten abgefragt werden sollen
        const dateFrom = moment().subtract(offset, 'days').format('YYYY-MM-DD');
        
        // Abrufen der Parkhausdaten
        const response = await fetch('https://etl.mmp.li/Parking_Air_Quality_ZH/etl/unload.php?dateFrom=' + dateFrom);
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }
        const data = await response.json();

        // Abrufen der Luftqualitätsdaten
        const response2 = await fetch('https://etl.mmp.li/Parking_Air_Quality_ZH/etl/load_airquality.php?dateFrom=' + dateFrom);
        if (!response2.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }
        const data2 = await response2.json();

        const showDailyData = offset > 1; // Tägliche oder stündliche Daten anzeigen
        const parkingData = processParkingData(data, showDailyData); // Verarbeitung der Parkdaten
        const airQualityData = processAirQualityData(data2, showDailyData); // Verarbeitung der Luftqualitätsdaten
        
        // Erstelle das Diagramm mit den verarbeiteten Daten
        createStyledBarChart(parkingData, airQualityData, showDailyData);
    } catch (error) {
        console.error('Fehler beim Abrufen der stündlichen Daten:', error);
    }
}

// Funktion zur Verarbeitung der Luftqualitätsdaten
function processAirQualityData(data, daily=false) {
    const airQualityData = [];

    // Gruppierung der Daten nach Zeitstempel (täglich oder stündlich)
    const groupedByTimestamp = groupDataByTimestamp(data, daily);

    for (const timestamp in groupedByTimestamp) {
        if (daily) {
            // Berechne den Durchschnitt der Luftqualität für jeden Tag
            airQualityData.push({
                timestamp: timestamp,
                pm10: groupedByTimestamp[timestamp].reduce((sum, entry) => sum + parseFloat(entry.pm10), 0) / groupedByTimestamp[timestamp].length,
                pm2_5: groupedByTimestamp[timestamp].reduce((sum, entry) => sum + parseFloat(entry.pm2_5), 0) / groupedByTimestamp[timestamp].length,
                nitrogen_dioxide: groupedByTimestamp[timestamp].reduce((sum, entry) => sum + parseFloat(entry.nitrogen_dioxide), 0) / groupedByTimestamp[timestamp].length,
            });
        } else {
            // Daten pro Stunde
            airQualityData.push(groupedByTimestamp[timestamp][0]);
        }
    }

    // Runden der Werte auf 2 Dezimalstellen
    return airQualityData.map(entry => {
        return {
            timestamp: entry.timestamp,
            pm10: parseFloat(entry.pm10).toFixed(2),
            pm2_5: parseFloat(entry.pm2_5).toFixed(2),
            nitrogen_dioxide: parseFloat(entry.nitrogen_dioxide).toFixed(2),
        };
    });
}

// Funktion zur Verarbeitung der Parkhausdaten
function processParkingData(data, daily=false) {
    const parkingData = [];

    // Gruppierung der Daten nach Zeitstempel (täglich oder stündlich)
    const groupedByTimestamp = groupDataByTimestamp(data, daily);

    for (const timestamp in groupedByTimestamp) {
        if (daily) {
            // Berechne die Auslastung für jeden Tag (in Prozent)
            const totalSpaces = [...new Map(groupedByTimestamp[timestamp].map(item => [item['parkhaus_id'], item])).values()]
                .reduce((sum, entry) => sum + entry.parkhaus_total, 0);
            const averageFreeSpaces = groupedByTimestamp[timestamp].reduce((sum, entry) => sum + entry.parkhaus_free, 0) / 24;
            const occupancyRate = ((totalSpaces - averageFreeSpaces) / totalSpaces) * 100;
            parkingData.push({
                timestamp: timestamp,
                occupancyRate: occupancyRate.toFixed(2) // Auf 2 Dezimalstellen runden
            });
        } else {
            // Berechne die Auslastung für jede Stunde (in Prozent)
            const totalSpaces = groupedByTimestamp[timestamp].reduce((sum, entry) => sum + entry.parkhaus_total, 0);
            const freeSpaces = groupedByTimestamp[timestamp].reduce((sum, entry) => sum + entry.parkhaus_free, 0);
            const occupancyRate = ((totalSpaces - freeSpaces) / totalSpaces) * 100;
            parkingData.push({
                timestamp: timestamp,
                occupancyRate: occupancyRate.toFixed(2) // Auf 2 Dezimalstellen runden
            });
        }
    }

    return parkingData;
}

// Funktion zur Gruppierung der Daten nach Zeitstempel (täglich oder stündlich)
function groupDataByTimestamp(data, daily=false) {
    const grouped = {};
    data.forEach(entry => {
        const key = daily ? entry.timestamp.slice(0, 10) : entry.timestamp.slice(0, 13); // Gruppierung nach Tag oder Stunde
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(entry);
    });
    return grouped;
}

var chart = null; // Initialisiere das Chart-Objekt
// Funktion zur Erstellung eines gestylten Balkendiagramms
function createStyledBarChart(parkingData, airQualityData, daily=false) {
    if (chart) {
        chart.destroy(); // Bestehendes Diagramm zerstören, falls es existiert
    }

    // Labels für die X-Achse (Zeitstempel)
    const labels = parkingData.map(entry => daily ? entry.timestamp.slice(0, 10) : entry.timestamp.slice(11, 13) + ":00");
    const occupancyRates = parkingData.map(entry => entry.occupancyRate);
    const pm10 = airQualityData.map(entry => entry.pm10);
    const pm25 = airQualityData.map(entry => entry.pm2_5);
    const no2 = airQualityData.map(entry => entry.nitrogen_dioxide);

    // Erstellung des Diagramms mit Chart.js
    const ctx = document.getElementById('parkhausChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',  // Typ: Balkendiagramm
        data: {
            labels: labels,
            datasets: [
            {  
                label: 'PM 10',
                data: pm10,
                backgroundColor: '#389F07',
                borderColor: '#389F07',
                borderWidth: 3,
                type: 'line',  // Hinzufügen einer Linie
                yAxisID: 'y2',  // Rechte Y-Achse für Luftqualität verwenden
                fill: false,
                xAxisID: 'x'
            },
            { 
                label: 'PM 2.5',
                data: pm25,
                backgroundColor: '#0AA0E1',
                borderColor: '#0AA0E1',
                borderWidth: 3,
                type: 'line',  // Hinzufügen einer Linie
                yAxisID: 'y2',  // Rechte Y-Achse für Luftqualität verwenden
                fill: false,
                xAxisID: 'x'
            },
            {
                label: 'NO2',
                data: no2,
                backgroundColor: '#D10829', 
                borderColor: '#D10829',
                borderWidth: 3,
                type: 'line',  // Hinzufügen einer Linie
                yAxisID: 'y2',  // Rechte Y-Achse für Luftqualität verwenden
                fill: false,
                xAxisID: 'x'
            },
            {
                label: 'prozentuale Parkhaus Auslastung',
                data: occupancyRates,
                backgroundColor: '#A4B6BD',  // Farbe für die Balken
                yAxisID: 'y',
                xAxisID: 'x'
            }, 
        ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: daily ? 'Tages-Durchschnitte der letzten 7 Tage' : 'Messungen der letzten 24 Stunden',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Century Gothic', 'Arial', sans-serif",
                        color: '516272'
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                legend: {
                    display: true
                },
                tooltip: {
                    enabled: false,
                    position: 'nearest',
                    external: externalTooltipHandler,
                    bodyFont: {
                        family: "'Century Gothic', 'Arial', sans-serif",
                        size: 14,
                        textAlign: 'right'
                    },
                    titleFont: {
                        family: "'Century Gothic', 'Arial', sans-serif",
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,  // Y-Achse bis 100% für die Parkhaus-Auslastung
                    title: {
                        display: true,
                        text: 'Auslastung Parkhäuser in Prozent',
                        font: {
                            size: 14,
                            family: "'Century Gothic', 'Arial', sans-serif"
                        },
                        color: '#405c6c'
                    },
                    grid: {
                        color: '#ccc'
                    },
                    ticks: {
                        color: '#405c6c',
                        font: {
                            size: 12,
                            family: "'Century Gothic', 'Arial', sans-serif"
                        }
                    }
                },
                y2: {
                    beginAtZero: true,
                    max: 50, // Y-Achse bis 50 µg/m³ für die Luftqualität
                    title: {
                        display: true,
                        text: 'Luftverschmutzung in µg/m³',
                        font: {
                            size: 14,
                            family: "'Century Gothic', 'Arial', sans-serif"
                        },
                        color: '#405c6c'
                    },
                    position: 'right',
                    grid: {
                        display: false  // Kein Raster auf der Luftqualitätsachse
                    }
                },
                x: {
                    ticks: {
                        color: '#405c6c',
                        font: {
                            size: 12,
                            family: "'Century Gothic', 'Arial', sans-serif"
                        },
                        maxTicksLimit: daily ? 7 : 24  // Begrenzung auf 7 Tage oder 24 Stunden
                    },
                    grid: {
                        display: false  // Kein Raster auf der X-Achse
                    }
                }
            }
        }
    });
}

// Tooltip-Erstellungsfunktion
const getOrCreateTooltip = (chart) => {
    let tooltipEl = chart.canvas.parentNode.querySelector('div');
  
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
      tooltipEl.style.borderRadius = '3px';
      tooltipEl.style.color = 'white';
      tooltipEl.style.textAlign = 'left';
      tooltipEl.style.opacity = 1;
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.transform = 'translate(-50%, 0)';
      tooltipEl.style.transition = 'all .1s ease';
  
      const table = document.createElement('table');
      table.style.margin = '0px';
  
      tooltipEl.appendChild(table);
      chart.canvas.parentNode.appendChild(tooltipEl);
    }

    return tooltipEl;
};

// Externe Tooltip-Handler-Funktion
const externalTooltipHandler = (context) => {
    const {chart, tooltip} = context;
    const tooltipEl = getOrCreateTooltip(chart);
  
    if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }
  
    if (tooltip.body) {
        const titleLines = tooltip.title || [];
        const bodyLines = tooltip.body.map(b => b.lines);
  
        const tableHead = document.createElement('thead');
  
        titleLines.forEach(title => {
            const tr = document.createElement('tr');
            tr.style.borderWidth = 0;
  
            const th = document.createElement('th');
            th.style.borderWidth = 0;
            const text = document.createTextNode(title);
  
            th.appendChild(text);
            tr.appendChild(th);
            tableHead.appendChild(tr);
        });
  
        const tableBody = document.createElement('tbody');
        bodyLines.forEach((body, i) => {
            const colors = tooltip.labelColors[i];
  
            const span = document.createElement('span');
            span.style.background = colors.backgroundColor;
            span.style.borderColor = colors.borderColor;
            span.style.borderWidth = '2px';
            span.style.marginRight = '10px';
            span.style.height = '10px';
            span.style.width = '10px';
            span.style.display = 'inline-block';
  
            const tr = document.createElement('tr');
            tr.style.backgroundColor = 'inherit';
            tr.style.borderWidth = 0;
  
            const td = document.createElement('td');
            td.style.borderWidth = 0;
  
            const text = document.createTextNode(body);
  
            td.appendChild(span);
            td.appendChild(text);
            tr.appendChild(td);
            tableBody.appendChild(tr);
        });
  
        const tableRoot = tooltipEl.querySelector('table');
  
        while (tableRoot.firstChild) {
            tableRoot.firstChild.remove();
        }
  
        tableRoot.appendChild(tableHead);
        tableRoot.appendChild(tableBody);
    }
  
    const {offsetLeft: positionX, offsetTop: positionY} = chart.canvas;
  
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = positionX + tooltip.caretX + 'px';
    tooltipEl.style.top = positionY + tooltip.caretY + 'px';
    tooltipEl.style.font = tooltip.options.bodyFont.string;
    tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
};

// Funktion zum Wechseln der aktiven Schaltfläche
function updateActiveButton() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.classList.toggle('active');
    });
}

// Funktion zum Umschalten der Auto-Icons
function toggleCarImage() {
    const images = document.querySelectorAll('.car-icon');
    images.forEach(image => {
        image.classList.toggle('hidden');
    });
}

// Funktion zum Abrufen der Luftqualitätsdaten per AJAX
document.addEventListener('DOMContentLoaded', function () {
    fetch('https://etl.mmp.li/Parking_Air_Quality_ZH/etl/load_airquality.php')
        .then(response => response.json())
        .then(data => {
            console.log('Empfangene Daten:', data);

            const pm10 = data.reduce((sum, entry) => sum + parseFloat(entry.pm10), 0) / data.length;
            const pm25 = data.reduce((sum, entry) => sum + parseFloat(entry.pm2_5), 0) / data.length;
            const no2 = data.reduce((sum, entry) => sum + parseFloat(entry.nitrogen_dioxide), 0) / data.length;

            const ctx = document.getElementById('pollutionChart').getContext('2d');
            const pollutionChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['PM 10', 'PM 2.5', 'NO2'],
                    datasets: [{
                        label: 'Verteilung der Verschmutzungswerte (letzte 24 Stunden)',
                        data: [pm10, pm25, no2],
                        backgroundColor: ['#389F07', '#0AA0E1', '#D10829'],
                        hoverOffset: 4,
                        borderColor: '#F6F5F5',
                        borderWidth: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 2.5, 
                    plugins: {
                        legend: {
                            display: true
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            bodyFont: {
                                family: "'Century Gothic', 'Arial', sans-serif",
                                size: 14
                            },
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 10,
                            cornerRadius: 3,
                            displayColors: false,
                            callbacks: {
                                label: function(tooltipItem) {
                                    let explanation;
                                    switch (tooltipItem.label) {
                                        case 'PM 10':
                                            explanation = 'Particulate Matter';
                                            break;
                                        case 'PM 2.5':
                                            explanation = 'Particulate Matter';
                                            break;
                                        case 'NO2':
                                            explanation = 'Nitrogen Dioxide';
                                            break;
                                        default:
                                            explanation = tooltipItem.label;
                                    }
                                    return tooltipItem.raw.toFixed(2) + ' µg/m³' + '\n' + explanation;
                                }
                            }
                        }
                    }
                }
            });

            const pollutionChartContainer = document.getElementById('pollutionChartContainer');
            if (!pollutionChartContainer) {
                console.error('Der Container für das Diagramm wurde nicht gefunden.');
                return;
            }

        })
        .catch(error => {
            console.error('Fehler beim Abrufen der Daten:', error);
        });
});
