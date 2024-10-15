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
async function fetchHourlyParkingData(offset=1) {
    try {
        // query appropriate date range
        const dateFrom = moment().subtract(offset, 'days').format('YYYY-MM-DD');
        const response = await fetch('https://etl.mmp.li/Parking_Air_Quality_ZH/etl/unload.php?dateFrom=' + dateFrom);
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }
        const data = await response.json();

        const response2 = await fetch('https://etl.mmp.li/Parking_Air_Quality_ZH/etl/load_airquality.php?dateFrom=' + dateFrom);
        if (!response2.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }
        const data2 = await response2.json();

        const showDailyData = offset > 1;
        const parkingData = processParkingData(data, showDailyData);
        const airQualityData = processAirQualityData(data2, showDailyData);
        createStyledBarChart(parkingData, airQualityData, showDailyData);
    } catch (error) {
        console.error('Fehler beim Abrufen der stündlichen Daten:', error);
    }
}

function processAirQualityData(data, daily=false) {
    const airQualityData = [];

    // Gruppierung der Daten nach Stunden
    const groupedByTimestamp = groupDataByTimestamp(data, daily);

    for (const timestamp in groupedByTimestamp) {
        if (daily) {
            // Berechne die durchschnittliche Luftqualität für jeden Tag
            airQualityData.push({
                timestamp: timestamp,
                pm10: groupedByTimestamp[timestamp].reduce((sum, entry) => sum + parseFloat(entry.pm10), 0) / groupedByTimestamp[timestamp].length,
                pm2_5: groupedByTimestamp[timestamp].reduce((sum, entry) => sum + parseFloat(entry.pm2_5), 0) / groupedByTimestamp[timestamp].length,
                nitrogen_dioxide: groupedByTimestamp[timestamp].reduce((sum, entry) => sum + parseFloat(entry.nitrogen_dioxide), 0) / groupedByTimestamp[timestamp].length,
            });
        } else {
            // Berechne die Luftqualität für jede Stunde
            airQualityData.push(groupedByTimestamp[timestamp][0]);
        }
    }

    return airQualityData.map(entry => {
        return {
            timestamp: entry.timestamp,
            pm10: parseFloat(entry.pm10).toFixed(2),
            pm2_5: parseFloat(entry.pm2_5).toFixed(2),
            nitrogen_dioxide: parseFloat(entry.nitrogen_dioxide).toFixed(2),
        };
    });
}

// Funktion zur Verarbeitung der stündlichen Daten
function processParkingData(data, daily=false) {
    const parkingData = [];

    // Gruppierung der Daten nach Stunden
    const groupedByTimestamp = groupDataByTimestamp(data, daily);

    for (const timestamp in groupedByTimestamp) {
        if (daily) {
            // Berechne die Auslastung (in Prozent) für jeden Tag
            // Entferne Duplikate basierend auf der parkhaus_id
            const totalSpaces = [...new Map(groupedByTimestamp[timestamp].map(item => [item['parkhaus_id'], item])).values()]
                .reduce((sum, entry) => sum + entry.parkhaus_total, 0);
            const averageFreeSpaces = groupedByTimestamp[timestamp].reduce((sum, entry) => sum + entry.parkhaus_free, 0) / 24;
            const occupancyRate = ((totalSpaces - averageFreeSpaces) / totalSpaces) * 100;
            parkingData.push({
                timestamp: timestamp,
                occupancyRate: occupancyRate.toFixed(2) // auf 2 Dezimalstellen runden
            });
        } else {
            // Berechne die Auslastung (in Prozent) für jede Stunde
            const totalSpaces = groupedByTimestamp[timestamp].reduce((sum, entry) => sum + entry.parkhaus_total, 0);
            const freeSpaces = groupedByTimestamp[timestamp].reduce((sum, entry) => sum + entry.parkhaus_free, 0);
            const occupancyRate = ((totalSpaces - freeSpaces) / totalSpaces) * 100;
            parkingData.push({
                timestamp: timestamp,
                occupancyRate: occupancyRate.toFixed(2) // auf 2 Dezimalstellen runden
            });
        }
    }

    return parkingData;
}

// Funktion zur Gruppierung der Daten nach Stunden
function groupDataByTimestamp(data, daily=false) {
    const grouped = {};
    data.forEach(entry => {
        const key = daily ? entry.timestamp.slice(0, 10) : entry.timestamp.slice(0, 13);
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(entry);
    });
    return grouped;
}

