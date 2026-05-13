<?php

require_once '../config/database.php';
require_once '../response.php';

$pdo = $GLOBALS['pdo'] ?? null;
if (!$pdo) jsonResponse(['error' => 'Database connection failed'], 500);
if (!isset($_SESSION['user_id'])) jsonResponse(['error' => 'Авторизуйтесь'], 401);

$action = $_GET['action'] ?? 'dialogs';
$me = (int)$_SESSION['user_id'];

if ($action === 'dialogs' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("
SELECT
    u.id AS user_id,
    u.nickname,
    m.message AS last_message,
    m.created_at AS last_time,
    SUM(CASE WHEN m.to_user_id = ? AND m.is_read = 0 THEN 1 ELSE 0
        END) AS unread
FROM messages m
            JOIN users u ON u.id = IF(m.from_user_id = ?, m.to_user_id, m.from_user_id)
                       WHERE m.from_user_id = ? OR m.to_user_id = ?
                       GROUP BY u.id, u.nickname, m.message, m.created_at
                       ORDER BY m.created_at DESC
                       ");
    $stmt->execute([$me, $me, $me, $me]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $dialogs = [];
    foreach ($rows as $row) {
        if (!isset($dialogs[$row['user_id']])) {
            $dialogs[$row['user_id']] = $row;
        }
    }
    jsonResponse(array_values($dialogs));
}

if ($action === 'messages' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $with = (int)($_GET['with'] ?? 0);
    if (!$with) jsonResponse(['error' => 'Параметр with обязателен'], 400);

    $pdo->prepare("UPDATE messages SET is_read = 1 WHERE from_user_id = ? AND to_user_id = ?")->execute([$with, $me]);

    $stmt = $pdo->prepare("
SELECT
m.id,
m.from_user_id,
m.to_user_id,
m.message AS text,
m.created_at AS created,
m.is_read,
    u.nickname AS from_nickname
    FROM messages m
    JOIN users u ON u.id = m.from_user_id
    WHERE (m.from_user_id = ? AND m.to_user_id = ?)
    OR (m.from_user_id = ? AND m.to_user_id = ?)
    ORDER BY m.created_at ASC
    ");
    $stmt->execute([$me, $with, $with, $me]);
    jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'send' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $to = (int)($data['to_user_id'] ?? 0);
    $text = trim($data['text'] ?? '');

    if (!$to || !$text) jsonResponse(['error' => 'Поля to_user_id и text обязательны'], 400);
    if ($to === $me) jsonResponse(['error' => 'Нельзя писать самому себе'], 400);

    $stmt = $pdo->prepare("INSERT INTO messages (from_user_id, to_user_id, message) VALUES (?, ?, ?)");
    $stmt->execute([$me, $to, $text]);

    jsonResponse(['success' => true, 'id' => $pdo->lastInsertId()]);
}

jsonResponse(['error' => 'Unknown action'], 400);
