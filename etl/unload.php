<?php

require_once 'config.php'; // Stelle sicher, dass dies auf deine tatsächliche Konfigurationsdatei verweist

header('Content-Type: application/json');

try {
    $pdo = new PDO($dsn, $username, $password, $options);

    // Prüft, ob ein Datum in der URL übergeben wurde, ansonsten nutzt es das heutige Datum
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

    // SQL-Abfrage, die nur die Datensätze auswählt, bei denen `parkhaus_id` nicht null ist und das Datum zum `timestamp` passt
    $stmt = $pdo->prepare("
        SELECT timestamp, parkhaus_id, parkhaus_name, parkhaus_total, parkhaus_free 
        FROM airquality_parkhaus 
        WHERE parkhaus_id IS NOT NULL
        AND DATE(timestamp) = :date
        ORDER BY timestamp DESC
    ");
    
    // Bindet das Datum als Parameter an die SQL-Abfrage
    $stmt->execute([':date' => $date]);

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC); // Speichert die Ergebnisse als assoziatives Array

    echo json_encode($results); // Gibt die Daten im JSON-Format aus
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]); // Gibt einen Fehler im JSON-Format aus, falls eine Ausnahme auftritt
}
