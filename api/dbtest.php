<?php
// ТИМЧАСОВИЙ діагностичний файл — видали після перевірки!
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db();
    $stmt = $pdo->query('SELECT COUNT(*) c FROM ugta_players');
    $count = $stmt->fetch()['c'];

    $stmt = $pdo->prepare('SELECT id, login FROM ugta_players LIMIT 1');
    $stmt->execute();
    $sample = $stmt->fetch();

    echo json_encode([
        'ok' => true,
        'players_count' => (int)$count,
        'sample_login' => $sample['login'] ?? null,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
