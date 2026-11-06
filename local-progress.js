(function () {
  const PROFILE_KEY = 'asj.profile.v1';
  const PROGRESS_KEY = 'asj.progress.v1';
  const THEME_KEY = 'asj.theme.v1';
  const page = location.pathname.split('/').pop() || 'index.html';
  const states = new Map();
  let profile = '';
  let restoring = false;
  let clearingProgress = false;
  let saveTimer;

  function readJson(key, fallback) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }

  function storageWarning(error) {
    let warning = document.getElementById('asj-storage-warning');
    if (!warning) {
      warning = document.createElement('div');
      warning.id = 'asj-storage-warning';
      warning.setAttribute('role', 'status');
      document.body.appendChild(warning);
    }
    warning.textContent = 'Penyimpanan lokal bermasalah; progres belum tentu tersimpan. ' + error;
  }

  try {
    profile = localStorage.getItem(PROFILE_KEY) || '';
    const theme = localStorage.getItem(THEME_KEY);
    if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
  } catch (error) {
    storageWarning(error.message);
  }

  function logSnapshot(log) {
    if (!log) return [];
    return Array.from(log.children).map(row => ({
      text: row.textContent || '',
      className: ['g', 'b', 'y', 'r', 'd'].includes(row.className) ? row.className : ''
    }));
  }

  function restoreLog(log, rows) {
    if (!log || !Array.isArray(rows)) return;
    log.replaceChildren();
    rows.forEach(row => {
      const line = document.createElement('div');
      if (['g', 'b', 'y', 'r', 'd'].includes(row.className)) line.className = row.className;
      line.textContent = row.text;
      log.appendChild(line);
    });
  }

  function quizSnapshot() {
    return Array.from(document.querySelectorAll('.q')).map(card => {
      const buttons = Array.from(card.querySelectorAll('button'));
      const selected = buttons.findIndex(button => button.disabled);
      return {
        selected,
        correct: buttons.findIndex(button => button.classList.contains('r')),
        feedback: card.querySelector('.co')?.textContent || ''
      };
    });
  }

  function restoreQuiz(saved) {
    if (!Array.isArray(saved)) return;
    Array.from(document.querySelectorAll('.q')).forEach((card, index) => {
      const answer = saved[index];
      if (!answer || answer.selected < 0) return;
      const buttons = Array.from(card.querySelectorAll('button'));
      buttons.forEach(button => { button.disabled = true; });
      if (buttons[answer.correct]) buttons[answer.correct].classList.add('r');
      if (buttons[answer.selected] && answer.selected !== answer.correct) buttons[answer.selected].classList.add('x');
      if (answer.feedback) {
        const feedback = document.createElement('div');
        feedback.className = 'co';
        feedback.textContent = answer.feedback;
        card.appendChild(feedback);
      }
    });
  }

  function moduleData() {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const activeTab = tabs.findIndex(tab => tab.classList.contains('active'));
    const fields = {};
    document.querySelectorAll('input[id], textarea[id], select[id]').forEach(input => {
      if (input.type !== 'password') fields[input.id] = input.value;
    });
    const custom = {};
    states.forEach((state, name) => { custom[name] = state.capture(); });
    return {
      activeTab: activeTab < 0 ? 0 : activeTab,
      quizzes: quizSnapshot(),
      missions: Array.from(document.querySelectorAll('.ms li')).map(item => item.classList.contains('ok')),
      fields,
      custom
    };
  }

  function saveNow() {
    if (restoring || clearingProgress || !profile) return;
    try {
      const progress = readJson(PROGRESS_KEY, {});
      progress[page] = moduleData();
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      const warning = document.getElementById('asj-storage-warning');
      if (warning) warning.remove();
    } catch (error) {
      storageWarning(error.message);
    }
  }

  function scheduleSave() {
    if (!profile || restoring) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 120);
  }

  function addProfileControl() {
    const header = document.querySelector('header .hw');
    if (!header) return;
    const existing = document.getElementById('asj-profile-control');
    if (existing) {
      existing.querySelector('span').textContent = 'Peserta: ' + profile;
      return;
    }
    const control = document.createElement('div');
    control.id = 'asj-profile-control';
    const label = document.createElement('span');
    label.textContent = 'Peserta: ' + profile;
    const change = document.createElement('button');
    change.type = 'button';
    change.textContent = 'Ganti nama';
    change.addEventListener('click', () => showNameDialog(true));
    control.append(label, change);
    header.appendChild(control);
  }

  function showNameDialog(isChange) {
    let overlay = document.getElementById('asj-name-overlay');
    if (!overlay) {
      const style = document.createElement('style');
      style.textContent = '#asj-profile-control{display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:13px;color:var(--mut,#52675e)}#asj-profile-control button{border:1px solid var(--bd,#cfdcd6);border-radius:7px;background:var(--card,#fff);color:var(--fg,#13241d);padding:5px 8px;cursor:pointer;font:inherit}#asj-name-overlay{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:rgba(5,15,12,.76);font:16px/1.5 system-ui,sans-serif}#asj-name-dialog{width:min(440px,100%);padding:26px;border-radius:14px;background:var(--card,#fff);color:var(--fg,#13241d);box-shadow:0 15px 50px #0005}#asj-name-dialog h2{margin:0 0 8px;font-size:1.35rem}#asj-name-dialog p{margin:0 0 16px;color:var(--mut,#52675e)}#asj-name-dialog input{width:100%;padding:11px 12px;border:1px solid var(--bd,#cfdcd6);border-radius:8px;font:inherit}#asj-name-dialog button{margin-top:14px;padding:10px 16px;border:0;border-radius:8px;background:var(--pri,#0f766e);color:white;font:inherit;font-weight:600;cursor:pointer}#asj-name-error{min-height:1.4em;margin-top:8px;color:#b91c1c;font-size:14px}#asj-storage-warning{position:fixed;right:12px;bottom:12px;z-index:10001;max-width:min(460px,calc(100% - 24px));padding:12px 16px;border-radius:8px;background:#7f1d1d;color:white;font:14px/1.4 system-ui,sans-serif}';
      document.head.appendChild(style);
      overlay = document.createElement('div');
      overlay.id = 'asj-name-overlay';
      overlay.innerHTML = '<form id="asj-name-dialog"><h2>Mulai belajar Linux</h2><p id="asj-name-description"></p><label for="asj-name-input">Nama peserta</label><input id="asj-name-input" maxlength="60" autocomplete="name" required><div id="asj-name-error" role="alert"></div><button type="submit">Simpan nama</button></form>';
      document.body.appendChild(overlay);
      overlay.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        const input = document.getElementById('asj-name-input');
        const nextName = input.value.trim();
        if (!nextName) {
          document.getElementById('asj-name-error').textContent = 'Nama wajib diisi.';
          input.focus();
          return;
        }
        if (isChange && nextName !== profile && !window.confirm('Mengganti nama akan menghapus seluruh progres lokal. Lanjutkan?')) return;
        try {
          if (isChange && nextName !== profile) {
            clearingProgress = true;
            localStorage.removeItem(PROGRESS_KEY);
          }
          localStorage.setItem(PROFILE_KEY, nextName);
          profile = nextName;
          overlay.remove();
          addProfileControl();
          if (isChange && nextName !== input.defaultValue) location.reload();
        } catch (error) {
          storageWarning(error.message);
          document.getElementById('asj-name-error').textContent = 'Nama gagal disimpan di perangkat ini.';
        }
      });
    }
    const input = document.getElementById('asj-name-input');
    input.value = isChange ? profile : '';
    input.defaultValue = profile;
    document.getElementById('asj-name-description').textContent = isChange
      ? 'Nama bisa diganti kapan saja. Jika diganti, seluruh progres belajar di perangkat ini akan direset.'
      : 'Isi nama terlebih dahulu. Nama dan progres belajar akan disimpan hanya di browser/perangkat ini.';
    document.getElementById('asj-name-error').textContent = '';
    overlay.hidden = false;
    input.focus();
  }

  window.ASJ = {
    registerState(name, capture, restore) {
      states.set(name, { capture, restore });
    },
    saveNow,
    openTab(index) {
      if (typeof window.show === 'function') window.show(index);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    addProfileControl();
    if (!profile) showNameDialog(false);

    restoring = true;
    try {
      const progress = readJson(PROGRESS_KEY, {});
      const saved = progress[page];
      if (saved) {
        if (saved.fields) {
          Object.entries(saved.fields).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input && input.type !== 'password') input.value = value;
          });
        }
        Object.entries(saved.custom || {}).forEach(([name, value]) => {
          const state = states.get(name);
          if (state) state.restore(value);
        });
        restoreQuiz(saved.quizzes);
        if (typeof window.show === 'function' && Number.isInteger(saved.activeTab)) window.show(saved.activeTab);
      }
    } catch (error) {
      storageWarning(error.message);
    }
    restoring = false;

    document.addEventListener('click', scheduleSave);
    document.addEventListener('input', scheduleSave);
    document.addEventListener('change', scheduleSave);
    document.addEventListener('keydown', event => {
      if (event.key === 'Enter' && event.target.id === 'in') setTimeout(saveNow, 0);
    });
    const observer = new MutationObserver(scheduleSave);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    const themeObserver = new MutationObserver(() => {
      try {
        const theme = document.documentElement.dataset.theme;
        if (theme === 'dark' || theme === 'light') localStorage.setItem(THEME_KEY, theme);
      } catch (error) {
        storageWarning(error.message);
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('pagehide', saveNow);
    if (profile) scheduleSave();
  });
})();
