<?php
require_once '../config/database.php';
require_once '../response.php';

$pdo = $GLOBALS['pdo'] ?? null;
if (!$pdo) {
    jsonResponse(['error' => 'Database connection failed'], 500);
}

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['error' => 'Авторизуйтесь'], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$projectFolder = 'avitya';
$uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/' . $projectFolder . '/img/ads-imgs/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$imagePath = '/' . $projectFolder . '/img/ads-imgs/banka20litrov.jpg';

if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
    $fileName = time() . '_' . basename($_FILES['image']['name']);
    $targetFile = $uploadDir . $fileName;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
        $imagePath = '/' . $projectFolder . '/img/ads-imgs/' . $fileName;
    }
}

$stmt = $pdo->prepare("INSERT INTO ads 
    (title, price, city, description, user_name, category, state, availability, image, user_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$stmt->execute([
    $_POST['title'] ?? 'Без названия',
    $_POST['price'] ?? 0,
    $_POST['city'] ?? 'Город',
    $_POST['description'] ?? '',
    $_SESSION['nickname'],
    $_POST['category'] ?? '',
    $_POST['state'] ?? 'Б/у',
    $_POST['availability'] ?? 'В наличии',
    $imagePath,
    $_SESSION['user_id']
]);

jsonResponse(['success' => true, 'id' => $pdo->lastInsertId()]);