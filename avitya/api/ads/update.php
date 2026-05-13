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

if (!isset($_SESSION['user_id'])) jsonResponse(['error' => 'Авторизуйтесь'], 401);

$id = $_POST['id'] ?? null;
if (!$id || !is_numeric($id)) {
    jsonResponse(['error' => 'Wrong id'], 400);
}

$stmt = $pdo->prepare("SELECT user_id, image FROM ads WHERE id = ?");
$stmt->execute([$id]);
$ad = $stmt->fetch();

if (!$ad || $ad['user_id'] != $_SESSION['user_id']) {
    jsonResponse(['error' => 'Вы не владелец этого объявления'], 403);
}

$title = trim($_POST['title'] ?? '');
$category = trim($_POST['category'] ?? '');
$price = (int)$_POST['price'] ?? 0;
$city = trim($_POST['city'] ?? '');
$description = trim($_POST['description'] ?? '');
$state = trim($_POST['state'] ?? 'Б/у');
$availability = trim($_POST['availability'] ?? 'В наличии');

$image = $ad['image'];

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/avitya/img/ads-imgs/';
    $fileName = time() . '_' . basename($_FILES['image']['name']);
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
        $image = '/avitya/img/ads-imgs/' . $fileName;
    }
}

if ($image && strpos($image, './') === 0) {
    $fileName = basename($image);
    $image = '/avitya/img/ads-imgs/' . basename($image);
}

$stmt = $pdo->prepare("
    UPDATE ads
    SET title = ?,
        category = ?,
        price = ?,
        city = ?,
        image = ?,
        description = ?,
        state = ?,
        availability = ?
    WHERE id = ?
");

$success = $stmt->execute([
    $title, $category, $price, $city, $image, $description, $state, $availability, $id
]);

if ($success) {
    jsonResponse(['success' => true, 'message' => 'Объявление успешно обновлено', 'id' => $id]);
} else {
    jsonResponse(['error' => 'Failed to update ad'], 500);
}
