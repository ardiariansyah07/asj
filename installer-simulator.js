(function () {
  const steps = [
    { title: 'Firmware Boot Device Selection', text: 'POST selesai. Firmware BIOS/UEFI menemukan Debian 12 Netinst pada media optik/USB. Pilih antarmuka installer yang akan digunakan.', options: ['Graphical install', 'Install'] },
    { title: 'Loading installer components', text: 'Memuat Linux kernel dan installer initrd dari media Debian 12. Tahap ini otomatis; tunggu hingga komponen installer siap.' },
    { title: 'Select a language', text: 'Bahasa ini digunakan selama instalasi dan menjadi bahasa default sistem.', options: ['English - English', 'Indonesian - Bahasa Indonesia'] },
    { title: 'Select your location', text: 'Pilih lokasi untuk mengatur zona waktu dan mirror repositori.', options: ['Asia', 'Indonesia'] },
    { title: 'Configure the keyboard', text: 'Pilih tata letak keyboard yang digunakan pada server.', options: ['American English', 'Indonesian'] },
    { title: 'Detect network hardware', text: 'Installer memindai perangkat jaringan dan memuat driver yang diperlukan.' },
    { title: 'Configure the network', text: 'Pilih konfigurasi otomatis DHCP. Jika jaringan lab menyediakan DHCP, alamat IP akan diperoleh otomatis.', options: ['Configure network automatically (DHCP)', 'Configure network manually'] },
    { title: 'Configure the network - Hostname', text: 'Masukkan nama host pendek untuk server. Nama host boleh berisi huruf, angka, dan tanda hubung.', field: 'hostname', label: 'Hostname', value: 'srv-wikrama' },
    { title: 'Configure the network - Domain name', text: 'Domain boleh dikosongkan untuk lab lokal.', field: 'domain', label: 'Domain name', value: 'sekolah.lan' },
    { title: 'Set up users and passwords - root password', text: 'Untuk konfigurasi Debian dengan sudo, biarkan password root kosong. Installer akan mengunci login password root dan memberi hak sudo kepada akun reguler pertama.', options: ['Leave root password empty (recommended for this lab)', 'Set a root password'] },
    { title: 'Set up users and passwords - Confirm root password', text: 'Masukkan password root yang akan digunakan untuk akun administrator. Input password tidak disimpan ke progres.', field: 'rootPassword', label: 'Root password', value: '', password: true },
    { title: 'Set up users - Full name', text: 'Nama ini digunakan sebagai nama lengkap akun reguler.', field: 'fullName', label: 'Full name', value: 'Siswa TKJ' },
    { title: 'Set up users - Username', text: 'Masukkan nama akun reguler untuk login ke Debian.', field: 'username', label: 'Username', value: 'siswa' },
    { title: 'Set up users - Password', text: 'Masukkan password akun reguler. Untuk terminal latihan, akun siswa simulasi menggunakan password latihan siswa123. Input password tidak disimpan ke progres.', field: 'userPassword', label: 'User password', value: '', password: true },
    { title: 'Configure the clock', text: 'Atur zona waktu sistem berdasarkan lokasi yang dipilih.', options: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'] },
    { title: 'Partition disks', text: 'Pilih metode partisi. Guided partitioning cocok untuk disk virtual baru yang memang disediakan khusus untuk instalasi.', options: ['Guided - use entire disk', 'Guided - use entire disk and set up LVM', 'Manual'] },
    { title: 'Partition disks - partitioning scheme', text: 'Untuk server lab, semua berkas dalam satu partisi lebih mudah dikelola. Installer membuat partisi sistem dan swap sesuai skema yang dipilih.', options: ['All files in one partition (recommended for new users)', 'Separate /home partition', 'Separate /home, /var, and /tmp partitions'] },
    { title: 'Partition disks - write changes to disk', text: 'Periksa ringkasan partisi sebelum menulis perubahan. Pada mode UEFI, partisi EFI System Partition dibuat sesuai kebutuhan firmware.', options: ['Finish partitioning and write changes to disk', 'Undo changes to partitions'] },
    { title: 'Configure the package manager', text: 'Pilih mirror Debian terdekat untuk mengambil pembaruan dan paket tambahan.', options: ['Indonesia - deb.debian.org', 'United States - deb.debian.org'] },
    { title: 'Configure the package manager - HTTP proxy', text: 'Kosongkan bila tidak menggunakan proxy HTTP di jaringan sekolah.' },
    { title: 'Configuring popularity-contest', text: 'Partisipasi survei paket bersifat opsional dan dapat dinonaktifkan.', options: ['No', 'Yes'] },
    { title: 'Software selection', text: 'Untuk server headless, desktop environment tidak dipilih. Pilih SSH server dan standard system utilities agar server dapat dikelola dari terminal.', checks: ['Debian desktop environment', 'GNOME', 'SSH server', 'standard system utilities'] },
    { title: 'Install the GRUB boot loader', text: 'Pasang GRUB pada disk utama agar firmware dapat memulai Debian setelah restart.', options: ['Yes', 'No'] },
    { title: 'Install the GRUB boot loader - device', text: 'Pilih seluruh disk utama, bukan partisi /dev/sda1.', options: ['/dev/sda (primary drive)', 'Enter device manually'] },
    { title: 'Finish the installation', text: 'Instalasi selesai. Lepaskan media Netinst saat diminta, lalu pilih Continue untuk reboot ke sistem Debian yang baru dipasang.', options: ['Continue - reboot into Debian GNU/Linux'] },
    { title: 'Debian GNU/Linux 12 - Login', text: 'Bootloader GRUB memuat kernel Linux 6.1 dan systemd. Sistem siap digunakan pada konsol teks. Masuk menggunakan akun yang dibuat saat instalasi.', options: ['Login'] }
  ];

  const root = document.getElementById('debian-installer');
  if (!root) return;
  const screen = document.getElementById('installer-screen');
  const progress = document.getElementById('installer-progress');
  const modeLabel = document.getElementById('installer-mode');
  const status = document.getElementById('installer-status');
  let step = 0;
  let mode = 'gui';
  let selected = {};
  let checks = { 'Debian desktop environment': false, GNOME: false, 'SSH server': true, 'standard system utilities': true };
  let fields = { hostname: 'srv-wikrama', domain: 'sekolah.lan', fullName: 'Siswa TKJ', username: 'siswa', userPassword: '', rootPassword: '' };
  let installed = false;
  let authenticated = false;

  function addText(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function selectedIndex(index, defaultIndex) {
    return Number.isInteger(selected[index]) ? selected[index] : defaultIndex;
  }

  function render() {
    const current = steps[step];
    root.dataset.mode = mode;
    progress.textContent = 'Tahap ' + (step + 1) + ' dari ' + steps.length;
    modeLabel.textContent = 'Mode: ' + (mode === 'gui' ? 'Graphical Install' : 'Text Install');
    screen.replaceChildren();
    addText(screen, 'h2', current.title);
    addText(screen, 'p', current.text);

    if (current.field) {
      const label = addText(screen, 'label', current.label);
      label.htmlFor = 'installer-field-' + current.field;
      const input = document.createElement('input');
      input.id = 'installer-field-' + current.field;
      input.type = current.password ? 'password' : 'text';
      input.autocomplete = current.password ? 'new-password' : 'off';
      input.value = fields[current.field] || current.value;
      if (current.password) input.placeholder = 'Password tidak disimpan';
      input.style.cssText = 'display:block;width:min(460px,100%);margin-top:8px;padding:10px;font:inherit';
      input.addEventListener('input', () => {
        fields[current.field] = input.value;
        window.ASJ.saveNow();
      });
      screen.appendChild(input);
      input.focus();
    }

    if (current.options) {
      const list = document.createElement('div');
      list.id = 'installer-options';
      current.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.toggle('selected', selectedIndex(step, 0) === index);
        button.setAttribute('aria-pressed', String(selectedIndex(step, 0) === index));
        const label = step === 25 && index === 0 ? 'Login as ' + (fields.username || 'siswa') : option;
        button.textContent = (selectedIndex(step, 0) === index ? '▶ ' : '  ') + label;
        button.addEventListener('click', () => {
          selected[step] = index;
          if (step === 0) mode = index === 0 ? 'gui' : 'text';
          if (step === 25 && index === 0) authenticated = true;
          render();
          window.ASJ.saveNow();
        });
        list.appendChild(button);
      });
      screen.appendChild(list);
    }

    if (current.checks) {
      const list = document.createElement('div');
      list.id = 'installer-options';
      current.checks.forEach(name => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = (checks[name] ? '[*] ' : '[ ] ') + name;
        button.setAttribute('aria-pressed', String(checks[name]));
        button.addEventListener('click', () => {
          checks[name] = !checks[name];
          render();
          window.ASJ.saveNow();
        });
        list.appendChild(button);
      });
      screen.appendChild(list);
    }

    const back = document.getElementById('installer-back');
    const next = document.getElementById('installer-next');
    back.disabled = step === 0;
    next.textContent = step === steps.length - 1 ? (authenticated ? 'Buka CLI →' : 'Login →') : 'Lanjut →';
    if (step === steps.length - 1) {
      status.textContent = authenticated
        ? 'Login berhasil sebagai ' + (fields.username || 'siswa') + '. Terminal simulasi tersedia pada tab Lab Terminal.'
        : 'Debian 12 terpasang dan siap digunakan. Pilih Login as siswa untuk membuka shell.';
    } else {
      status.textContent = 'Simulasi edukatif: tahap ' + (step + 1) + ' dari ' + steps.length + '. Mode ' + (mode === 'gui' ? 'grafis' : 'teks') + '.';
    }
  }

  function next() {
    if (step === 0) mode = selectedIndex(0, 0) === 0 ? 'gui' : 'text';
    if (step === steps.length - 1) {
      if (!authenticated) {
        status.textContent = 'Pilih akun pengguna untuk login sebelum membuka shell.';
        return;
      }
      const tabs = Array.from(document.querySelectorAll('.tab'));
      const terminalIndex = tabs.findIndex(tab => tab.dataset.title === 'Lab Terminal');
      if (terminalIndex >= 0) window.ASJ.openTab(terminalIndex);
      return;
    }
    if (steps[step].field) {
      const input = document.getElementById('installer-field-' + steps[step].field);
      if (input) fields[steps[step].field] = input.value.trim() || steps[step].value;
    }
    const previousStep = step;
    if (step === 9 && selectedIndex(9, 0) === 0) step = 11;
    else if (step < steps.length - 1) step++;
    if (previousStep === 24) installed = true;
    if (previousStep === 24 && typeof window.ASJ.configureInstalledOS === 'function') {
      window.ASJ.configureInstalledOS({
        hostname: fields.hostname,
        username: fields.username,
        rootPasswordEmpty: selectedIndex(9, 0) === 0
      });
    }
    render();
    window.ASJ.saveNow();
  }

  document.getElementById('installer-next').addEventListener('click', next);
  document.getElementById('installer-back').addEventListener('click', () => {
    if (step > 0) {
      step = step === 11 && selectedIndex(9, 0) === 0 ? 9 : step - 1;
      render();
      window.ASJ.saveNow();
    }
  });
  document.getElementById('installer-reset').addEventListener('click', () => {
    step = 0;
    mode = 'gui';
    selected = {};
    checks = { 'Debian desktop environment': false, GNOME: false, 'SSH server': true, 'standard system utilities': true };
    fields = { hostname: 'srv-wikrama', domain: 'sekolah.lan', fullName: 'Siswa TKJ', username: 'siswa', userPassword: '', rootPassword: '' };
    installed = false;
    authenticated = false;
    if (typeof window.ASJ.resetLab === 'function') window.ASJ.resetLab();
    render();
    window.ASJ.saveNow();
  });

  window.ASJ.registerState('installer', () => ({
    step, mode, selected, checks, fields: Object.fromEntries(Object.entries(fields).filter(([name]) => !name.toLowerCase().includes('password'))), installed, authenticated
  }), saved => {
    if (!saved) return;
    step = Number.isInteger(saved.step) ? Math.min(Math.max(saved.step, 0), steps.length - 1) : 0;
    mode = saved.mode === 'text' ? 'text' : 'gui';
    selected = saved.selected || {};
    checks = saved.checks || checks;
    fields = Object.assign({}, fields, saved.fields || {});
    installed = Boolean(saved.installed);
    authenticated = Boolean(saved.authenticated);
    render();
  });
  render();
})();
