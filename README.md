### **1. Update & Instalasi NVM dan Node.js**
```bash
apt update
apt upgrade -y
apt install curl -y
```
- Memperbarui daftar paket dan meningkatkan paket yang ada.
- Menginstal `curl` untuk mengunduh skrip pemasangan NVM.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 20
npm i -g npm@11.4.1
```
- Mengunduh dan menginstal NVM (Node Version Manager).
- Memuat NVM ke dalam sesi terminal.
- Menginstal Node.js versi 20 dan memperbarui `npm` ke versi 11.4.1.

### **2. Instalasi dan Konfigurasi Nginx**
```bash
apt install nginx -y
systemctl enable --now nginx
```
- Menginstal Nginx dan langsung mengaktifkannya agar berjalan otomatis saat boot.

```bash
nano /etc/nginx/sites-available/api.zedlabs.id
```
- Membuka file konfigurasi baru untuk `api.zedlabs.id`.

```bash
server {
    listen 80;
    server_name api.zedlabs.id;
    root /var/www/api.zedlabs.id;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```
- Konfigurasi Nginx untuk melayani situs `api.zedlabs.id` dari direktori `/var/www/api.zedlabs.id`.

```bash
ln -s /etc/nginx/sites-available/api.zedlabs.id /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx.service
```
- Mengaktifkan konfigurasi dengan membuat symlink ke `sites-enabled`.
- Menguji konfigurasi Nginx sebelum diterapkan.
- Memulai ulang Nginx agar perubahan diterapkan.

### **3. Setup Proyek Node.js**
```bash
mkdir -p /var/www/api.zedlabs.id
cd /var/www/api.zedlabs.id
git clone https://github.com/zulfikriyahya/api-whatsapp.git .
chown -R www-data:www-data /var/www/api.zedlabs.id/
npm i
```
- Membuat direktori proyek dan masuk ke dalamnya.
- Mengkloning kode dari repository GitHub ke dalam direktori.
- Mengubah kepemilikan direktori ke `www-data`, pengguna default untuk Nginx.
- Menginstal dependensi Node.js untuk proyek.

### **4. Konfigurasi Systemd untuk Menjalankan API Server**
```bash
nano /etc/systemd/system/api-server.service
```
- Membuat file systemd untuk menjalankan API server sebagai layanan.

```bash
[Unit]
Description=API Server
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/api.zedlabs.id
ExecStart=/root/.nvm/versions/node/v20.19.2/bin/npm start
Restart=always
Environment=PATH=/root/.nvm/versions/node/v20.19.2/bin:/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```
- Menentukan cara layanan API server dijalankan secara otomatis dengan `systemd`.

```bash
systemctl daemon-reload
systemctl enable --now api-server.service
```
- Memuat ulang `systemd` agar mengenali layanan baru.
- Mengaktifkan dan menjalankan layanan secara otomatis saat boot.

```bash
systemctl status api-server.service
```
- Mengecek apakah layanan berjalan dengan sukses.
