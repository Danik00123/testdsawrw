<?php
require __DIR__ . '/config.php';

$action = $_GET['action'] ?? 'login';

// POST api/auth.php?action=login  { email, password }
// GET  api/auth.php?action=logout
if ($action === 'logout') {
    session_destroy();
    json_out(['ok' => true]);
}

if ($action !== 'login' || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'bad_request'], 400);
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

if ($email === '' || $password === '') {
    json_out(['ok' => false, 'error' => 'empty_fields'], 400);
}

// Акаунти гри зберігаються в ugta_players (login = пошта, password — відкритим текстом)
$stmt = db()->prepare('
    SELECT id, login, email, password, banned
    FROM ugta_players
    WHERE login = ? OR email = ?
    LIMIT 1
');
$stmt->execute([$email, $email]);
$user = $stmt->fetch();

if (!$user || !hash_equals((string)$user['password'], (string)$password)) {
    json_out(['ok' => false, 'error' => 'invalid_credentials'], 401);
}

if (!empty($user['banned']) && $user['banned'] > time()) {
    json_out(['ok' => false, 'error' => 'banned'], 403);
}

$_SESSION['player_id'] = (int)$user['id'];
$_SESSION['player_email'] = $user['email'] ?: $user['login'];

json_out(['ok' => true]);
