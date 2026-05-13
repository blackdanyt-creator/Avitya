<?php

require_once '../config/database.php';
require_once '../response.php';

$pdo = $GLOBALS['pdo'] ?? null;
if (!$pdo) {
    jsonResponse(['error' => 'Database connection failed'], 500);
}

$category = $_GET['category'] ?? null;

$userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;

$sql = "
SELECT
ads.*,
users.nickname as user_name,
CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS is_favorited
FROM ads
LEFT JOIN users ON ads.user_id = users.id
LEFT JOIN favorites f ON f.ad_id = ads.id AND f.user_id = ?
";

$params = [$userId];

if ($category && $category !== 'all') {
    $sql .= " WHERE category = ?";
    $params[] = $category;
}

$sql .= " ORDER BY ads.id DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$ads = $stmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse($ads);
