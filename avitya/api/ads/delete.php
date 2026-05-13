<?php

require_once '../config/database.php';
require_once '../response.php';

$pdo = $GLOBALS['pdo'] ?? null;
if (!$pdo) jsonResponse(['error' => 'Database connection failed'], 500);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
if (!isset($_SESSION['user_id'])) jsonResponse(['error' => 'Авторизуйтесь'], 401);

$data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$id = (int)($data['id'] ?? 0);
if (!$id) jsonResponse(['error' => 'Wrong id'], 400);

$stmt = $pdo->prepare("SELECT user_id FROM ads WHERE id = ?");
$stmt->execute([$id]);
$ad = $stmt->fetch();

if (!$ad) jsonResponse(['error' => 'Объявление не найдено'], 404);
if ($ad['user_id'] != $_SESSION['user_id']) jsonResponse(['error' => 'Вы не владелец этого объявления'], 403);

$pdo->prepare("DELETE FROM ads WHERE id = ?")->execute([$id]);

jsonResponse(['success' => true]);
