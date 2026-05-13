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
$nickname = trim($data['nickname'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$city = trim($data['city'] ?? 'Город');

if (empty($phone) || empty($nickname) || empty($email) || empty($password)) {
    jsonResponse(['error' => 'Все поля обязательны'], 400);
}

$hashed = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO users (phone, nickname, email, password, city) VALUES (?, ?, ?, ?, ?)");

try {
    $stmt->execute([$phone, $nickname, $email, $hashed, $city]);
    jsonResponse(['success' => true, 'message' => 'Вы успешно зарегистрировались!']);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        jsonResponse(['error' => 'Телефон, никнейм или email уже заняты'], 409);
    }
    jsonResponse(['error' => 'Server Error'], 500);
}
