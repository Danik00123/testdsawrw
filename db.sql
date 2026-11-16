-- Кабінет вже інтегрований з ігровою БД (s173_1).
-- Ці таблиці вже створені в базі — файл лишено для документації/відновлення.

USE s173_1;

-- Назви фракцій/структур (id = ugta_players.faction_id)
CREATE TABLE IF NOT EXISTS site_factions (
    id INT UNSIGNED PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    color VARCHAR(16) NOT NULL DEFAULT '#f59e0b'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Історія спінів рулетки на сайті
CREATE TABLE IF NOT EXISTS site_spins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    player_id INT UNSIGNED NOT NULL,
    prize VARCHAR(64) NOT NULL,
    amount BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Початкові фракції (id 0 і 3 — єдині, що зараз використовуються в грі)
INSERT IGNORE INTO site_factions (id, name, color) VALUES
    (0, 'Без фракції', '#6b7280'),
    (3, 'Структура #3', '#f59e0b');
