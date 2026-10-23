'use strict';

/* =========================================================
   1. FETCH API – Data Produk
   ========================================================= */
const API_URL = 'https://dummyjson.com/products';

const productList = document.getElementById('product-list');
const statusEl = document.getElementById('status');
const searchInput = document.getElementById('search');
const reloadBtn = document.getElementById('reload');

let products = [];

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function formatUSD(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function renderProducts(items) {
  productList.innerHTML = '';

  if (items.length === 0) {
    setStatus('Produk tidak ditemukan.');
    return;
  }
  setStatus(`Menampilkan ${items.length} produk.`);

  const fragment = document.createDocumentFragment();
  items.forEach((p) => {
    const li = document.createElement('li');

    const img = document.createElement('img');
    img.src = p.thumbnail;
    img.alt = p.title;
    img.loading = 'lazy';

    const name = document.createElement('span');
    name.className = 'product-name';
    name.textContent = p.title;

    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = formatUSD(p.price);

    const cat = document.createElement('span');
    cat.className = 'product-cat';
    cat.textContent = p.category;

    li.append(img, name, price, cat);
    fragment.appendChild(li);
  });
  productList.appendChild(fragment);
}

async function loadProducts() {
  setStatus('Memuat data produk…');
  productList.innerHTML = '';
  searchInput.disabled = true;
  reloadBtn.disabled = true;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Server menjawab dengan status ${response.status}`);
    }
    const data = await response.json();
    products = data.products;
    renderProducts(products);
    searchInput.disabled = false;
  } catch (err) {
    setStatus(`Gagal memuat data produk: ${err.message}. Periksa koneksi lalu klik "Muat ulang".`, true);
  } finally {
    reloadBtn.disabled = false;
  }
}

reloadBtn.addEventListener('click', loadProducts);

searchInput.addEventListener('input', () => {
  const keyword = searchInput.value.trim().toLowerCase();
  renderProducts(products.filter((p) => p.title.toLowerCase().includes(keyword)));
});

loadProducts();

/* =========================================================
   2. FORM – DOM & Event Handling
   ========================================================= */
const form = document.getElementById('order-form');
const namaEl = document.getElementById('nama');
const emailEl = document.getElementById('email');
const paketEl = document.getElementById('paket');
const jumlahEl = document.getElementById('jumlah');
const catatanEl = document.getElementById('catatan');
const counterEl = document.getElementById('counter');
const totalEl = document.getElementById('total');
const resultEl = document.getElementById('result');
const resetBtn = document.getElementById('reset');

const rupiah = (n) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);

// Aturan validasi: mengembalikan pesan error, atau '' jika valid
const validators = {
  nama: () => {
    const v = namaEl.value.trim();
    if (!v) return 'Nama wajib diisi.';
    if (v.length < 3) return 'Nama minimal 3 karakter.';
    return '';
  },
  email: () => {
    const v = emailEl.value.trim();
    if (!v) return 'Email wajib diisi.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Format email tidak valid.';
    return '';
  },
  paket: () => (paketEl.value ? '' : 'Pilih salah satu paket.'),
  jumlah: () => {
    const n = Number(jumlahEl.value);
    if (!Number.isInteger(n) || n < 1 || n > 10) return 'Jumlah harus bilangan bulat 1–10.';
    return '';
  },
};
const inputs = { nama: namaEl, email: emailEl, paket: paketEl, jumlah: jumlahEl };

function validateField(key) {
  const message = validators[key]();
  document.getElementById(`err-${key}`).textContent = message;
  inputs[key].classList.toggle('invalid', Boolean(message));
  inputs[key].classList.toggle('valid', !message);
  return !message;
}

function updateTotal() {
  const harga = Number(paketEl.value) || 0;
  const jumlah = Number(jumlahEl.value) || 0;
  totalEl.textContent = rupiah(harga * jumlah);
}

// Event "input": validasi langsung, hitung total, counter karakter
Object.keys(inputs).forEach((key) => {
  inputs[key].addEventListener('input', () => {
    validateField(key);
    updateTotal();
  });
});
paketEl.addEventListener('change', () => { validateField('paket'); updateTotal(); });

catatanEl.addEventListener('input', () => {
  counterEl.textContent = `${catatanEl.value.length} / ${catatanEl.maxLength} karakter`;
});

// Event "submit": validasi semua, tampilkan hasil
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const allValid = Object.keys(inputs).map(validateField).every(Boolean);

  if (!allValid) {
    resultEl.hidden = true;
    const firstInvalid = form.querySelector('.invalid');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const paketLabel = paketEl.options[paketEl.selectedIndex].text;
  const total = Number(paketEl.value) * Number(jumlahEl.value);

  resultEl.innerHTML = '';
  const title = document.createElement('h3');
  title.textContent = 'Pesanan berhasil dikirim';

  const dl = document.createElement('dl');
  const rows = [
    ['Nama', namaEl.value.trim()],
    ['Email', emailEl.value.trim()],
    ['Paket', paketLabel],
    ['Jumlah', jumlahEl.value],
    ['Total', rupiah(total)],
    ['Catatan', catatanEl.value.trim() || '-'],
  ];
  rows.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;   // textContent mencegah injeksi HTML
    dl.append(dt, dd);
  });

  resultEl.append(title, dl);
  resultEl.hidden = false;
});

// Event "click": reset form
resetBtn.addEventListener('click', () => {
  form.reset();
  Object.values(inputs).forEach((el) => el.classList.remove('valid', 'invalid'));
  form.querySelectorAll('.error').forEach((el) => (el.textContent = ''));
  counterEl.textContent = `0 / ${catatanEl.maxLength} karakter`;
  updateTotal();
  resultEl.hidden = true;
});
