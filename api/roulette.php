<?php
require __DIR__ . '/config.php';

$me = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'bad_request'], 400);
}

// Вартість одного спіну — ігрові гроші (ugta_players.money)
$SPIN_COST = 100000;

$pdo = db();
$pdo->beginTransaction();

// Списуємо вартість спіну
$stmt = $pdo->prepare('UPDATE ugta_players SET money = money - ? WHERE id = ? AND money >= ?');
$stmt->execute([$SPIN_COST, $me['id'], $SPIN_COST]);

if ($stmt->rowCount() === 0) {
    $pdo->rollBack();
    json_out(['ok' => false, 'error' => 'not_enough_balance'], 400);
}

// Випадковий приз із вагами
$prizes = [
    ['label' => '50 000',      'amount' => 50000,       'weight' => 30],
    ['label' => '100 000',     'amount' => 100000,      'weight' => 25],
    ['label' => '250 000',     'amount' => 250000,      'weight' => 18],
    ['label' => '500 000',     'amount' => 500000,      'weight' => 12],
    ['label' => '1 000 000',   'amount' => 1000000,     'weight' => 8],
    ['label' => 'JACKPOT',     'amount' => 10000000,    'weight' => 2],
    ['label' => 'ВІДЖИЛКА',    'amount' => 0,           'weight' => 5],
];

$totalWeight = array_sum(array_column($prizes, 'weight'));
$roll = random_int(1, $totalWeight);
$acc = 0;
$won = $prizes[0];
foreach ($prizes as $p) {
    $acc += $p['weight'];
    if ($roll <= $acc) { $won = $p; break; }
}

// Нараховуємо приз (0 = просто вартість спіну)
if ($won['amount'] > 0) {
    $pdo->prepare('UPDATE ugta_players SET money = money + ? WHERE id = ?')
        ->execute([$won['amount'], $me['id']]);
}

$stmt = $pdo->prepare('SELECT money FROM ugta_players WHERE id = ?');
$stmt->execute([$me['id']]);
$newBalance = (int)$stmt->fetch()['money'];

// Історія спінів
$pdo->prepare('INSERT INTO site_spins (player_id, prize, amount) VALUES (?, ?, ?)')
    ->execute([$me['id'], $won['label'], $won['amount']]);

$pdo->commit();

json_out([
    'ok' => true,
    'prize' => $won['label'],
    'amount' => $won['amount'],
    'cost' => $SPIN_COST,
    'balance' => $newBalance,
]);
