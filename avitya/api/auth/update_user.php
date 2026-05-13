<?php

require_once '../config/database.php';
require_once '../response.php';

$pdo = $GLOBALS['pdo'] ?? null;
if (!$pdo) jsonResponse(['error' => 'Database connection failed'], 500);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
if (!isset($_SESSION['user_id'])) jsonResponse(['error' => 'Авторизуйтесь'], 401);

$data = json_decode(file_get_contents('php://input'), true);

$nickname = trim($data["nickname"] ?? '');
$email = trim($data["email"] ?? '');
$city = trim($data["city"] ?? '');
$password = $data["password"] ?? '';
$userId = (int)$_SESSION['user_id'];

if (empty($nickname) || empty($email)) {
    jsonResponse(['error' => 'Никнейм и email обязательны'], 400);
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE (nickname = ? OR email =?) AND id != ?");
$stmt->execute([$nickname, $email, $userId]);
if ($stmt->fetch()) {
    jsonResponse(['error' => 'Никейм или email уже заняты'], 409);
}

if (!empty($password)) {
    if (strlen($password) < 6) {
        jsonResponse(['error' => 'Пароль должен быть не меньше 6 символов'], 400);
    }
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET nickname = ?, email = ?, city = ?, password = ? WHERE id = ?");
    $stmt->execute([$nickname, $email, $city, $hashed, $userId]);
} else {
    $stmt = $pdo->prepare("UPDATE users SET nickname = ?, email = ?, city = ? WHERE id = ?");
    $stmt->execute([$nickname, $email, $city, $userId]);
}

$_SESSION['nickname'] = $nickname;
$_SESSION['email'] = $email;
$_SESSION['city'] = $city;

jsonResponse(['success' => true, 'user' => [
    'nickname' => $nickname,
    'email' => $email,
    'city' => $city,
]]);