var chart = null;
// Funktion zur Erstellung des gestylten Balkendiagramms
function createStyledBarChart(parkingData, airQualityData, daily=false) {
    if (chart) {
        chart.destroy();
    }

    const labels = parkingData.map(entry => daily ? entry.timestamp.slice(0, 10) : entry.timestamp.slice(11, 13) + ":00");
    const occupancyRates = parkingData.map(entry => entry.occupancyRate);
    const pm10 = airQualityData.map(entry => entry.pm10);
    const pm25 = airQualityData.map(entry => entry.pm2_5);
    const no2 = airQualityData.map(entry => entry.nitrogen_dioxide);

    const ctx = document.getElementById('parkhausChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',  // Balkendiagramm
        data: {
            labels: labels,
            datasets: [
            {  
                label: 'PM 10',
                data: pm10,
                backgroundColor: '#389F07',
                borderColor: '#389F07',
                borderWidth: 3,
                type: 'line',  // Linie hinzufügen
                yAxisID: 'y2',  // Verwende die rechte Y-Achse für die Luftqualität
                fill: false,
                xAxisID: 'x'
            },
            { 
                label: 'PM 2.5',
                data: pm25,
                backgroundColor: '#0AA0E1',
                borderColor: '#0AA0E1',
                borderWidth: 3,
                type: 'line',  // Linie hinzufügen
                yAxisID: 'y2',  // Verwende die rechte Y-Achse für die Luftqualität
                fill: false,
                xAxisID: 'x'
            },
            {
                label: 'NO2',
                data: no2,
                backgroundColor: '#D10829', 
                borderColor: '#D10829',
                borderWidth: 3,
                type: 'line',  // Linie hinzufügen
                yAxisID: 'y2',  // Verwende die rechte Y-Achse für die Luftqualität
                fill: false,
                xAxisID: 'x'
            },
            {
                label: 'prozentuale Parkhaus Auslastung',
                data: occupancyRates,
                backgroundColor: '#A4B6BD',  // Helles Blau-Grau für die Balken
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
                    max: 100,  // Y-Achse bis 100%
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
                    max: 50, // Luftqualität bis 50 µg/m³
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
                        maxTicksLimit: daily ? 7 : 24  // 7 Tage oder 24 Stunden anzeigen
                    },
                    grid: {
                        display: false  // Kein Raster auf der X-Achse
                    }
                }
            }
        }
    });
}

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

const externalTooltipHandler = (context) => {
    // Tooltip Element
    const {chart, tooltip} = context;
    const tooltipEl = getOrCreateTooltip(chart);
  
    // Hide if no tooltip
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }
  
    // Set Text
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
  
      // Remove old children
      while (tableRoot.firstChild) {
        tableRoot.firstChild.remove();
      }
  
      // Add new children
      tableRoot.appendChild(tableHead);
      tableRoot.appendChild(tableBody);
    }
  
    const {offsetLeft: positionX, offsetTop: positionY} = chart.canvas;
  
    // Display, position, and set styles for font
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = positionX + tooltip.caretX + 'px';
    tooltipEl.style.top = positionY + tooltip.caretY + 'px';
    tooltipEl.style.font = tooltip.options.bodyFont.string;
    tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
};

function updateActiveButton() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.classList.toggle('active');
    });
}

function toggleCarImage() {
    const images = document.querySelectorAll('.car-icon');
    images.forEach(image => {
        image.classList.toggle('hidden');
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Daten per AJAX von der PHP-Datei abrufen
    fetch('https://etl.mmp.li/Parking_Air_Quality_ZH/etl/load_airquality.php')  // Ersetze 'dein_php_dateiname.php' mit deinem tatsächlichen PHP-Dateinamen
        .then(response => response.json())
        .then(data => {
            // Prüfe die Daten in der Konsole
            console.log('Empfangene Daten:', data);

            // Durchschnittswerte für die letzten 24 Stunden berechnen
            const pm10 = data.reduce((sum, entry) => sum + parseFloat(entry.pm10), 0) / data.length;
            const pm25 = data.reduce((sum, entry) => sum + parseFloat(entry.pm2_5), 0) / data.length;
            const no2 = data.reduce((sum, entry) => sum + parseFloat(entry.nitrogen_dioxide), 0) / data.length;

            // Das Donut-Diagramm erstellen
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
                        borderColor: '#F6F5F5',  // Hier kannst du die Rahmenfarbe festlegen
                        borderWidth: 5           // Hier die Breite des Rahmens (auf 0 setzen, um zu entfernen)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Verhindert, dass das Diagramm das Seitenverhältnis beibehält
                    aspectRatio: 2.5, 
                    plugins: {
                        legend: {
                            display: true
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Tooltip Hintergrundfarbe
                            bodyFont: {
                                family: "'Century Gothic', 'Arial', sans-serif",
                                size: 14
                            },
                            titleColor: '#fff',  // Tooltip Titeltextfarbe
                            bodyColor: '#fff',   // Tooltip Textfarbe
                            padding: 10,         // Abstand innerhalb des Tooltips
                            cornerRadius: 3,     // Abgerundete Ecken
                            displayColors: false, // Farbboxen deaktivieren
                            callbacks: {
                                label: function(tooltipItem) {
                                    let explanation;
                                    switch (tooltipItem.label) {
                                        case 'PM 10':
                                            explanation = 'Particulate Matter PM10: Feinstaub aus Verkehr, Bremsen- und Reifenabrieb.';
                                            break;
                                        case 'PM 2.5':
                                            explanation = 'Particulate Matter PM2.5: Kleinere Feinstaubpartikel, die tiefer in die Lungen eindringen und durch Abgase freigesetzt werden.';
                                            break;
                                        case 'NO2':
                                            explanation = 'Nitrogen Dioxide (NO2): Ein Schlüsselindikator für die Emissionen aus Verbrennungsmotoren.';
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

            // Sicherstellen, dass der Container existiert
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
