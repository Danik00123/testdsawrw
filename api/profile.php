<?php
require __DIR__ . '/config.php';

$me = require_login();

$stmt = db()->prepare('
    SELECT
        p.id,
        p.login,
        p.email,
        p.nickname,
        p.level,
        p.exp,
        p.money,
        p.faction_id,
        p.reg_date,
        f.name AS faction_name,
        f.color AS faction_color
    FROM ugta_players p
    LEFT JOIN site_factions f ON f.id = p.faction_id
    WHERE p.id = ?
    LIMIT 1
');
$stmt->execute([$me['id']]);
$profile = $stmt->fetch();

if (!$profile) {
    json_out(['ok' => false, 'error' => 'not_found'], 404);
}

$stmt = db()->prepare('SELECT prize, amount, created_at FROM site_spins WHERE player_id = ? ORDER BY id DESC LIMIT 10');
$stmt->execute([$me['id']]);
$spins = $stmt->fetchAll();

json_out([
    'ok' => true,
    'profile' => [
        'id' => (int)$profile['id'],
        'email' => $profile['email'] ?: $profile['login'],
        'nickname' => $profile['nickname'],
        'level' => (int)$profile['level'],
        'exp' => (int)$profile['exp'],
        'exp_next' => null,
        'exp_percent' => null,
        'faction_name' => $profile['faction_name'],
        'faction_color' => $profile['faction_color'],
        'balance' => (int)$profile['money'],
        'created_at' => !empty($profile['reg_date']) ? date('Y-m-d H:i:s', (int)$profile['reg_date']) : null,
    ],
    'spins' => $spins,
]);
