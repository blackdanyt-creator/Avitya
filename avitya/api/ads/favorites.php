<?php

require_once '../config/database.php';
require_once '../response.php';

if (!isset($_SESSION['user_id'])) jsonResponse(['error' => 'Авторизуйтесь'], 401);

$pdo = $GLOBALS['pdo'];
$stmt = $pdo->prepare("SELECT ads.*, users.nickname AS user_name
FROM favorites f
    JOIN ads ON f.ad_id = ads.id
    LEFT JOIN users ON ads.user_id = users.id
WHERE f.user_id = ?
ORDER BY ads.created_at DESC
");
$stmt->execute([$_SESSION['user_id']]);
$ads = $stmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse($ads);
