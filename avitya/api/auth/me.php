<?php

require_once '../config/database.php';
require_once '../response.php';

if (isset($_SESSION['user_id'])) {
    jsonResponse([
        'logged_in' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'nickname' => $_SESSION['nickname'],
            'email' => $_SESSION['email'] ?? '',
            'city' => $_SESSION['city'] ?? ''
        ]
    ]);
} else {
    jsonResponse(['logged_in' => false]);
}
