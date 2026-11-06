(function () {
  const PROFILE_KEY = 'asj.profile.v1';
  const PROGRESS_KEY = 'asj.progress.v1';
  const THEME_KEY = 'asj.theme.v1';
  const page = location.pathname.split('/').pop() || 'index.html';
  const themeLink = document.createElement('link');
  themeLink.rel = 'stylesheet';
  themeLink.href = new URL('tjkt-theme.css', location.href).href;
  document.head.appendChild(themeLink);
  const states = new Map();
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const labIndex = tabs.findIndex(tab => /lab terminal/i.test(tab.dataset.title || ''));
  const quizIndex = tabs.findIndex(tab => tab.querySelector('#quiz'));
  const isProject = page === 'projek.html';
  const isKuma = page === 'kuma.html';
  const projectFinalIndex = isProject ? tabs.length - 1 : -1;
  const lessonIndexes = tabs
    .map((tab, index) => ({ tab, index }))
    .filter(({ tab, index }) => {
      if (isProject) return index !== projectFinalIndex;
      if (index === labIndex || index === quizIndex) return false;
      return !/^(cover|brief soal)$/i.test(tab.dataset.title || '');
    })
    .map(({ index }) => index);
  const hasTabCourse = tabs.length > 0 && (isProject || (labIndex >= 0 && quizIndex >= 0));
  let profile = '';
  let restoring = false;
  let clearingProgress = false;
  let saveTimer;
  let learning = { lessons: [], labCompleted: false, projectCompleted: false, certificateIssuedAt: '', bestQuizScore: 0 };
  let activeTabIndex = 0;

  function allLessonsComplete() {
    return lessonIndexes.every(index => learning.lessons.includes(index));
  }

  function canOpenTab(index) {
    if (!hasTabCourse || index < 0 || index >= tabs.length) return !hasTabCourse;
    if (isProject && index === projectFinalIndex) return allLessonsComplete();
    if (index === labIndex) return allLessonsComplete();
    if (index === quizIndex) return allLessonsComplete() && learning.labCompleted;
    const position = lessonIndexes.indexOf(index);
    return position < 0 || lessonIndexes.slice(0, position).every(previous => learning.lessons.includes(previous));
  }

  function scoreQuiz() {
    const cards = Array.from(document.querySelectorAll('.q'));
    const answered = cards.filter(card => Array.from(card.querySelectorAll('button')).some(button => button.disabled)).length;
    const correct = cards.filter(card =>
      Array.from(card.querySelectorAll('button')).some(button => button.classList.contains('r')) &&
      !Array.from(card.querySelectorAll('button')).some(button => button.classList.contains('x'))
    ).length;
    return { answered, correct, total: cards.length, percent: cards.length ? Math.round(correct * 100 / cards.length) : 0 };
  }

  function certificateEligible() {
    if (!hasTabCourse && !isKuma) return false;
    if (!allLessonsComplete()) return false;
    if (isKuma) return learning.labCompleted;
    if (isProject) return learning.projectCompleted;
    return learning.labCompleted && learning.bestQuizScore >= 75;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function printCertificate() {
    if (!certificateEligible()) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.alert('Jendela sertifikat diblokir. Izinkan pop-up untuk mencetak sertifikat.');
      return;
    }
    if (!learning.certificateIssuedAt) learning.certificateIssuedAt = new Date().toISOString();
    saveNow();
    const title = document.querySelector('.tab h1')?.textContent || document.querySelector('main h1')?.textContent || 'Modul Praktikum ASJ';
    const issued = new Date(learning.certificateIssuedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const score = quizIndex >= 0
      ? `<div class="best-score"><span>NILAI POSTTEST TERBAIK</span><strong>${learning.bestQuizScore}/100</strong></div>`
      : '<div class="best-score"><span>STATUS PENYELESAIAN</span><strong>TUNTAS</strong></div>';
    const logoUrl = new URL('logo-tjkt.png', location.href).href;
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Sertifikat - ${escapeHtml(profile)}</title><style>
      @page{size:A4 landscape;margin:0}*{box-sizing:border-box}html,body{width:297mm;height:210mm;margin:0}body{padding:1mm;background:#fff;color:#092246;font-family:Arial,Helvetica,sans-serif}
      .certificate{height:208mm;border:1px solid #092246;position:relative;overflow:hidden;background:#fff}
      .rail{position:absolute;inset:0 auto 0 0;width:32mm;background:#071e3d}
      .rail:before{content:"";position:absolute;top:0;right:-1px;width:10mm;height:100%;border-right:1.2mm solid #00bfe9;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,0 93%,70% 87%,70% 13%)}
      .rail:after{content:"";position:absolute;left:0;bottom:10mm;width:27mm;height:2mm;background:#f21d32;box-shadow:0 -188mm 0 #f21d32}
      .rail-label{position:absolute;left:11mm;top:70mm;color:#fff;writing-mode:vertical-rl;transform:rotate(180deg);font-size:8pt;letter-spacing:3px;font-weight:bold}
      .rail-lines{position:absolute;left:6mm;top:14mm;width:20mm;height:150mm;border-left:1px solid #00bfe9;border-bottom:1px solid #00bfe9;opacity:.8}
      .rail-lines:before,.rail-lines:after{content:"";position:absolute;left:5mm;top:0;width:12mm;height:40mm;border-left:1px solid #00bfe9;border-bottom:1px solid #00bfe9;transform:skewY(42deg)}
      .rail-lines:after{top:auto;bottom:8mm;transform:skewY(-42deg)}
      .content{position:absolute;inset:0 0 0 32mm;padding:8mm 13mm 7mm 4mm;display:flex;flex-direction:column}
      .top{height:29mm;display:flex;align-items:center;gap:6mm;border-bottom:1px solid #9ed5e5}
      .top img{width:22mm;height:22mm;object-fit:contain}.brand{font-weight:800;font-size:13pt;letter-spacing:2px}.school{font-weight:bold;font-size:7.5pt;letter-spacing:1px;margin-top:1mm}.motto{font-size:6.5pt;letter-spacing:1px;color:#075b91;margin-top:2mm}
      .type{margin-left:auto;text-align:right;font-size:6.5pt;font-weight:bold;letter-spacing:1px;color:#075b91}
      .main-copy{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 5mm}
      h1{font:400 29pt Georgia,"Times New Roman",serif;letter-spacing:5px;margin:0 0 1mm}.sub{color:#075b91;font-size:8pt;font-weight:bold;letter-spacing:4px}
      .given{font-size:10pt;color:#53657b;margin:7mm 0 2mm}.name{font:700 25pt Georgia,"Times New Roman",serif;color:#075b91;border-bottom:1px solid #45badd;padding:0 8mm 2mm;max-width:100%;overflow-wrap:anywhere}
      .description{font-size:10pt;color:#53657b;margin:5mm 0 3mm}.module{font-size:15pt;font-weight:700;color:#102b4c;max-width:220mm}.note{font-size:8pt;color:#61738a;margin-top:4mm}
      .bottom{height:29mm;border-top:1px solid #9ed5e5;display:flex;align-items:center;justify-content:space-between;position:relative;padding-top:2mm}
      .date-label,.score-label{font-size:7pt;letter-spacing:1px;color:#62738b;font-weight:bold}.date-value{font-size:10pt;font-weight:bold;margin-top:1mm}
      .best-score{text-align:right}.best-score strong{display:block;color:#075b91;font-size:16pt;margin-top:1mm}
      .credits{position:absolute;bottom:0;left:30%;right:30%;text-align:center;font-size:6.5pt;color:#61738a;line-height:1.6}
      .corners{position:absolute;right:0;bottom:0;width:40mm;height:16mm;border-bottom:1px solid #00bfe9;border-right:1px solid #00bfe9;clip-path:polygon(30% 0,100% 0,100% 100%,0 100%,0 92%,75% 92%)}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head><body><main class="certificate"><aside class="rail"><div class="rail-lines"></div><div class="rail-label">TJKT LEARNING HUB</div></aside>
      <div class="content"><header class="top"><img src="${escapeHtml(logoUrl)}" alt="Logo TJKT"><div><div class="brand">TJKT LEARNING HUB</div><div class="school">SMK WIKRAMA BOGOR</div><div class="motto">TERKONEKSI · TERPROTEKSI · PRESISI</div></div><div class="type">PEMBELAJARAN<br>MANDIRI</div></header>
      <section class="main-copy"><h1>SERTIFIKAT</h1><div class="sub">PENYELESAIAN MODUL</div><div class="given">Diberikan kepada</div><div class="name">${escapeHtml(profile || 'Peserta')}</div>
      <p class="description">Atas penyelesaian pembelajaran interaktif pada modul</p><div class="module">${escapeHtml(title)}</div>
      <p class="note">Sebagai catatan capaian belajar dan pengembangan kompetensi secara mandiri.</p></section>
      <footer class="bottom"><div><div class="date-label">TANGGAL PENERBITAN</div><div class="date-value">${escapeHtml(issued)}</div></div>${score}
      <div class="credits">Media belajar interaktif · Karya Ardi Ariansyah<br>Sertifikat penyelesaian mandiri — bukan sertifikat resmi dan tidak memverifikasi identitas.</div></footer></div><div class="corners"></div></main></body></html>`);
    printWindow.document.close();
    const image = printWindow.document.querySelector('img');
    if (image.complete) setTimeout(() => printWindow.print(), 100);
    else image.addEventListener('load', () => printWindow.print(), { once: true });
  }

  function makeLearningCard(tab, kind) {
    if (!tab || tab.querySelector('.asj-learning-card[data-kind]')) return;
    const card = document.createElement('section');
    card.className = 'asj-learning-card';
    card.setAttribute('aria-live', 'polite');
    const message = document.createElement('p');
    message.className = 'asj-learning-message';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'asj-learning-button';
    card.append(message, button);
    tab.appendChild(card);
    if (kind === 'lesson') {
      const index = tabs.indexOf(tab);
      button.addEventListener('click', () => {
        if (activeTabIndex !== index || !canOpenTab(index)) return;
        if (!learning.lessons.includes(index)) learning.lessons.push(index);
        refreshLearningUI();
        saveNow();
      });
      card.dataset.kind = kind;
      card.dataset.index = String(index);
    } else if (kind === 'lab' || kind === 'project') {
      button.addEventListener('click', () => {
        const key = kind === 'lab' ? 'labCompleted' : 'projectCompleted';
        if (kind === 'lab' && activeTabIndex !== labIndex) return;
        if (kind === 'project' && activeTabIndex !== projectFinalIndex) return;
        if (!learning[key] && !window.confirm('Konfirmasi bahwa Anda telah menyelesaikan praktik dan tugas pada bagian ini.')) return;
        learning[key] = !learning[key];
        refreshLearningUI();
        saveNow();
      });
      card.dataset.kind = kind;
      if (kind === 'project') {
        const certificate = document.createElement('button');
        certificate.type = 'button';
        certificate.className = 'asj-learning-button asj-certificate-button';
        certificate.textContent = 'Cetak sertifikat';
        certificate.addEventListener('click', printCertificate);
        card.appendChild(certificate);
      }
    } else if (kind === 'quiz') {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'asj-learning-button asj-secondary';
      retry.textContent = 'Ulangi latihan';
      retry.addEventListener('click', () => {
        document.querySelectorAll('.q').forEach(question => {
          question.querySelectorAll('button').forEach(answer => {
            answer.disabled = false;
            answer.classList.remove('r', 'x');
          });
          question.querySelectorAll('.co').forEach(feedback => feedback.remove());
        });
        learning.certificateIssuedAt = '';
        refreshLearningUI();
        saveNow();
      });
      const certificate = document.createElement('button');
      certificate.type = 'button';
      certificate.className = 'asj-learning-button asj-certificate-button';
      certificate.textContent = 'Cetak sertifikat';
      certificate.addEventListener('click', printCertificate);
      card.append(retry, certificate);
      card.dataset.kind = kind;
    }
  }

  function addLearningUI() {
    if (!hasTabCourse && !isKuma) return;
    const style = document.createElement('style');
    style.textContent = '.asj-learning-card{margin:20px 0;padding:16px 18px;border:1px solid var(--bd,#cfdcd6);border-left:5px solid var(--pri,#0f766e);border-radius:10px;background:var(--card,#fff);color:var(--fg,#14261f)}.asj-learning-card p{margin:0 0 10px}.asj-course-guidance{background:var(--acc,#dff3ef)}.asj-learning-button{margin:4px 8px 4px 0;padding:8px 14px;border:0;border-radius:7px;background:var(--pri,#0f766e);color:#fff;font:inherit;cursor:pointer}.asj-learning-button:disabled{opacity:.6;cursor:default}.asj-learning-button.asj-secondary{background:var(--acc,#dff3ef);color:var(--fg,#14261f)}.asj-learning-button.asj-certificate-button{background:#a3262a}.asj-lock-message{position:fixed;right:16px;bottom:16px;z-index:10001;max-width:min(420px,calc(100% - 32px));padding:12px 16px;border-radius:8px;background:#10243e;color:#fff;box-shadow:0 4px 14px #0004}.asj-lock-message[hidden]{display:none}nav button:disabled,.nv button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:768px){main{padding-top:145px}.hw{flex-wrap:wrap}.hw>.portal-link{order:0}.hw>.actions{order:1;margin-left:auto}.hw>#nav{order:2;flex:0 0 100%;width:100%;min-width:0}.hw>#asj-profile-control{order:3;flex:0 0 100%;justify-content:flex-end}}';
    document.head.appendChild(style);
    if (hasTabCourse) {
      const guidance = document.createElement('section');
      guidance.className = 'asj-learning-card asj-course-guidance';
      guidance.innerHTML = isProject
        ? '<strong>Alur penyelesaian proyek</strong><p>Selesaikan dan tandai tiap bagian secara berurutan, lalu buka lembar penilaian dan konfirmasikan proyek selesai untuk memperoleh sertifikat.</p>'
        : '<strong>Alur penyelesaian modul</strong><p>Baca tiap materi secara berurutan dan tekan <b>Tandai selesai dibaca</b> untuk membuka materi berikutnya. Setelah semua materi, selesaikan lab dan konfirmasikan; latihan terbuka terakhir. Nilai posttest minimal 75 diperlukan untuk sertifikat.</p>';
      tabs[0].appendChild(guidance);
      lessonIndexes.forEach(index => makeLearningCard(tabs[index], 'lesson'));
      if (labIndex >= 0) makeLearningCard(tabs[labIndex], 'lab');
      if (quizIndex >= 0) makeLearningCard(tabs[quizIndex], 'quiz');
      if (isProject) makeLearningCard(tabs[projectFinalIndex], 'project');
    } else {
      const card = document.createElement('section');
      card.className = 'asj-learning-card';
      card.innerHTML = '<p class="asj-learning-message" aria-live="polite"></p><button class="asj-learning-button" type="button"></button><button class="asj-learning-button asj-certificate-button" type="button">Cetak sertifikat</button>';
      document.querySelector('main').appendChild(card);
      card.querySelector('.asj-learning-button:not(.asj-certificate-button)').addEventListener('click', () => {
        if (!learning.labCompleted && !window.confirm('Konfirmasi bahwa Anda telah menyelesaikan seluruh langkah evaluasi simulasi.')) return;
        learning.labCompleted = !learning.labCompleted;
        refreshLearningUI();
        saveNow();
      });
      card.querySelector('.asj-certificate-button').addEventListener('click', printCertificate);
    }
    const notice = document.createElement('div');
    notice.className = 'asj-lock-message';
    notice.setAttribute('role', 'status');
    notice.hidden = true;
    document.body.appendChild(notice);
    refreshLearningUI();
  }

  function refreshLearningUI() {
    if (!hasTabCourse && !isKuma) return;
    if (hasTabCourse) {
      const navButtons = Array.from(document.querySelectorAll('#nav button'));
      tabs.forEach((tab, index) => {
        const navButton = navButtons[index];
        if (navButton) {
          navButton.disabled = !canOpenTab(index);
          navButton.title = navButton.disabled ? 'Selesaikan materi sebelumnya terlebih dahulu.' : '';
        }
        tab.querySelectorAll('.nv button').forEach(button => {
          if (/Berikutnya/i.test(button.textContent || '')) button.disabled = !canOpenTab(index + 1);
        });
      });
      document.querySelectorAll('.asj-learning-card').forEach(card => {
        const kind = card.dataset.kind;
        const index = Number(card.dataset.index);
        const message = card.querySelector('.asj-learning-message');
        const button = card.querySelector('.asj-learning-button:not(.asj-secondary):not(.asj-certificate-button)');
        if (kind === 'lesson') {
          const done = learning.lessons.includes(index);
          message.textContent = done ? 'Materi ini sudah ditandai selesai.' : 'Baca materi sampai selesai, lalu tandai untuk membuka bagian berikutnya.';
          button.textContent = done ? '✓ Materi selesai dibaca' : 'Tandai selesai dibaca';
          button.disabled = done;
        } else if (kind === 'lab') {
          message.textContent = learning.labCompleted ? 'Lab sudah dikonfirmasi selesai.' : 'Selesaikan praktik pada terminal simulator, lalu konfirmasikan di sini.';
          button.textContent = learning.labCompleted ? '✓ Lab selesai' : 'Konfirmasi lab selesai';
          button.disabled = learning.labCompleted;
        } else if (kind === 'project') {
          message.textContent = learning.projectCompleted ? 'Penyelesaian proyek sudah dikonfirmasi.' : 'Setelah menuntaskan tugas proyek dan memeriksa rubrik, konfirmasikan penyelesaian.';
          button.textContent = learning.projectCompleted ? '✓ Proyek selesai' : 'Konfirmasi proyek selesai';
          button.disabled = learning.projectCompleted;
          card.querySelector('.asj-certificate-button').disabled = !certificateEligible();
        } else if (kind === 'quiz') {
          const score = scoreQuiz();
          if (score.total && score.answered === score.total && score.percent > learning.bestQuizScore) {
            learning.bestQuizScore = score.percent;
          }
          const passed = learning.bestQuizScore >= 75;
          message.textContent = score.total
            ? `Nilai posttest terbaik: ${learning.bestQuizScore}/100. ${passed ? 'Nilai minimum 75% tercapai.' : score.answered === score.total ? 'Belum mencapai nilai minimum 75%; ulangi latihan.' : 'Jawab seluruh soal; nilai minimum kelulusan 75%.'}`
            : 'Soal latihan belum tersedia.';
          card.querySelector('.asj-secondary').hidden = score.answered === 0;
          card.querySelector('.asj-certificate-button').disabled = !certificateEligible();
        }
      });
    } else if (isKuma) {
      const card = document.querySelector('main > .asj-learning-card');
      if (card) {
        card.querySelector('.asj-learning-message').textContent = learning.labCompleted
          ? 'Evaluasi simulasi sudah dikonfirmasi selesai.'
          : 'Selesaikan langkah evaluasi simulasi Uptime Kuma, lalu konfirmasikan di sini.';
        const confirmButton = card.querySelector('.asj-learning-button:not(.asj-certificate-button)');
        confirmButton.textContent = learning.labCompleted ? '✓ Evaluasi selesai' : 'Konfirmasi evaluasi selesai';
        confirmButton.disabled = learning.labCompleted;
        card.querySelector('.asj-certificate-button').disabled = !certificateEligible();
      }
    }
  }

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
      const selected = buttons.findIndex(button => button.classList.contains('x'));
      const correct = buttons.findIndex(button => button.classList.contains('r'));
      return {
        selected: selected < 0 ? correct : selected,
        correct,
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
      learning,
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

  function addBrandLogo() {
    const header = document.querySelector('header .hw');
    const brand = header?.querySelector('.portal-link, a.brand');
    if (!brand || brand.querySelector('.asj-header-logo')) return;
    const logo = document.createElement('img');
    logo.className = 'asj-header-logo';
    logo.src = new URL('logo-tjkt.png', location.href).href;
    logo.alt = 'Logo TJKT SMK Wikrama Bogor';
    if (brand.querySelector('svg')) brand.querySelector('svg').replaceWith(logo);
    else brand.prepend(logo);
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
    },
    canOpenTab(index) {
      return canOpenTab(index);
    },
    setActiveTab(index) {
      activeTabIndex = index;
      refreshLearningUI();
    },
    notifyLocked(index) {
      const notice = document.querySelector('.asj-lock-message');
      if (!notice) return;
      let message = 'Selesaikan bagian sebelumnya terlebih dahulu.';
      if (index === labIndex) message = 'Selesaikan dan tandai semua materi sebelum membuka lab terminal.';
      else if (index === quizIndex) message = 'Selesaikan semua materi dan konfirmasikan lab sebelum membuka latihan.';
      else if (isProject && index === projectFinalIndex) message = 'Selesaikan dan tandai semua bagian proyek sebelum membuka rubrik.';
      else {
        const firstIncomplete = lessonIndexes.find(lessonIndex => lessonIndex < index && !learning.lessons.includes(lessonIndex));
        if (firstIncomplete !== undefined) message = 'Tandai materi "' + (tabs[firstIncomplete].dataset.title || 'sebelumnya') + '" selesai terlebih dahulu.';
      }
      notice.textContent = message;
      notice.hidden = false;
      clearTimeout(notice.hideTimer);
      notice.hideTimer = setTimeout(() => { notice.hidden = true; }, 3500);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    addBrandLogo();
    addProfileControl();
    if (!profile) showNameDialog(false);

    restoring = true;
    try {
      const progress = readJson(PROGRESS_KEY, {});
      const saved = progress[page];
      if (saved) {
        if (saved.learning && Array.isArray(saved.learning.lessons)) {
          learning = {
            lessons: saved.learning.lessons.filter(index => lessonIndexes.includes(index)),
            labCompleted: saved.learning.labCompleted === true,
            projectCompleted: saved.learning.projectCompleted === true,
            certificateIssuedAt: typeof saved.learning.certificateIssuedAt === 'string' ? saved.learning.certificateIssuedAt : '',
            bestQuizScore: Number.isFinite(saved.learning.bestQuizScore) ? Math.min(100, Math.max(0, saved.learning.bestQuizScore)) : 0
          };
        }
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

    activeTabIndex = tabs.findIndex(tab => tab.classList.contains('active'));
    if (activeTabIndex < 0) activeTabIndex = 0;
    addLearningUI();
    document.addEventListener('click', event => {
      scheduleSave();
      if (event.target.closest('.q')) setTimeout(refreshLearningUI, 0);
    });
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
