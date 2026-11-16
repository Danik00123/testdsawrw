<?php
// Налаштування підключення до MySQL (Ketrix / phpMyAdmin)
// База s173_1 — ігрова БД сервера (таблиця ugta_players)

define('DB_HOST', 'db.ketrix.cloud');
define('DB_PORT', '3306');
define('DB_NAME', 's173_1');
define('DB_USER', 'u173_cbl97fch3w');
define('DB_PASS', 'ymyQa7Kd8fcbSAvVbf7ePyts');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    }
    return $pdo;
}

// Спільні помічники для всіх api-скриптів
session_start();
header('Content-Type: application/json; charset=utf-8');

function json_out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_login(): array {
    if (empty($_SESSION['player_id'])) {
        json_out(['ok' => false, 'error' => 'not_authorized'], 401);
    }
    return ['id' => $_SESSION['player_id']];
}
