<?php

require_once '../config/database.php';
require_once '../response.php';

$pdo = $GLOBALS['pdo'] ?? null;
if (!$pdo) {
    jsonResponse(['error' => 'Database connection failed'], 500);
}

if (!isset($_SESSION['user_id'])) jsonResponse(['error' => 'Авторизуйтесь'], 401);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);

$ad_id = (int)($_POST['ad_id'] ?? 0);
if (!$ad_id) jsonResponse(['error' => 'Wrong ad_id'], 400);

$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT id FROM favorites WHERE user_id = ? AND ad_id = ?");
$stmt->execute([$user_id, $ad_id]);

if ($stmt->fetch()) {
    $pdo->prepare("DELETE FROM favorites WHERE user_id = ? AND ad_id = ?")->execute([$user_id, $ad_id]);
    jsonResponse(['success' => true, 'favorited' => false]);
} else {
    $pdo->prepare("INSERT INTO favorites (user_id, ad_id) VALUES (?, ?)")->execute([$user_id, $ad_id]);
    jsonResponse(['success' => true, 'favorited' => true]);
}
