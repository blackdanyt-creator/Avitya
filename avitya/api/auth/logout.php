<?php

require_once '../config/database.php';
require_once '../response.php';

session_destroy();
jsonResponse(['success' => true]);
