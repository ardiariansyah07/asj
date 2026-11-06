
# Modul Praktikum Administrasi Sistem Jaringan

Portal belajar ini berisi halaman HTML statis dan JavaScript lokal. Tidak ada backend atau layanan analitik; semua progres peserta disimpan di `localStorage` browser.

## Menjalankan

- Buka `index.html` atau host seluruh folder ini sebagai static site, misalnya GitHub Pages.
- Pertama kali, isi nama peserta. Nama dan progres dibagikan antarhalaman pada browser yang sama.
- Gunakan tombol **Ganti nama** untuk memperbarui nama. Konfirmasi penggantian nama akan menghapus seluruh progres lokal.
- Progres tersimpan pada browser/perangkat yang sedang digunakan, bukan di repository GitHub. Data tidak otomatis berpindah ke browser/perangkat lain dan dapat dihapus saat data situs dibersihkan.
- Untuk penyimpanan yang konsisten, gunakan alamat origin yang sama (misalnya URL GitHub Pages yang sama) setiap kali membuka modul.
- Materi di setiap modul harus ditandai selesai secara berurutan. Tab lab terbuka setelah seluruh materi selesai; latihan terbuka setelah lab dikonfirmasi selesai.
- Sertifikat modul tersedia setelah lab selesai dan seluruh soal latihan dijawab dengan nilai terbaik minimal 75%. Sertifikat cetak mengikuti template TJKT Learning Hub, memakai nama peserta, nama modul, tanggal penerbitan, logo, dan nilai terbaik; gunakan dialog cetak browser untuk menyimpannya sebagai PDF. Progres dan sertifikat dikelola lokal di browser; tidak ada validasi atau penerbitan terpusat di server.
- Pada modul Uptime Kuma dan proyek akhir, penyelesaian praktik/proyek dikonfirmasi pada bagian evaluasi terakhir karena keduanya tidak menggunakan kuis pilihan ganda seperti modul lainnya.

## Isi modul

- `nos.html`: dasar sistem operasi jaringan dan CLI Linux.
- `instalasi.html`: simulasi Debian Installer mode grafis/teks dan CLI setelah instalasi.
- `ssh.html`, `nginx.html`, `mariadb.html`, `ufw.html`, `fail2ban.html`: praktik CLI sesuai topik.
- `kuma.html`: simulasi dashboard monitoring berbasis web; Uptime Kuma dikelola melalui UI, bukan CLI.
- `projek.html`: lembar projek akhir.
- `logo-tjkt.png`: logo yang digunakan pada sertifikat cetak.
- `tjkt-theme.css`: tema bersama portal dan seluruh modul dengan palet navy, cyan, merah, dan putih dari identitas TJKT Learning Hub.
