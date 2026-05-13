<?php

require_once '../config/database.php';
require_once '../response.php';

$pdo = $GLOBALS['pdo'] ?? null;
if (!$pdo) jsonResponse(['error' => 'Database connection failed'], 500);

$query = trim($_GET['q'] ?? '');
$limit = (int)($_GET['limit'] ?? 0);
$userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;

if (strlen($query) < 2) {
    jsonResponse([]);
}

$like = '%' . $query . '%';

$sql = "
    SELECT
        ads.id,
        ads.title,
        ads.price,
        ads.city,
        ads.image,
        CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS is_favorited
    FROM ads
    LEFT JOIN favorites f ON f.ad_id = ads.id AND f.user_id = ?
    WHERE ads.title LIKE ? OR ads.description LIKE ?
    ORDER BY ads.created_at DESC
";

$params = [$userId, $like, $like];

if ($limit > 0) {
    $sql .= " LIMIT " . $limit;
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
