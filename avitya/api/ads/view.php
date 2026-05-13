<?php

require_once '../config/database.php';
require_once '../response.php';

$pdo = $GLOBALS['pdo'] ?? null;
if (!$pdo) {
    jsonResponse(['error' => 'Database connection failed'], 500);
}

$id = $_GET['id'] ?? null;
$userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;

if (!$id || !is_numeric($id)) {
    jsonResponse(['error' => 'Wrong id'], 400);
}

$stmt = $pdo->prepare("SELECT
ads.id,
ads.title,
ads.price,
ads.city,
ads.image,
ads.description, 
ads.category,
ads.state,
ads.availability,
ads.user_id,
users.nickname AS user_name,
CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS is_favorited
FROM ads
    LEFT JOIN users ON ads.user_id = users.id
    LEFT JOIN favorites f ON f.ad_id = ads.id AND f.user_id = ?
WHERE ads.id = ?
");
$stmt->execute([$userId, $id]);
$ad = $stmt->fetch(PDO::FETCH_ASSOC);

if ($ad) {
    jsonResponse($ad);
} else {
    jsonResponse(['error' => 'Ads not found'], 404);
}
