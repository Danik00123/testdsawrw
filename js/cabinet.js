// Особистий кабінет Aventis Online
document.addEventListener('DOMContentLoaded', async () => {
    const loading = document.getElementById('loading');
    const content = document.getElementById('cabinet-content');

    // --- Авторизація ---
    let profileData = null;
    try {
        const res = await fetch('api/profile.php');
        const data = await res.json();
        if (!data || !data.ok) {
            window.location.href = 'index.html';
            return;
        }
        profileData = data;
    } catch (e) {
        window.location.href = 'index.html';
        return;
    }

    const p = profileData.profile;

    // --- Заповнення профілю ---
    document.getElementById('nav-email').textContent = p.email;
    document.getElementById('p-id').textContent = '#' + p.id;
    document.getElementById('p-nickname').textContent = p.nickname || 'Гравець #' + p.id;
    document.getElementById('p-level').textContent = p.level;
    document.getElementById('p-exp').textContent = p.exp.toLocaleString('uk-UA');
    document.getElementById('p-balance').textContent = p.balance.toLocaleString('uk-UA');
    document.getElementById('avatar-letter').textContent = (p.nickname || 'A').trim().charAt(0).toUpperCase();

    if (p.created_at) {
        const d = new Date(p.created_at.replace(' ', 'T'));
        document.getElementById('p-created').textContent = d.toLocaleDateString('uk-UA');
    }

    const factionEl = document.getElementById('p-faction');
    if (p.faction_name && p.faction_name !== 'Без фракції') {
        factionEl.textContent = p.faction_name;
        factionEl.style.color = p.faction_color || '#f59e0b';
    } else {
        factionEl.textContent = 'Без фракції';
        factionEl.style.color = '#6b7280';
    }

    const expWrap = document.querySelector('.exp-bar').parentElement;
    if (p.exp_percent != null && p.exp_next) {
        document.getElementById('exp-fill').style.width = p.exp_percent + '%';
        document.getElementById('exp-text').textContent =
            `${p.exp.toLocaleString('uk-UA')} / ${p.exp_next.toLocaleString('uk-UA')} XP (${p.exp_percent}%)`;
    } else {
        document.querySelector('.exp-bar').style.display = 'none';
        document.getElementById('exp-text').textContent = `EXP: ${p.exp.toLocaleString('uk-UA')}`;
        expWrap.style.marginTop = '0.5rem';
    }

    loading.style.display = 'none';
    content.style.display = 'block';
    renderHistory(profileData.spins || []);

    // --- Вихід ---
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('api/auth.php?action=logout');
        window.location.href = 'index.html';
    });

    // --- Рулетка ---
    const TILE_PITCH_FALLBACK = 140; // width 130 + gap 10

    // Призи (мають збігатися з api/roulette.php)
    const PRIZES = [
        { label: '50 000',      cls: '' },
        { label: '100 000',     cls: '' },
        { label: '250 000',     cls: '' },
        { label: '500 000',     cls: '' },
        { label: '1 000 000',   cls: '' },
        { label: 'JACKPOT',     cls: 'tile-jackpot' },
        { label: 'ВІДЖИЛКА',    cls: 'tile-bad' },
    ];

    const strip = document.getElementById('roulette-strip');
    const windowEl = document.querySelector('.roulette-window');
    const spinBtn = document.getElementById('spin-btn');
    const resultEl = document.getElementById('roulette-result');
    let spinning = false;

    function makeTile(prize) {
        const t = document.createElement('div');
        t.className = 'roulette-tile ' + prize.cls;
        t.innerHTML = `<div class="tile-prize">${prize.label}</div>
                       <div class="tile-sub">${prize.label === 'ВІДЖИЛКА' ? 'програш' : '+ГРН'}</div>`;
        return t;
    }

    function randomPrize() {
        return PRIZES[Math.floor(Math.random() * PRIZES.length)];
    }

    function buildStrip(winningLabel) {
        strip.innerHTML = '';
        strip.style.transition = 'none';
        strip.style.transform = 'translateX(0)';

        const TILE_COUNT = 70;
        const winIndex = TILE_COUNT - 8 - Math.floor(Math.random() * 6); // ~56-62

        for (let i = 0; i < TILE_COUNT; i++) {
            let prize;
            if (i === winIndex) {
                prize = PRIZES.find(x => x.label === winningLabel) || randomPrize();
            } else {
                prize = randomPrize();
            }
            strip.appendChild(makeTile(prize));
        }
        return { winIndex, winTile: strip.children[winIndex] };
    }

    spinBtn.addEventListener('click', async () => {
        if (spinning) return;

        // Спочатку запитуємо сервер — він вже знає результат і списав кошти
        let data;
        try {
            const res = await fetch('api/roulette.php', { method: 'POST' });
            data = await res.json();
        } catch (e) {
            resultEl.textContent = 'Помилка з\'єднання з сервером';
            resultEl.className = 'roulette-result lose';
            return;
        }

        if (!data || !data.ok) {
            resultEl.textContent = data && data.error === 'not_enough_balance'
                ? 'Недостатньо коштів для спіну'
                : 'Помилка сервера';
            resultEl.className = 'roulette-result lose';
            return;
        }

        spinning = true;
        spinBtn.disabled = true;
        resultEl.textContent = '';
        resultEl.className = 'roulette-result';

        const { winTile } = buildStrip(data.prize);

        // Чекаємо кадр, щоб transition не застосувався до початкового стану
        requestAnimationFrame(() => {
            const winCenter = winTile.offsetLeft + winTile.offsetWidth / 2;
            const viewportCenter = windowEl.clientWidth / 2;
            const targetX = viewportCenter - winCenter;

            // Додаємо кілька "зайвих" обертів: зсуваємо ще ліворуч на N пітчів
            const extraLaps = 5;
            const finalX = targetX - extraLaps * TILE_PITCH_FALLBACK;

            strip.style.transition = 'transform 4.2s cubic-bezier(0.12, 0.6, 0.05, 1)';
            strip.style.transform = `translateX(${finalX}px)`;

            setTimeout(() => finishSpin(data), 4300);
        });
    });

    function finishSpin(data) {
        spinning = false;
        spinBtn.disabled = false;

        // Оновлюємо баланс
        document.getElementById('p-balance').textContent = data.balance.toLocaleString('uk-UA');

        const isWin = data.amount > 0;
        const isPush = data.amount === 0;
        resultEl.textContent = isPush
            ? `Без виграшу: ${data.prize}`
            : `${isWin ? 'Виграш' : 'Програш'}: ${data.prize} (${data.amount > 0 ? '+' : ''}${data.amount.toLocaleString('uk-UA')})`;
        resultEl.className = 'roulette-result ' + (isWin ? 'win' : 'lose');

        // Додаємо в історію
        const historyList = document.getElementById('history-list');
        if (historyList.querySelector('.history-item') === null) {
            historyList.innerHTML = '';
        }
        const item = document.createElement('div');
        item.className = 'history-item';
        const now = new Date();
        const time = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        item.innerHTML = `
            <span style="color:rgba(255,255,255,0.6);">${time}</span>
            <span>${data.prize}</span>
            <span class="h-amount ${data.amount >= 0 ? 'pos' : 'neg'}">${data.amount >= 0 ? '+' : ''}${data.amount.toLocaleString('uk-UA')}</span>`;
        historyList.prepend(item);
    }

    function renderHistory(spins) {
        const list = document.getElementById('history-list');
        if (!spins.length) return;
        list.innerHTML = '';
        spins.forEach(s => {
            const d = new Date((s.created_at || '').replace(' ', 'T'));
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span style="color:rgba(255,255,255,0.6);">${isNaN(d) ? '' : d.toLocaleDateString('uk-UA')}</span>
                <span>${s.prize}</span>
                <span class="h-amount ${s.amount >= 0 ? 'pos' : 'neg'}">${s.amount >= 0 ? '+' : ''}${s.amount.toLocaleString('uk-UA')}</span>`;
            list.appendChild(item);
        });
    }
});
