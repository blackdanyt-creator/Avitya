<?php

require_once '../config/database.php';
require_once '../response.php';

$pdo = $GLOBALS['pdo'] ?? null;
if (!$pdo) {
    jsonResponse(['error' => 'Database connection failed'], 500);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$phone = trim($data['phone'] ?? '');
$password = $data['password'] ?? '';

if (empty($phone) || empty($password)) {
    jsonResponse(['error' => 'Телефон и пароль обязательны'], 400);
}

$stmt = $pdo->prepare("SELECT id, nickname, email, password, city FROM users WHERE phone = ?");
$stmt->execute([$phone]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['nickname'] = $user['nickname'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['city'] = $user['city'];

    jsonResponse(['success' => true, 'user' => [
        'id' => $user['id'],
        'nickname' => $user['nickname'],
        'email' => $user['email'],
        'city' => $user['city'],
    ]]);
} else {
    jsonResponse(['success' => false, 'message' => 'Неверный телефон или пароль'], 401);
}
