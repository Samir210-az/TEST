(function () {
    var box = document.getElementById('domainsContainer');
    if (!box) return;

    var TONES = [
        ['#fdba74', '#ea580c'], ['#7dd3fc', '#0284c7'], ['#c4b5fd', '#7c3aed'],
        ['#f9a8d4', '#db2777'], ['#5eead4', '#0d9488'], ['#86efac', '#16a34a'],
        ['#fde047', '#ca8a04'], ['#a5b4fc', '#4f46e5'], ['#fda4af', '#e11d48'],
        ['#67e8f9', '#0891b2']
    ];
    var SCALE = [
        ['0', 'Bacarmır / tam kömək', '#f87171', '#dc2626'],
        ['1', 'Minimal uyğunluq', '#fb923c', '#ea580c'],
        ['2', 'Qismən uyğun (dəstək ilə)', '#facc15', '#ca8a04'],
        ['3', 'Davamlı monitorinqlə uyğun', '#a3e635', '#65a30d'],
        ['4', 'Yaşa tam uyğun', '#4ade80', '#16a34a']
    ];
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var busy = false;
    var queued = false;
    var toastTimer = null;

    var container = document.querySelector('.container');
    var bar = document.createElement('div');
    bar.className = 'eir-bar no-print';
    bar.innerHTML = '<div class="eir-bar-top"><span id="eirBarText">Doldurulub</span><b id="eirBarCount">0 / 0</b></div>' +
        '<div class="eir-track"><i id="eirBarFill"></i></div>';
    container.insertBefore(bar, container.firstChild);

    var legend = document.createElement('div');
    legend.className = 'eir-legend no-print';
    SCALE.forEach(function (s) {
        var item = document.createElement('span');
        var num = document.createElement('b');
        num.textContent = s[0];
        num.style.setProperty('--f1', s[2]);
        num.style.setProperty('--f2', s[3]);
        item.appendChild(num);
        item.appendChild(document.createTextNode(s[1]));
        legend.appendChild(item);
    });
    box.parentNode.insertBefore(legend, box);

    var toast = document.createElement('div');
    toast.className = 'eir-toast no-print';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    function areas() { return Array.prototype.slice.call(box.querySelectorAll('.domain-area')); }
    function bodyOf(area) { return area.querySelector('.domain-body'); }
    function headerOf(area) { return area.querySelector('.domain-header'); }
    function isOpen(area) { return bodyOf(area).style.display !== 'none'; }
    function items(area) { return area.querySelectorAll('.subskill-item'); }
    function answeredIn(area) { return area.querySelectorAll('.subskill-item .rating-opt[data-val].selected').length; }

    function setOpen(area, open) {
        if (isOpen(area) === open) return;
        busy = true;
        headerOf(area).click();
        busy = false;
    }

    function openOnly(target) {
        areas().forEach(function (a) { setOpen(a, a === target); });
    }

    function decorateItem(item) {
        var group = item.querySelector('.rating-buttons');
        if (!group) return;
        group.querySelectorAll('.rating-opt').forEach(function (btn) {
            btn.setAttribute('role', 'button');
            btn.tabIndex = 0;
            btn.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
            var v = btn.dataset.val;
            if (v === undefined) return;
            var label = btn.textContent.replace(/^\d\s*-\s*/, '');
            label = label.charAt(0).toLocaleUpperCase('az') + label.slice(1);
            btn.dataset.label = label;
            btn.setAttribute('aria-label', v + ' — ' + label);
            btn.textContent = v;
        });
        var hint = document.createElement('div');
        hint.className = 'scale-hint';
        hint.hidden = true;
        item.appendChild(hint);
    }

    function decorate(area, index) {
        area.dataset.eir = '1';
        var tone = TONES[index % TONES.length];
        area.style.setProperty('--tone-a', tone[0]);
        area.style.setProperty('--tone-b', tone[1]);

        var title = area.querySelector('.domain-title');
        var raw = title.textContent.trim();
        var m = raw.match(/^(\p{Extended_Pictographic}️?)\s*(.*)$/u);
        var glyph = m ? m[1] : '●';
        var name = m ? m[2] : raw;
        title.textContent = '';
        var tile = document.createElement('span');
        tile.className = 'tile';
        var g = document.createElement('span');
        g.className = 'glyph';
        g.textContent = glyph;
        tile.appendChild(g);
        var label = document.createElement('span');
        label.className = 'dname';
        label.textContent = name;
        title.appendChild(tile);
        title.appendChild(label);

        var header = headerOf(area);
        var meta = document.createElement('span');
        meta.className = 'dmeta no-print';
        meta.textContent = '0/' + items(area).length;
        header.insertBefore(meta, header.querySelector('.collapse-icon'));
        header.setAttribute('role', 'button');
        header.tabIndex = 0;
        header.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                header.click();
            }
        });
        header.addEventListener('click', function () {
            if (busy) return;
            if (isOpen(area)) {
                busy = true;
                areas().forEach(function (other) {
                    if (other !== area && isOpen(other)) headerOf(other).click();
                });
                busy = false;
            }
        });

        items(area).forEach(decorateItem);
    }

    function sync() {
        queued = false;
        var list = areas();
        var fresh = false;
        list.forEach(function (area, i) {
            if (!area.dataset.eir) {
                decorate(area, i);
                fresh = true;
            }
        });

        var total = 0;
        var done = 0;
        list.forEach(function (area) {
            var count = items(area).length;
            var n = answeredIn(area);
            total += count;
            done += n;

            items(area).forEach(function (item) {
                var sel = item.querySelector('.rating-opt[data-val].selected');
                var hint = item.querySelector('.scale-hint');
                item.classList.toggle('answered', !!sel);
                if (hint) {
                    var text = sel ? sel.dataset.label : '';
                    if (hint.textContent !== text) hint.textContent = text;
                    hint.hidden = !sel;
                }
            });

            var meta = area.querySelector('.dmeta');
            var label = n + '/' + count;
            if (meta && meta.textContent !== label) meta.textContent = label;
            area.style.setProperty('--p', count ? Math.round(n / count * 100) : 0);
            area.classList.toggle('done', n === count && count > 0);
            if (n < count) delete area.dataset.celebrated;
            else if (fresh) area.dataset.celebrated = '1';
            headerOf(area).setAttribute('aria-expanded', isOpen(area) ? 'true' : 'false');
        });

        var pct = total ? Math.round(done / total * 100) : 0;
        var countEl = document.getElementById('eirBarCount');
        var text = done + ' / ' + total;
        if (countEl.textContent !== text) countEl.textContent = text;
        document.getElementById('eirBarFill').style.width = pct + '%';
        var all = total > 0 && done === total;
        bar.classList.toggle('complete', all);
        var barText = document.getElementById('eirBarText');
        var msg = all ? 'Hamısı tamamdır, hesabatı hazırlaya bilərsiniz' : 'Doldurulub';
        if (barText.textContent !== msg) barText.textContent = msg;
        var report = document.getElementById('reportBtn');
        if (report) report.classList.toggle('pulse', all);

        if (fresh) {
            var next = list.filter(function (a) { return answeredIn(a) < items(a).length; })[0] || list[0];
            if (next) openOnly(next);
        }
    }

    function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(sync);
    }

    function notify(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
    }

    function afterAnswer(area) {
        if (answeredIn(area) !== items(area).length || area.dataset.celebrated) return;
        area.dataset.celebrated = '1';
        notify('Sahə tamamlandı: ' + area.querySelector('.dname').textContent);
        setTimeout(function () {
            var next = areas().filter(function (a) { return a !== area && answeredIn(a) < items(a).length; })[0];
            if (!next) {
                setOpen(area, false);
                return;
            }
            openOnly(next);
            next.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }, 650);
    }

    box.addEventListener('click', function (e) {
        var opt = e.target.closest('.rating-opt');
        var area = opt && opt.closest('.domain-area');
        if (!area || e.defaultPrevented) return;

        if (opt.dataset.val !== undefined && !reduceMotion) {
            opt.classList.remove('pop');
            void opt.offsetWidth;
            opt.classList.add('pop');
            opt.addEventListener('animationend', function () { opt.classList.remove('pop'); }, { once: true });
        }
        setTimeout(function () { afterAnswer(area); }, 0);
    }, true);

    new MutationObserver(schedule).observe(box, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class']
    });
    sync();
})();
