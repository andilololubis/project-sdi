# Gunakan image Node.js versi 18 yang ringan sebagai dasar
FROM node:18-alpine

# Buat direktori kerja di dalam kontainer
WORKDIR /app

# Salin file package.json dan package-lock.json terlebih dahulu
# Ini untuk optimasi cache Docker, agar 'npm install' hanya berjalan jika ada perubahan dependensi
COPY package*.json ./

# Instal dependensi proyek
RUN npm install

# Salin sisa kode aplikasi ke dalam direktori kerja
COPY . .

# Beri tahu Docker bahwa kontainer akan berjalan di port 3000
EXPOSE 3000

# Perintah default untuk menjalankan aplikasi saat kontainer dimulai
CMD ["node", "server.js"]
