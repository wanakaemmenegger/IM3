<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// Include the config file for database connection
require_once 'config.php';

// Establish database connection
try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Function to fetch parking data
function fetchParkhausData() {
    $url = "https://api.parkendd.de/Zuerich";

    // Initialize a cURL session
    $ch = curl_init($url);

    // Set options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    // Execute the cURL session and get the content
    $response = curl_exec($ch);

    // Check if cURL encountered an error
    if (curl_errno($ch)) {
        echo "Error fetching Parkhaus data: " . curl_error($ch) . "\n";
        return null;
    }

    // Close the cURL session
    curl_close($ch);

    // Decode the JSON response and return data
    return json_decode($response, true);
}

// Function to fetch air quality data
function fetchAirQualityData() {
    $url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=47.3667&longitude=8.55&hourly=pm10,pm2_5,nitrogen_dioxide&past_days=5&forecast_days=1";

    // Initialize a cURL session
    $ch = curl_init($url);

    // Set options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    // Execute the cURL session and get the content
    $response = curl_exec($ch);

    // Check if cURL encountered an error
    if (curl_errno($ch)) {
        echo "Error fetching Air Quality data: " . curl_error($ch) . "\n";
        return null;
    }

    // Close the cURL session
    curl_close($ch);

    // Decode the JSON response and return data
    return json_decode($response, true);
}

// Fetch data
$dataparkhaus = fetchParkhausData();
$dataairquality = fetchAirQualityData();

// Check if data fetching was successful
if ($dataparkhaus === null || $dataairquality === null) {
    echo "Failed to fetch data. Exiting.\n";
    exit();
}

// Prepare the SQL statement
$sql = "INSERT INTO airquality_parkhaus
        (timestamp, pm10, pm2_5, nitrogen_dioxide, parkhaus_id, parkhaus_name, parkhaus_total, parkhaus_free) 
        VALUES (:timestamp, :pm10, :pm2_5, :nitrogen_dioxide, :parkhaus_id, :parkhaus_name, :parkhaus_total, :parkhaus_free)";

// Prepare the statement
$stmt = $pdo->prepare($sql);

// Insert air quality data
foreach ($dataairquality['hourly']['time'] as $index => $time) {
    try {
        $stmt->execute([
            ':timestamp' => $time,
            ':pm10' => $dataairquality['hourly']['pm10'][$index] ?? null,
            ':pm2_5' => $dataairquality['hourly']['pm2_5'][$index] ?? null,
            ':nitrogen_dioxide' => $dataairquality['hourly']['nitrogen_dioxide'][$index] ?? null,
            ':parkhaus_id' => null,  // Air quality data does not have parking data
            ':parkhaus_name' => null,
            ':parkhaus_total' => null,
            ':parkhaus_free' => null
        ]);

        // Provide feedback on success or failure
        if ($stmt->rowCount()) {
            echo "Inserted Air Quality data for timestamp: $time\n";
        } else {
            echo "Failed to insert Air Quality data for timestamp: $time\n";
        }
    } catch (PDOException $e) {
        echo "Error inserting air quality data: " . $e->getMessage() . "\n";
    }
}

// Insert parking data
foreach ($dataparkhaus['lots'] as $lot) {
    try {
        $stmt->execute([
            ':timestamp' => $dataparkhaus['last_updated'],
            ':pm10' => null,  // Parking data does not have air quality data
            ':pm2_5' => null,
            ':nitrogen_dioxide' => null,
            ':parkhaus_id' => $lot['id'],
            ':parkhaus_name' => $lot['name'],
            ':parkhaus_total' => $lot['total'],
            ':parkhaus_free' => $lot['free']
        ]);

        // Provide feedback on success or failure
        if ($stmt->rowCount()) {
            echo "Inserted Parkhaus data for parking lot: {$lot['name']}\n";
        } else {
            echo "Failed to insert Parkhaus data for parking lot: {$lot['name']}\n";
        }
    } catch (PDOException $e) {
        echo "Error inserting Parkhaus data: " . $e->getMessage() . "\n";
    }
}
?>
