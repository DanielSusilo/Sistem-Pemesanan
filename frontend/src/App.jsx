import React,{useEffect,useMemo,useRef,useState} from 'react';
import {
  BrowserRouter,
  useNavigate,
  useLocation,
  Link,
  NavLink,
  Navigate,
  Routes,
  Route
} from 'react-router-dom';

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coffee,
  Cookie,
  CupSoda,
  Drumstick,
  Eye,
  EyeOff,
  ImagePlus,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  MapPin,
  Minus,
  Package,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  Trash2,
  Utensils,
  WalletCards,
  X
} from 'lucide-react';

import { VariationModal, CustomizationSummary, calcItemTotal, SPICE_LEVELS } from './VariationModal.jsx';
import { CashierVariations } from './CashierVariations.jsx';

const API =
  import.meta.env.VITE_API_URL ||
  '/api';

const money = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(n || 0));

const fmtDate = (v) => {
  if (!v) return '-';

  const d = new Date(v);

  if (Number.isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d);
};

export const AVAILABLE_CATEGORY_ICONS = [
  { id: 'Utensils', name: 'Makanan / Paket Nasi', icon: Utensils },
  { id: 'Drumstick', name: 'Ayam Geprek', icon: Drumstick },
  { id: 'CupSoda', name: 'Minuman / Soda', icon: CupSoda },
  { id: 'Coffee', name: 'Kopi / Hangat', icon: Coffee },
  { id: 'Plus', name: 'Add On / Tambahan', icon: Plus },
  { id: 'Cookie', name: 'Snack / Camilan', icon: Cookie },
  { id: 'Sparkles', name: 'Spesial / Promo', icon: Sparkles },
  { id: 'Package', name: 'Box / Paket', icon: Package },
  { id: 'Tags', name: 'Kategori / Label', icon: Tags },
  { id: 'Layers', name: 'Komplit / Lengkap', icon: Layers },
];

export function CategoryIcon({ icon, name, size = 16, className = '' }) {
  const key = (icon || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (key === 'grid' || key === 'layoutgrid' || n === 'semua') {
    return <LayoutGrid size={size} className={className} />;
  }
  if (key === 'drumstick' || n.includes('ayam')) {
    return <Drumstick size={size} className={className} />;
  }
  if (key === 'cupsoda' || key === 'cup' || key === 'soda' || n.includes('minum')) {
    return <CupSoda size={size} className={className} />;
  }
  if (key === 'coffee' || n.includes('kopi')) {
    return <Coffee size={size} className={className} />;
  }
  if (key === 'plus' || key === 'addon' || n.includes('add on') || n.includes('addon') || n.includes('ekstra') || n.includes('tambahan')) {
    return <Plus size={size} className={className} />;
  }
  if (key === 'cookie' || n.includes('snack') || n.includes('camilan') || n.includes('cemilan')) {
    return <Cookie size={size} className={className} />;
  }
  if (key === 'utensils' || key === 'bowl' || n.includes('paket') || n.includes('nasi') || n.includes('makan')) {
    return <Utensils size={size} className={className} />;
  }
  if (key === 'sparkles') {
    return <Sparkles size={size} className={className} />;
  }
  if (key === 'package') {
    return <Package size={size} className={className} />;
  }
  if (key === 'tags' || key === 'tag') {
    return <Tags size={size} className={className} />;
  }
  if (key === 'layers') {
    return <Layers size={size} className={className} />;
  }
  return <Utensils size={size} className={className} />;
}

const labels = {
  pending: 'Menunggu',
  confirmed: 'Diterima',
  preparing: 'Sedang Disiapkan',
  ready: 'Siap Diambil',
  completed: 'Selesai',
  cancelled: 'Ditolak'
};

const paymentState = (order) =>
  order?.status === 'completed'
    ? 'paid'
    : 'pending';

const paymentLabel = (order) =>
  paymentState(order) === 'paid'
    ? 'LUNAS'
    : 'MENUNGGU';

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem('p1_token'));
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('p1_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [toast, setToast] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const show = (text, type = 'success') =>
    setToast({ text, type });

  useEffect(() => {
    if (!toast) return;

    const t = setTimeout(
      () => setToast(null),
      3500
    );

    return () => clearTimeout(t);
  }, [toast]);

  // Tangani token dari URL hash (misalnya setelah link verifikasi email Supabase diklik)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const type = params.get('type');
      if (accessToken) {
        localStorage.setItem('p1_token', accessToken);
        setToken(accessToken);
        window.history.replaceState(null, '', window.location.pathname);
        show(
          type === 'signup'
            ? 'Verifikasi email berhasil! Selamat datang di Ayam Geprek Dapoer Sari.'
            : 'Login berhasil!',
          'success'
        );
      }
    }
  }, []);

  const api = async (
    path,
    opt = {}
  ) => {
    const headers = {
      ...(opt.body instanceof FormData
        ? {}
        : {
            'Content-Type':
              'application/json'
          }),
      ...(token
        ? {
            Authorization:
              `Bearer ${token}`
          }
        : {}),
      ...(opt.headers || {})
    };

    const r = await fetch(
      API + path,
      {
        ...opt,
        headers
      }
    );

    const d =
      await r.json().catch(
        () => ({})
      );

    if (!r.ok) {
      if (r.status === 401) {
        localStorage.removeItem('p1_token');
        localStorage.removeItem('p1_profile');
        setToken(null);
        setProfile(null);
      }

      throw new Error(
        d.error ||
        'Request gagal.'
      );
    }

    return d;
  };

  useEffect(() => {
    if (!token) return;

    setLoadingProfile(true);
    api('/me')
      .then((x) => {
        if (x?.profile) {
          setProfile(x.profile);
          localStorage.setItem('p1_profile', JSON.stringify(x.profile));
        } else {
          logout();
        }
      })
      .catch((error) => {
        console.error('Gagal memuat profil:', error);
        localStorage.removeItem('p1_token');
        localStorage.removeItem('p1_profile');
        setToken(null);
        setProfile(null);
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  }, [token]);

  const logout = () => {
    localStorage.removeItem('p1_token');
    localStorage.removeItem('p1_profile');
    setToken(null);
    setProfile(null);
    navigate('/', { replace: true });
  };

  const handleLogin = (s, p) => {
    localStorage.setItem('p1_token', s.access_token);
    localStorage.setItem('p1_profile', JSON.stringify(p));
    setToken(s.access_token);
    setProfile(p);

    if (p.role === 'cashier') {
      navigate('/kasir', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  if (!token) {
    return (
      <>
        <Auth
          show={show}
          onLogin={handleLogin}
        />
        {toast && (
          <Toast {...toast} />
        )}
      </>
    );
  }

  if (!profile) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"/>
        <strong>Memuat akun...</strong>
        <span>Menyiapkan data pelanggan</span>
      </div>
    );
  }

  return (
    <>
      {profile?.role === 'cashier' ? (
        <CashierApp
          profile={profile}
          api={api}
          show={show}
          logout={logout}
        />
      ) : (
        <CustomerApp
          profile={profile}
          api={api}
          show={show}
          logout={logout}
          onProfileUpdate={setProfile}
        />
      )}

      {toast && (
        <Toast {...toast} />
      )}
    </>
  );
}

/* =========================================================
   AUTH
========================================================= */

function Auth({
  onLogin,
  show
}) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const handleResendVerification = async () => {
    if (!unconfirmedEmail) return;
    setResending(true);
    try {
      const r = await fetch(API + '/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unconfirmedEmail })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal mengirim ulang email verifikasi.');
      show(d.message || 'Tautan verifikasi telah dikirim ulang ke ' + unconfirmedEmail + '. Silakan periksa inbox/spam email Anda.', 'success');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setResending(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();

    if (!cleanEmail || !password) {
      show('Silakan lengkapi email dan kata sandi.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      show('Format email tidak valid. Gunakan format seperti nama@gmail.com.', 'error');
      return;
    }

    if (tab === 'register') {
      if (cleanFullName.length < 2) {
        show('Nama lengkap minimal 2 karakter.', 'error');
        return;
      }
      if (password.length < 6) {
        show('Kata sandi minimal 6 karakter.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        show('Kata sandi dan konfirmasi kata sandi tidak sama.', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/signup';
      const body = tab === 'login'
        ? { email: cleanEmail, password }
        : { fullName: cleanFullName, email: cleanEmail, password };

      const r = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const d = await r.json();

      if (!r.ok) {
        if (d.code === 'email_not_confirmed') {
          setUnconfirmedEmail(cleanEmail);
        }
        throw new Error(d.error || 'Proses autentikasi gagal.');
      }

      if (tab === 'register') {
        if (d.session && d.profile) {
          // Auto-login setelah registrasi berhasil
          show(d.message || 'Pendaftaran berhasil! Selamat datang di Ayam Geprek Dapoer Sari.');
          onLogin(d.session, d.profile);
        } else if (d.requiresEmailVerification) {
          show(d.message || 'Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi sebelum masuk.', 'warning');
          setTab('login');
          setPassword('');
          setConfirmPassword('');
        } else {
          show(d.message || 'Pendaftaran berhasil! Silakan masuk dengan akun Anda.');
          setTab('login');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        onLogin(d.session, d.profile);
      }
    } catch(err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-page-container">
      {/* SISI KIRI: Branding & Foto Hero Menarik (Desktop/Laptop) */}
      <div className="auth-hero-side">
        <div className="auth-hero-bg" />
        <div className="auth-hero-overlay" />

        <div className="auth-hero-content">
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3">
            <div className="brand-logo-box" style={{ background: '#FFFFFF' }}>
              <img
                src="/logo-dapoersari.png"
                alt="Ayam Geprek Dapoer Sari"
                className="brand-logo-image"
              />
            </div>
            <div>
              <strong style={{ color: '#FFFFFF', fontSize: '18px', display: 'block', fontFamily: 'var(--font-heading)' }}>
                Ayam Geprek Dapoer Sari
              </strong>
              <span style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 600 }}>
                Cepat • Enak • Praktis
              </span>
            </div>
          </div>

          {/* Hero Copy */}
          <div>
            <span className="eyebrow light" style={{ color: '#F97316', fontSize: '13px', fontWeight: 800 }}>
              CITA RASA NUSANTARA
            </span>
            <h1 style={{ color: '#FFFFFF', fontSize: '38px', lineHeight: 1.2, margin: '8px 0 16px', fontWeight: 800 }}>
              Pedasnya Pas,<br />
              Gurihnya Nendang,<br />
              Favorit Semua Generasi! 🍗🔥
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', maxWidth: '440px', lineHeight: 1.6 }}>
              Pesan menu ayam geprek renyah dengan aneka variasi sambal, topping lezat, dan minuman segar langsung dari genggaman Anda.
            </p>
          </div>

          {/* Features badge */}
          <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <div className="flex items-center gap-2 text-white" style={{ fontSize: '13px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} /> Pesan Cepat & Mudah
            </div>
            <div className="flex items-center gap-2 text-white" style={{ fontSize: '13px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} /> Bebas Pilih Variasi
            </div>
            <div className="flex items-center gap-2 text-white" style={{ fontSize: '13px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} /> Pantau Status Realtime
            </div>
          </div>
        </div>
      </div>

      {/* SISI KANAN: Panel Autentikasi dengan Tab Masuk & Daftar */}
      <div className="auth-form-side">
        <div className="auth-card-panel">
          {/* Mobile branding header */}
          <div className="flex items-center gap-3 mb-6" style={{ display: 'flex' }}>
            <div className="brand-logo-box" style={{ width: '42px', height: '42px', minWidth: '42px', background: '#FFFFFF' }}>
              <img src="/logo-dapoersari.png" alt="Logo" className="brand-logo-image" />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontFamily: 'var(--font-heading)' }}>
                Ayam Geprek Dapoer Sari
              </strong>
              <span className="text-caption" style={{ color: 'var(--accent)', fontWeight: 600, display: 'block' }}>
                Order & Cashier Portal
              </span>
            </div>
          </div>

          {/* Tab Selector: Masuk / Daftar */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
              onClick={() => setTab('login')}
            >
              Masuk
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
              onClick={() => setTab('register')}
            >
              Daftar Akun
            </button>
          </div>

          <div className="mb-4">
            <h2 className="heading" style={{ fontSize: '22px', margin: 0 }}>
              {tab === 'login' ? 'Selamat Datang Kembali 👋' : 'Mulai Pesan Favoritmu 🍗'}
            </h2>
            <p className="text-caption text-muted mt-1">
              {tab === 'login'
                ? 'Masukkan email dan kata sandi akun Anda untuk melanjutkan.'
                : 'Lengkapi formulir di bawah ini untuk membuat akun baru.'}
            </p>
          </div>

          {unconfirmedEmail && tab === 'login' && (
            <div className="card p-3 mb-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: '#92400E', lineHeight: 1.5 }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>⚠️ Verifikasi Email Diperlukan</strong>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#78350F' }}>
                  Akun Anda (<b>{unconfirmedEmail}</b>) terdaftar sebagai <b>Customer</b>, tetapi email belum dikonfirmasi di Supabase. Periksa kotak masuk/spam email Anda, atau klik tombol di bawah untuk kirim ulang tautan verifikasi.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px', background: '#FFFFFF', borderColor: '#F59E0B', color: '#B45309', fontWeight: 600 }}
                  onClick={handleResendVerification}
                  disabled={resending}
                >
                  {resending ? 'Mengirim...' : '📧 Kirim Ulang Tautan Verifikasi'}
                </button>
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div className="flex items-center gap-2 mb-4 p-2 px-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '12.5px' }}>
              <span style={{ color: '#16A34A', fontWeight: 700, whiteSpace: 'nowrap' }}>● 1 Peran:</span>
              <span style={{ color: '#475569' }}>Akun yang didaftarkan terdeteksi sebagai <b>Pelanggan (Customer)</b> saja.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="form-stack">
            {tab === 'register' && (
              <label>
                Nama Lengkap
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
            )}

            <label>
              Alamat Email
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus={tab === 'login'}
              />
            </label>

            <label>
              Kata Sandi
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {tab === 'register' && (
              <label>
                Konfirmasi Kata Sandi
                <div className="password-input-wrap">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ulangi kata sandi Anda"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi sandi' : 'Tampilkan konfirmasi sandi'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full mt-3"
              style={{ minHeight: '48px', fontSize: '15px' }}
              disabled={loading}
            >
              {loading ? 'Memproses...' : tab === 'login' ? 'Masuk ke Akun' : 'Daftar Sekarang'}
            </button>
          </form>

          {/* Footer note */}
          <div className="text-center mt-6 pt-4 border-t" style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {tab === 'login' ? (
              <span>
                Belum memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Daftar di sini
                </button>
              </span>
            ) : (
              <span>
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Masuk di sini
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  text
}) {
  return (
    <div className="feature">

      <div>
        {React.cloneElement(
          icon,
          {size:16}
        )}
      </div>

      <span>
        {text}
      </span>

    </div>
  );
}

function Toast({
  text,
  type
}) {
  return (
    <div
      className={
        `app-toast ${type}`
      }
    >
      <div className="toast-icon">
        {
          type === 'error'
            ? '!'
            : '✓'
        }
      </div>

      <div>
        <strong>
          {
            type === 'error'
              ? 'Perhatian'
              : 'Berhasil'
          }
        </strong>

        <span>
          {text}
        </span>
      </div>

      <div className="toast-progress"/>
    </div>
  );
}

/* =========================================================
   SHARED UI
========================================================= */

function SideLink({
  to,
  end,
  icon,
  text
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `side-link ${isActive ? 'active' : ''}`
      }
    >
      {React.cloneElement(icon, { size: 17 })}
      <span>{text}</span>
    </NavLink>
  );
}

function Status({ status }) {
  return (
    <span className={`status-pill ${status || ''}`}>
      {labels[status] || status || '-'}
    </span>
  );
}

/* =========================================================
   CUSTOMER
========================================================= */

function CustomerApp({
  profile,
  api,
  show,
  logout,
  onProfileUpdate
}) {
  return (
    <div className="customer-store-layout">

      <CustomerStoreSidebar
        profile={profile}
        logout={logout}
      />

      <main className="customer-store-main">

        <CustomerStoreHeader
          profile={profile}
        />

        <CustomerPages
          api={api}
          profile={profile}
          show={show}
          onProfileUpdate={onProfileUpdate}
        />

      </main>

      <CustomerBottomNav/>

    </div>
  );
}

function CustomerStoreSidebar({
  profile,
  logout
}) {
  return (
    <aside className="customer-sidebar">

      {/* BRAND */}
      <Link to="/" className="brand-link">
        <div className="brand-logo-box">
          <img
            src="/logo-dapoersari.png"
            alt="Dapoersari"
            className="brand-logo-image"
          />
        </div>
        <div className="brand-app-name">
          <strong>Ayam Geprek Dapoer Sari</strong>
          <span>Order Center</span>
        </div>
      </Link>

      {/* CUSTOMER BADGE */}
      <div className="cashier-role" style={{ color: '#F97316', background: 'rgba(249,115,22,0.1)', marginBottom: '16px' }}>
        <ShoppingBag size={14} />
        PELANGGAN
      </div>

      {/* NAVIGATION */}
      <nav className="side-nav">

        <SideLink
          to="/"
          end
          icon={<LayoutDashboard />}
          text="Beranda"
        />

        <SideLink
          to="/menu"
          icon={<Utensils />}
          text="Menu"
        />

        <SideLink
          to="/keranjang"
          icon={<ShoppingBag />}
          text="Keranjang"
        />

        <SideLink
          to="/pesanan"
          icon={<ReceiptText />}
          text="Pesanan Saya"
        />

        <SideLink
          to="/pengaturan"
          icon={<Settings />}
          text="Pengaturan"
        />

      </nav>

      <div className="sidebar-grow" />

      {/* USER INFO */}
      <div className="side-user">
        <div className="avatar">
          {(profile?.full_name || 'P')[0].toUpperCase()}
        </div>
        <div>
          <b>{profile?.full_name || 'Pelanggan'}</b>
          <span>CUSTOMER</span>
        </div>
      </div>

      {/* LOGOUT */}
      <button
        type="button"
        className="side-logout"
        onClick={logout}
      >
        <LogOut size={14} />
        Keluar
      </button>

    </aside>
  );
}


function CustomerStoreHeader({
  profile
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery,setSearchQuery] = useState('');

  const count =
    Object.values(
      normalizeCart(
        readCart()
      )
    ).reduce(
      (s,item) =>
        s + Number(item?.quantity || 0),
      0
    );

  const isHome =
    location.pathname === '/';

  useEffect(() => {
    if (!isHome) {
      setSearchQuery('');
    }
  }, [isHome]);

  const submitSearch = () => {
    const value = searchQuery.trim();
    navigate(
      value
        ? `/menu?search=${encodeURIComponent(value)}`
        : '/menu'
    );
  };

  return (
    <header className="bg-white border-b flex flex-col p-4 gap-4">

      <div className="flex items-center justify-between gap-3">

        {/* Brand block — hidden on desktop (sidebar already shows brand) */}
        <div className="customer-header-brand flex items-center gap-3">
          <div className="bg-background flex items-center justify-center p-2" style={{ borderRadius: '12px' }}>
            <img
              src="/logo-dapoersari.png"
              alt="Dapoersari"
              style={{ width: '32px', height: '32px' }}
            />
          </div>

          <div className="flex flex-col">
            <strong style={{ fontFamily: 'var(--font-heading)' }}>Ayam Geprek Dapoer Sari</strong>
            <span className="text-caption" style={{ color: 'var(--accent)', fontWeight: 600 }}>Cepat • Enak • Praktis</span>
          </div>
        </div>

        <div className="flex items-center gap-4">

          <Link
            to="/pesanan"
            className="flex flex-col items-center gap-1 text-muted"
          >
            <Bell size={20}/>
          </Link>

          <Link
            to="/keranjang"
            className="flex flex-col items-center gap-1 text-muted"
            style={{ position: 'relative' }}
          >
            <ShoppingBag size={20}/>

            {count > 0 && (
              <span className="badge badge badge-waiting" style={{ position: 'absolute', top: '-8px', right: '-8px', padding: '2px 6px', fontSize: '10px' }}>
                {count}
              </span>
            )}
          </Link>

          <Link
            to="/pengaturan"
            className="bg-background text-primary flex items-center justify-center"
            style={{ width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold' }}
          >
            {(profile?.full_name || 'P')[0].toUpperCase()}
          </Link>

        </div>

      </div>

      {isHome ? (
        <div className="bg-background flex items-center gap-2 p-2 w-full" style={{ borderRadius: '12px' }}>
          <Search size={17} className="text-muted ml-2" />

          <input
            className="w-full bg-background border-0"
            style={{ outline: 'none', padding: '4px' }}
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitSearch();
              }
            }}
            placeholder="Cari menu, minuman, atau tambahan..."
            aria-label="Cari menu"
          />
        </div>
      ) : (
        <div style={{ height: '0' }}/>
      )}

    </header>
  );
}

function CustomerBottomNav() {
  return (
    <nav className="bottom-nav">

      <SideLink
        to="/"
        end
        icon={<LayoutDashboard/>}
        text="Beranda"
      />

      <SideLink
        to="/menu"
        icon={<Utensils/>}
        text="Menu"
      />

      <SideLink
        to="/keranjang"
        icon={<ShoppingBag/>}
        text="Keranjang"
      />

      <SideLink
        to="/pesanan"
        icon={<ReceiptText/>}
        text="Pesanan"
      />

      <SideLink
        to="/pengaturan"
        icon={<Settings/>}
        text="Akun"
      />

    </nav>
  );
}

function CustomerPages({
  api,
  profile,
  show,
  onProfileUpdate
}) {
  return (
    <Routes>

      <Route
        path="/"
        element={
          <CustomerHome
            api={api}
            profile={profile}
            show={show}
          />
        }
      />

      <Route
        path="/menu"
        element={
          <CustomerMenu
            api={api}
            show={show}
          />
        }
      />

      <Route
        path="/keranjang"
        element={
          <CustomerCart
            api={api}
            profile={profile}
            show={show}
          />
        }
      />

      <Route
        path="/pesanan"
        element={
          <CustomerOrders
            api={api}
            show={show}
          />
        }
      />

      <Route
        path="/pengaturan"
        element={
          <SettingsPage
            api={api}
            profile={profile}
            show={show}
            onProfileUpdate={
              onProfileUpdate
            }
          />
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

function CustomerHome({
  api,
  profile,
  show
}) {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [greeting, setGreeting] = useState('Selamat datang');
  const [variationProduct, setVariationProduct] = useState(null);

  useEffect(() => {
    Promise.all([
      api('/menu'),
      api('/categories')
    ])
      .then(([m, c]) => {
        setMenu(m || []);
        setCategories(c || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setGreeting('Selamat pagi');
      else if (hour >= 11 && hour < 15) setGreeting('Selamat siang');
      else if (hour >= 15 && hour < 18) setGreeting('Selamat sore');
      else setGreeting('Selamat malam');
    };
    updateGreeting();
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, []);

  const customerName = (profile?.full_name || 'Pelanggan').trim().split(/\s+/)[0];

  const handleVariationConfirm = (varData) => {
    const currentCart = normalizeCart(loadCart());
    const cartKey = `${varData.productId}_${Date.now()}`;
    const updated = {
      ...currentCart,
      [cartKey]: {
        quantity:    varData.quantity,
        spiceLevel:  varData.spiceLevel,
        toppings:    varData.toppings,
        sideMenu:    varData.sideMenu,
        notes:       varData.notes,
        totalPrice:  varData.totalPrice,
        productId:   varData.productId,
      }
    };
    saveCart(updated);
    if (show) show(`${varData.productName} ditambahkan ke keranjang! 🛒`);
    setVariationProduct(null);
  };

  return (
    <>
      <div className="flex flex-col p-4 gap-6">

        <section className="flex flex-col gap-2">
          <span className="text-caption text-muted">WELCOME BACK</span>
          <h2 className="heading" style={{ fontSize: '24px' }}>
            {greeting}, {customerName} 👋
          </h2>
          <p className="text-body text-muted">
            Mau makan apa hari ini? Pilih menu favoritmu dan pesan dengan cepat.
          </p>
        </section>

        <section className="card bg-primary text-white p-6 flex justify-between items-center" style={{ backgroundColor: '#111827', color: 'white' }}>
          <div className="flex flex-col gap-2 w-full">
            <span className="text-caption text-muted" style={{ color: '#9CA3AF' }}>AYAM GEPREK</span>
            <h1 className="heading" style={{ fontSize: '28px', color: 'white' }}>
              Pedasnya pas.<br/>Pesannya cepat.
            </h1>
            <p className="text-body mb-4" style={{ color: '#D1D5DB' }}>
              Pilih menu favorit, masukkan ke keranjang, lalu pantau status pesanan sampai siap diambil.
            </p>
            <Link to="/menu" className="btn btn-primary" style={{ width: 'fit-content' }}>
              Pesan Sekarang <ArrowRight size={15} />
            </Link>
          </div>
          <div style={{ fontSize: '80px', alignSelf: 'flex-end', marginLeft: '-20px' }}>
            🍗
          </div>
        </section>

        {/* KATEGORI PILIHAN CUSTOMER */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-caption text-muted">KATEGORI</span>
              <h3 className="heading" style={{ fontSize: '20px' }}>Pilih Kategori</h3>
            </div>
            <Link to="/menu" className="text-body text-primary flex items-center" style={{ color: '#F97316', fontWeight: 600 }}>
              Semua Menu <ChevronRight size={14} />
            </Link>
          </div>

          <div className="category-chips-scroll">
            <Link
              to="/menu"
              className="category-chip"
            >
              <CategoryIcon name="Semua" size={16} />
              Semua
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/menu?category=${encodeURIComponent(c.name)}`}
                className="category-chip"
              >
                <CategoryIcon icon={c.icon} name={c.name} size={16} />
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-caption text-muted">REKOMENDASI</span>
              <h3 className="heading" style={{ fontSize: '20px' }}>Menu Pilihan</h3>
            </div>
            <Link to="/menu" className="text-body text-primary flex items-center" style={{ color: '#F97316', fontWeight: 600 }}>
              Lihat semua <ChevronRight size={14} />
            </Link>
          </div>

          <div className="product-grid">
            {menu.slice(0, 6).map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onAdd={() => setVariationProduct(item)}
              />
            ))}
          </div>
        </div>

      </div>

      {variationProduct && (
        <VariationModal
          product={variationProduct}
          onConfirm={handleVariationConfirm}
          onClose={() => setVariationProduct(null)}
        />
      )}
    </>
  );
}


function CustomerMenu({
  api,
  show
}) {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || 'Semua';
  const [category, setCategory] = useState(initialCategory);
  const [cart, setCart] = useState(normalizeCart(loadCart()));
  const [variationProduct, setVariationProduct] = useState(null);

  // Sync category state if user navigates with query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) {
      setCategory(cat);
    }
  }, [location.search]);

  useEffect(() => {
    Promise.all([
      api('/menu'),
      api('/categories')
    ])
      .then(([m, c]) => {
        setMenu(m || []);
        setCategories(c || []);
      })
      .catch((e) => show(e.message, 'error'));
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const visible = menu.filter((item) => {
    const itemCat = (item.categories?.name || '').toLowerCase();
    const selCat = category.toLowerCase();
    const byCategory = category === 'Semua' || itemCat === selCat;
    const bySearch = item.name.toLowerCase().includes(query.trim().toLowerCase());
    return byCategory && bySearch;
  });

  // Fired when user taps "+" on a product card
  const handleAddClick = (item) => {
    setVariationProduct(item);
  };

  // Fired when user confirms variation selection
  const handleVariationConfirm = (varData) => {
    const cartKey = `${varData.productId}_${Date.now()}`;
    setCart((current) => ({
      ...current,
      [cartKey]: {
        quantity:    varData.quantity,
        spiceLevel:  varData.spiceLevel,
        toppings:    varData.toppings,
        sideMenu:    varData.sideMenu,
        notes:       varData.notes,
        totalPrice:  varData.totalPrice,
        productId:   varData.productId,
      }
    }));
    show(`${varData.productName} ditambahkan ke keranjang! 🛒`);
    setVariationProduct(null);
  };

  return (
    <>
      <div className="flex flex-col p-4 gap-4">
        <div className="flex flex-col mb-2">
          <span className="text-caption text-muted">MENU</span>
          <h2 className="heading" style={{ fontSize: '24px' }}>Pilih Menu</h2>
          <p className="text-body text-muted">Cari menu favorit dan pilih makanan yang ingin dipesan.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-background flex items-center gap-2 p-2 w-full" style={{ borderRadius: '12px' }}>
            <Search size={16} className="text-muted ml-2" />
            <input
              type="text"
              className="w-full bg-background border-0"
              style={{ outline: 'none', padding: '4px' }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari menu favorit..."
            />
            {query && (
              <button
                type="button"
                className="btn-icon"
                style={{ minHeight: '24px', minWidth: '24px' }}
                onClick={() => setQuery('')}
                aria-label="Hapus pencarian"
              >
                <X size={14} className="text-muted" />
              </button>
            )}
          </div>

          <div className="category-chips-scroll">
            <button
              type="button"
              className={`category-chip ${category === 'Semua' ? 'active' : ''}`}
              onClick={() => setCategory('Semua')}
            >
              <CategoryIcon name="Semua" size={16} />
              Semua
            </button>
            {categories.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`category-chip ${category.toLowerCase() === item.name.toLowerCase() ? 'active' : ''}`}
                onClick={() => setCategory(item.name)}
              >
                <CategoryIcon icon={item.icon} name={item.name} size={16} />
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {query && (
          <div className="text-body text-muted mb-2">
            <span>Hasil pencarian untuk </span>
            <strong className="text-text">"{query}"</strong>
          </div>
        )}

        <div className="product-grid">
          {visible.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onAdd={() => handleAddClick(item)}
            />
          ))}
        </div>

        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 mt-4 card text-center">
            <div className="bg-background flex items-center justify-center mb-4" style={{ width: '64px', height: '64px', borderRadius: '50%' }}>
              <Search size={27} className="text-muted" />
            </div>
            <h3 className="heading mb-2">Menu tidak ditemukan</h3>
            <p className="text-body text-muted mb-4">
              {query
                ? `Tidak ada menu yang cocok dengan kata kunci "${query}".`
                : `Tidak ada menu pada kategori "${category}".`}
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setQuery('');
                setCategory('Semua');
              }}
            >
              Reset Filter & Tampilkan Semua Menu
            </button>
          </div>
        )}
      </div>

      {/* Variation Modal */}
      {variationProduct && (
        <VariationModal
          product={variationProduct}
          onConfirm={handleVariationConfirm}
          onClose={() => setVariationProduct(null)}
        />
      )}
    </>
  );
}




function ProductCard({
  item,
  onAdd
}) {
  return (
    <article className="product-card-square">
      {/* Gambar Persegi Rasio 1:1 */}
      <div className="product-img-aspect">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
          />
        ) : (
          <span style={{ fontSize: '38px' }}>🍗</span>
        )}
      </div>

      <div className="product-card-body">
        <span className="product-card-cat">
          {item.categories?.name || 'Menu'}
        </span>

        <h3 className="product-card-title" title={item.name}>
          {item.name}
        </h3>

        {item.description ? (
          <p className="product-card-desc">
            {item.description}
          </p>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        <div className="product-card-footer">
          <strong className="product-card-price">
            {money(item.price)}
          </strong>

          {onAdd && (
            <button
              type="button"
              className="product-add-btn"
              onClick={onAdd}
              aria-label={`Tambah ${item.name}`}
              title="Pilih variasi dan pesan"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   CUSTOMER CART
========================================================= */


function CustomerCart({
  api,
  profile,
  show
}) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState(normalizeCart(loadCart()));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editKey, setEditKey] = useState(null); // cart key being edited
  const navigate = useNavigate();

  useEffect(() => {
    api('/menu')
      .then((data) => setMenu(data || []))
      .catch((e) => show(e.message, 'error'));
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  // Build entries from cart. Cart keys are either "productId" (legacy) or "productId_timestamp"
  const entries = Object.entries(cart)
    .map(([key, item]) => {
      const productId = Number(item?.productId || key.split('_')[0]);
      const menuItem  = menu.find((m) => m.id === productId);
      return {
        key,
        menu:       menuItem,
        productId,
        quantity:   Number(item?.quantity || 0),
        spiceLevel: item?.spiceLevel || 'sedang',
        toppings:   item?.toppings   || [],
        sideMenu:   item?.sideMenu   || null,
        notes:      item?.notes      || '',
        totalPrice: Number(item?.totalPrice || 0),
      };
    })
    .filter((item) => item.menu && item.quantity > 0);

  // Total: use stored totalPrice if available, else fallback to base price * qty
  const total = entries.reduce((sum, item) => {
    if (item.totalPrice > 0) return sum + item.totalPrice;
    return sum + Number(item.menu.price) * item.quantity;
  }, 0);

  const removeItem = (key) => {
    setCart((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    show('Item dihapus dari keranjang.');
  };

  const updateQty = (key, delta) => {
    setCart((current) => {
      const existing = current[key] || { quantity: 0 };
      const quantity = Math.max(0, Number(existing.quantity || 0) + delta);
      const next = { ...current };
      if (quantity === 0) {
        delete next[key];
      } else {
        // Recalculate totalPrice based on new qty
        const perItem = existing.totalPrice ? existing.totalPrice / (existing.quantity || 1) : Number(menu.find(m => m.id === existing.productId || m.id === Number(key.split('_')[0]))?.price || 0);
        next[key] = { ...existing, quantity, totalPrice: perItem * quantity };
      }
      return next;
    });
  };

  // Called when user saves an edited variation
  const handleEditConfirm = (varData) => {
    setCart((current) => ({
      ...current,
      [editKey]: {
        quantity:   varData.quantity,
        spiceLevel: varData.spiceLevel,
        toppings:   varData.toppings,
        sideMenu:   varData.sideMenu,
        notes:      varData.notes,
        totalPrice: varData.totalPrice,
        productId:  varData.productId,
      }
    }));
    show('Variasi pesanan diperbarui.');
    setEditKey(null);
  };

  const checkout = async () => {
    if (!entries.length) {
      show('Keranjang masih kosong.', 'error');
      return;
    }
    if (!profile.full_name?.trim()) {
      show('Nama pelanggan belum lengkap. Isi di Pengaturan.', 'error');
      navigate('/pengaturan'); return;
    }
    if (!profile.phone?.trim()) {
      show('Nomor telepon belum diisi. Lengkapi di Pengaturan.', 'error');
      navigate('/pengaturan'); return;
    }
    if (!profile.address?.trim()) {
      show('Alamat belum diisi. Lengkapi di Pengaturan.', 'error');
      navigate('/pengaturan'); return;
    }

    setSubmitting(true);
    try {
      const result = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName:  profile.full_name,
          customerPhone: profile.phone,
          address:       profile.address,
          latitude:      profile.latitude  ?? null,
          longitude:     profile.longitude ?? null,
          orderNotes:    orderNotes.trim() || null,
          salesChannel:  'website',
          paymentMethod,
          items: entries.map((item) => ({
            menuId:    item.menu.id,
            quantity:  item.quantity,
            spiceLevel: item.spiceLevel || 'sedang',
            // Pass toppings/sideMenu as notes addon if API supports it
            notes: [
              item.toppings?.length ? `Topping: ${item.toppings.map(t => t.name).join(', ')}` : '',
              item.sideMenu?.name   ? `Minuman: ${item.sideMenu.name}` : '',
              item.notes            ? item.notes : '',
            ].filter(Boolean).join(' | ') || null,
          }))
        })
      });

      setCart({});
      saveCart({});
      setOrderNotes('');
      show(`Pesanan ${result.order_code} berhasil dikirim ke kasir.`);
      navigate('/pesanan');
    } catch (error) {
      show(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const editEntry = editKey ? entries.find(e => e.key === editKey) : null;

  return (
    <>
      <div className="flex flex-col p-6 gap-6">
        <PageHeader
          eyebrow="KERANJANG & CHECKOUT"
          title="Checkout Pesanan"
          description="Cek pilihan variasi, atur pembayaran, dan kirim pesanan."
        />

        <div className="checkout-layout">
          {/* Cart items */}
          <section className="card">
            <div className="card-header">
              <div>
                <span className="eyebrow">YOUR ORDER</span>
                <h3>Keranjang</h3>
              </div>
              <span className="count-badge">
                {entries.reduce((sum, item) => sum + item.quantity, 0)} item
              </span>
            </div>

            {entries.length ? (
              <div className="cart-list">
                {entries.map((item) => {
                  const itemTotal = item.totalPrice > 0
                    ? item.totalPrice
                    : Number(item.menu.price) * item.quantity;

                  return (
                    <div className="cart-row" key={item.key}>

                      <div className="cart-image">
                        {item.menu.image_url
                          ? <img src={item.menu.image_url} alt={item.menu.name} />
                          : '🍗'}
                      </div>

                      <div className="cart-row-var">
                        <strong>{item.menu.name}</strong>
                        <span className="cart-unit-price-inline">{money(item.menu.price)} / item</span>

                        {/* Variation summary */}
                        <CustomizationSummary
                          spiceLevel={item.spiceLevel}
                          toppings={item.toppings}
                          sideMenu={item.sideMenu}
                          notes={item.notes}
                        />

                        <button
                          type="button"
                          className="cart-edit-btn"
                          onClick={() => setEditKey(item.key)}
                        >
                          Edit Variasi
                        </button>
                      </div>

                      <div className="qty-controls">
                        <button type="button" onClick={() => updateQty(item.key, -1)}>
                          <Minus size={13} />
                        </button>
                        <b>{item.quantity}</b>
                        <button type="button" onClick={() => updateQty(item.key, 1)}>
                          <Plus size={13} />
                        </button>
                      </div>

                      <div className="cart-item-price">{money(itemTotal)}</div>

                      <button
                        type="button"
                        className="icon-danger"
                        onClick={() => removeItem(item.key)}
                      >
                        <Trash2 size={15} />
                      </button>

                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty
                title="Keranjang kosong"
                text="Pilih menu dan tentukan variasi untuk mulai membuat pesanan."
                icon={<ShoppingBag size={27} />}
                action={
                  <Link className="btn btn-primary" to="/menu">
                    Pilih Menu
                  </Link>
                }
              />
            )}
          </section>

          {/* Checkout side */}
          <aside className="card checkout-side">
            <span className="eyebrow">CUSTOMER DETAILS</span>
            <h3>Detail Pesanan</h3>

            <div className="form-stack">
              <div className="checkout-profile-box">
                <div className="checkout-profile-head">
                  <div>
                    <span className="eyebrow">DATA PELANGGAN</span>
                    <h4>Informasi Pengiriman</h4>
                  </div>
                  <Link to="/pengaturan" className="profile-edit-link">Ubah</Link>
                </div>

                <div className="checkout-profile-row">
                  <strong>{profile.full_name || 'Belum diisi'}</strong>
                  <span>Nama pelanggan</span>
                </div>
                <div className="checkout-profile-row">
                  <strong>{profile.phone || 'Belum diisi'}</strong>
                  <span>Nomor telepon</span>
                </div>
                <div className="checkout-profile-row">
                  <strong>{profile.address || 'Belum diisi'}</strong>
                  <span>Alamat</span>
                </div>

                <div className="checkout-location">
                  <MapPin size={15} />
                  <div>
                    <strong>Lokasi Pemesan</strong>
                    <span>
                      {profile.latitude !== null && profile.latitude !== undefined &&
                       profile.longitude !== null && profile.longitude !== undefined
                        ? `${Number(profile.latitude).toFixed(6)}, ${Number(profile.longitude).toFixed(6)}`
                        : 'Lokasi belum ditentukan'
                      }
                    </span>
                    {profile.latitude !== null && profile.latitude !== undefined &&
                     profile.longitude !== null && profile.longitude !== undefined && (
                      <a
                        href={`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Lihat titik di Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="order-note-field">
                <label>Catatan Umum Pesanan</label>
                <textarea
                  rows="3"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Contoh: antar ke pintu, hubungi sebelum tiba..."
                  maxLength={300}
                />
                <small>Catatan tambahan untuk keseluruhan pesanan.</small>
              </div>

              <div>
                <span className="form-caption">Metode Pembayaran</span>
                <div className="payment-grid">
                  {['cash', 'qris', 'transfer'].map((method) => (
                    <button
                      type="button"
                      key={method}
                      className={paymentMethod === method ? 'selected' : ''}
                      onClick={() => setPaymentMethod(method)}
                    >
                      <WalletCards size={15} />
                      {method === 'cash' ? 'CASH' : method === 'qris' ? 'QRIS' : 'TRANSFER'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="summary-box">
                <span>Total Pesanan</span>
                <strong>{money(total)}</strong>
              </div>

              <button
                className="btn btn-primary full"
                onClick={checkout}
                disabled={submitting || !entries.length}
              >
                {submitting ? 'Mengirim...' : 'Checkout Pesanan'}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Edit Variation Modal */}
      {editKey && editEntry && (
        <VariationModal
          product={editEntry.menu}
          initial={{
            spiceLevel: editEntry.spiceLevel,
            toppings:   editEntry.toppings,
            sideMenu:   editEntry.sideMenu,
            notes:      editEntry.notes,
            quantity:   editEntry.quantity,
          }}
          onConfirm={handleEditConfirm}
          onClose={() => setEditKey(null)}
          isEdit
        />
      )}
    </>
  );
}




function CustomerOrders({
  api,
  show
}) {
  const [
    orders,
    setOrders
  ] = useState([]);

  const previousRef =
    useRef({});

  const notifyStatus =
    (order) => {
      if (
        order.status ===
        'preparing'
      ) {
        show(
          `Pesanan ${order.order_code} sedang disiapkan.`
        );
      }

      if (
        order.status ===
        'ready'
      ) {
        show(
          `Pesanan ${order.order_code} sudah siap diambil.`
        );
      }

      if (
        order.status ===
        'cancelled'
      ) {
        show(
          `Pesanan ${order.order_code} ditolak kasir.`,
          'error'
        );
      }
    };

  const load =
    async (notifyChange=true) => {
      try {
        const data =
          await api(
            '/my/orders'
          );

        if (
          notifyChange &&
          orders.length
        ) {
          data.forEach(
            (order) => {
              const old =
                previousRef
                  .current[
                    order.id
                  ];

              if (
                old &&
                old !==
                  order.status
              ) {
                notifyStatus(
                  order
                );
              }

              previousRef.current[
                order.id
              ] =
                order.status;
            }
          );
        } else {
          data.forEach(
            (order) => {
              previousRef.current[
                order.id
              ] =
                order.status;
            }
          );
        }

        setOrders(
          data
        );

      } catch(error) {
        show(
          error.message,
          'error'
        );
      }
    };

  useEffect(() => {
    load(false);

    const timer =
      setInterval(
        () => load(true),
        5000
      );

    return () =>
      clearInterval(
        timer
      );
  }, []);

  return (
    <div className="flex flex-col p-6 gap-6">

      <PageHeader
        eyebrow="ORDER TRACKING"
        title="Pesanan Saya"
        description="Pantau status pesanan sampai siap diambil."
      />

      <div className="notification-banner">

        <Bell size={17}/>

        <div>
          <strong>
            Notifikasi pesanan aktif
          </strong>

          <span>
            Status pesanan diperiksa otomatis setiap beberapa detik.
          </span>
        </div>

      </div>

      <div className="order-history-list">

        {orders.map(
          (order) => (
            <CustomerOrderCard
              key={
                order.id
              }
              order={
                order
              }
            />
          )
        )}

      </div>

      {!orders.length && (
        <Empty
          title="Belum ada pesanan"
          text="Pesanan yang kamu checkout akan muncul di sini."
          icon={
            <ReceiptText
              size={28}
            />
          }
        />
      )}

    </div>
  );
}


function CustomerOrderCard({
  order
}) {

  const calculateOrderTotal = (order) => {
    const storedTotal = Number(order?.total || 0);

    if (storedTotal > 0) {
      return storedTotal;
    }

    return (order?.order_items || []).reduce(
      (sum, item) =>
        sum +
        Number(item.unit_price || 0) *
        Number(item.quantity || 0),
      0
    );
  };

  const total = calculateOrderTotal(order);

  const flow = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'completed'
  ];

  const activeIndex =
    flow.indexOf(
      order.status
    );

  return (
    <article className="order-card">

      <div className="order-card-head">

        <div>

          <span className="eyebrow">
            {order.order_code}
          </span>

          <h3>
            {
              fmtDate(
                order.ordered_at
              )
            }
          </h3>

        </div>

        <span
          className={
            `status-chip ${order.status}`
          }
        >
          {
            labels[
              order.status
            ] ||
            order.status
          }
        </span>

      </div>

      {order.status !== 'cancelled' && (
        <div className="status-timeline">

          {flow.map(
            (step,index) => (
              <div
                className={
                  `timeline-step ${
                    index <= activeIndex
                      ? 'done'
                      : ''
                  }`
                }
                key={step}
              >

                <div className="timeline-dot">

                  {(
                    index <
                      activeIndex ||
                    order.status ===
                      'completed'
                  ) && (
                    <Check size={11}/>
                  )}

                </div>

                <span>
                  {
                    labels[
                      step
                    ]
                  }
                </span>

              </div>
            )
          )}

        </div>
      )}

      <div className="order-items-preview">

        {(order.order_items || []).map(
          (item) => (
            <div
              className="order-history-item"
              key={item.id}
            >

              <div>

                <strong>
                  {
                    item.menu?.name ||
                    'Menu'
                  } × {
                    item.quantity
                  }
                </strong>

                {item.menu?.categories?.name === 'Ayam Geprek' && (
                  <small>
                    Level Sambal:{' '}
                    {spiceLabel(item.spice_level)}
                  </small>
                )}

                {item.notes && (
                  <small style={{ color: 'var(--accent)', display: 'block', marginTop: '2px' }}>
                    {item.notes}
                  </small>
                )}

              </div>

              <strong>
                {
                  money(
                    Number(
                      item.unit_price
                    ) *
                      item.quantity
                  )
                }
              </strong>

            </div>
          )
        )}

      </div>

      {order.order_notes && (
        <div className="customer-order-note">
          <strong>Catatan Pesanan</strong>
          <span>{order.order_notes}</span>
        </div>
      )}

      <div className="order-card-footer">

  <span>
    {
      (
        order.payment_method ||
        '-'
      ).toUpperCase()
    } · {
      paymentLabel(order)
    }
  </span>

  <strong>
    {
      money(total)
    }
  </strong>

</div>

      {order.address && (
        <div className="order-address">
          <MapPin size={14}/>
          {order.address}
        </div>
      )}

    </article>
  );
}

function SettingsPage({
  api,
  profile,
  show,
  onProfileUpdate
}) {
  const [form,setForm] = useState({
    fullName:profile.full_name || '',
    phone:profile.phone || '',
    address:profile.address || '',
    latitude:profile.latitude ?? '',
    longitude:profile.longitude ?? ''
  });

  const [saving,setSaving] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      show('Browser tidak mendukung GPS.','error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude:position.coords.latitude,
          longitude:position.coords.longitude
        }));
        show('Lokasi GPS berhasil diambil.');
      },
      (error) => {
        let message = 'Izin lokasi belum diberikan.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Akses lokasi ditolak. Izinkan lokasi pada browser.';
        }
        show(message,'error');
      },
      {enableHighAccuracy:true,timeout:10000,maximumAge:0}
    );
  };

  const save = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      show('Nama lengkap wajib diisi.','error');
      return;
    }

    if (!form.phone.trim()) {
      show('Nomor telepon wajib diisi.','error');
      return;
    }

    if (!form.address.trim()) {
      show('Alamat wajib diisi.','error');
      return;
    }

    setSaving(true);

    try {
      const updatedProfile = await api('/profile',{
        method:'PUT',
        body:JSON.stringify({
          fullName:form.fullName.trim(),
          phone:form.phone.trim(),
          address:form.address.trim(),
          latitude:form.latitude === '' ? null : Number(form.latitude),
          longitude:form.longitude === '' ? null : Number(form.longitude)
        })
      });

      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      setForm({
        fullName:updatedProfile.full_name || '',
        phone:updatedProfile.phone || '',
        address:updatedProfile.address || '',
        latitude:updatedProfile.latitude ?? '',
        longitude:updatedProfile.longitude ?? ''
      });

      show('Pengaturan profil berhasil disimpan.');
    } catch(error) {
      show(error.message,'error');
    } finally {
      setSaving(false);
    }
  };

  const hasLocation =
    form.latitude !== '' &&
    form.longitude !== '';

  return (
    <div className="flex flex-col p-6 gap-6">

      <PageHeader
        eyebrow="ACCOUNT SETTINGS"
        title="Pengaturan"
        description="Lengkapi biodata pelanggan yang otomatis digunakan saat checkout."
      />

      <section className="settings-grid">

        <div className="card">
          <div className="settings-avatar">
            {(form.fullName || 'P')[0].toUpperCase()}
          </div>

          <h3>Informasi Akun</h3>

          <p>
            Nama, nomor telepon, alamat, dan lokasi yang disimpan di sini akan digunakan otomatis saat checkout.
          </p>

          <div className="profile-location-hint">
            <MapPin size={15}/>
            <span>
              Gunakan lokasi saat ini untuk menyimpan titik pemesan.
            </span>
          </div>
        </div>

        <form
          className="card form-stack"
          onSubmit={save}
        >

          <label>
            Nama Lengkap
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm({...form,fullName:e.target.value})
              }
              required
            />
          </label>

          <label>
            Nomor Telepon
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm({...form,phone:e.target.value})
              }
              placeholder="08xxxxxxxxxx"
              required
            />
          </label>

          <label>
            Alamat Lengkap
            <textarea
              rows="4"
              value={form.address}
              onChange={(e) =>
                setForm({...form,address:e.target.value})
              }
              placeholder="Contoh: Jl. Soekarno Hatta No. 10, Semarang"
              required
            />
          </label>

          <button
            type="button"
            className="location-button"
            onClick={getLocation}
          >
            <MapPin size={15}/>
            Gunakan Lokasi Saat Ini
          </button>

          {hasLocation && (
            <div className="map-location-card">
              <div className="map-location-icon">
                <MapPin size={18}/>
              </div>

              <div className="map-location-info">
                <strong>Lokasi tersimpan</strong>
                <span>
                  {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Lihat di Google Maps
                </a>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>

        </form>
      </section>
    </div>
  );
}

/* =========================================================
   CASHIER
========================================================= */

function CashierApp({
  profile,
  api,
  show,
  logout
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="cashier-layout">

      {/* MOBILE TOPBAR */}
      <header className="cashier-mobile-topbar">

        <button
          type="button"
          className="cashier-menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>

         <div className="cashier-mobile-brand">

    <div className="cashier-mobile-logo-box">
      <img
        src="/logo-dapoersari.png"
        alt="Dapoersari"
        className="cashier-mobile-logo-image"
      />
    </div>

    <div className="cashier-mobile-brand-text">
      <strong>Ayam Geprek Dapoer Sari</strong>
      <span>Cashier Center</span>
    </div>

  </div>

      </header>


      {/* OVERLAY MOBILE */}
      {menuOpen && (
        <div
          className="cashier-sidebar-overlay"
          onClick={closeMenu}
        />
      )}


      {/* SIDEBAR */}
      <aside
        className={
          `sidebar cashier-sidebar ${
            menuOpen ? 'mobile-open' : ''
          }`
        }
      >

        <Link
          to="/kasir"
          className="brand-link"
          onClick={closeMenu}
        >
          <div className="brand-logo-box">
            <img
              src="/logo-dapoersari.png"
              alt="Dapoersari"
              className="brand-logo-image"
            />
          </div>

          <div className="brand-app-name">
            <strong>Ayam Geprek Dapoer Sari</strong>
            <span>Cashier Center</span>
          </div>
        </Link>


        <div className="cashier-role">
          <ShieldCheck size={14} />
          ADMIN / KASIR
        </div>


        <nav
          className="side-nav"
          onClick={closeMenu}
        >

          <SideLink
            to="/kasir"
            end
            icon={
              <LayoutDashboard />
            }
            text="Dashboard"
          />

          <SideLink
            to="/kasir/menu"
            icon={
              <Utensils />
            }
            text="Kelola Menu"
          />

          <SideLink
            to="/kasir/kategori"
            icon={
              <Tags />
            }
            text="Kategori Menu"
          />


          <SideLink
            to="/kasir/pesanan"
            icon={
              <ReceiptText />
            }
            text="Kelola Pesanan"
          />

          <SideLink
            to="/kasir/manual"
            icon={
              <Plus />
            }
            text="Input Manual"
          />

        </nav>


        <div className="sidebar-grow" />


        {/* USER */}
        <div className="side-user">

          <div className="avatar">
            {
              (
                profile?.full_name ||
                'K'
              )[0].toUpperCase()
            }
          </div>

          <div>
            <b>
              {
                profile?.full_name ||
                'Kasir'
              }
            </b>

            <span>
              CASHIER
            </span>
          </div>

        </div>


        {/* LOGOUT */}
        <button
          type="button"
          className="side-logout"
          onClick={logout}
        >
          <LogOut size={14} />
          Keluar
        </button>

      </aside>


      {/* MAIN */}
      <main className="main-content">

        <Header
          profile={profile}
        />

        <Routes>

          <Route
            path="/kasir"
            element={
              <CashierDashboard
                api={api}
                show={show}
              />
            }
          />

          <Route
            path="/kasir/menu"
            element={
              <CashierMenu
                api={api}
                show={show}
              />
            }
          />

          <Route
            path="/kasir/kategori"
            element={
              <CashierCategories
                api={api}
                show={show}
              />
            }
          />


          <Route
            path="/kasir/pesanan"
            element={
              <CashierOrders
                api={api}
                show={show}
              />
            }
          />

          <Route
            path="/kasir/manual"
            element={
              <ManualOrder
                api={api}
                show={show}
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/kasir"
                replace
              />
            }
          />
          <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>

      </main>

    </div>
  );
}

function Header() {
  return (
    <header className="header">
      <div />
    </header>
  );
}

function PageHeader({
  eyebrow,
  title,
  description
}) {
  return (
    <div className="page-header">

      <span className="eyebrow">
        {eyebrow}
      </span>

      <h1>
        {title}
      </h1>

      <p>
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   CASHIER DASHBOARD
========================================================= */


/* =========================================================
   CASHIER ORDER DETAIL MODAL
========================================================= */

function CashierOrderDetailModal({ order, onClose, onUpdateStatus, onPrintReceipt }) {
  if (!order) return null;

  const total = (order.order_items || []).reduce(
    (sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0),
    0
  ) || Number(order.total || 0);

  const paymentStatus = order.status === 'completed' ? 'paid' : 'pending';

  return (
    <div className="cat-modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="cat-modal-content p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow" style={{ margin: 0 }}>DETAIL PESANAN</span>
              <Status status={order.status} />
            </div>
            <h3 className="heading" style={{ fontSize: '20px', marginTop: '4px', margin: 0 }}>
              {order.order_code}
            </h3>
            <span className="text-caption text-muted">
              {fmtDate(order.ordered_at)} · Saluran: {(order.sales_channel || 'website').toUpperCase()}
            </span>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Customer Information */}
        <div className="checkout-profile-box mt-4">
          <div className="checkout-profile-row">
            <strong>{order.customer_name || 'Pelanggan'}</strong>
            <span>Nama Pemesan</span>
          </div>
          {order.customer_phone && (
            <div className="checkout-profile-row">
              <strong>{order.customer_phone}</strong>
              <span>Nomor Telepon</span>
            </div>
          )}
          {order.address && (
            <div className="checkout-profile-row">
              <strong>{order.address}</strong>
              <span>Alamat Pengantaran</span>
            </div>
          )}
        </div>

        {/* Menu Items Breakdown */}
        <div className="mt-4">
          <span className="eyebrow">DAFTAR MENU PESANAN</span>
          <div className="order-items mt-2">
            {(order.order_items || []).map((item) => {
              const isAyamGeprek = item.menu?.categories?.name === 'Ayam Geprek';
              const itemTotal = Number(item.unit_price || 0) * Number(item.quantity || 0);

              return (
                <div className="cashier-order-item" key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>
                      {item.menu?.name || 'Menu'} × {item.quantity}
                    </strong>
                    {isAyamGeprek && (
                      <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                        Level Sambal: {spiceLabel(item.spice_level)}
                      </small>
                    )}
                    {item.notes && (
                      <small style={{ color: 'var(--accent)', display: 'block', marginTop: '3px', fontWeight: 500 }}>
                        {item.notes}
                      </small>
                    )}
                  </div>
                  <b style={{ fontSize: '14px' }}>{money(itemTotal)}</b>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Notes */}
        {order.order_notes && (
          <div className="cashier-order-note mt-3">
            <strong>Catatan Keseluruhan:</strong>
            <span>{order.order_notes}</span>
          </div>
        )}

        {/* Payment Summary */}
        <div className="cashier-payment-info mt-4">
          <div>
            <span>Metode Bayar</span>
            <strong>{(order.payment_method || '-').toUpperCase()}</strong>
          </div>
          <div>
            <span>Status Bayar</span>
            <strong className={paymentStatus === 'paid' ? 'payment-paid' : 'payment-pending'}>
              {paymentStatus === 'paid' ? 'LUNAS' : 'MENUNGGU'}
            </strong>
          </div>
          <div>
            <span>Total Pembayaran</span>
            <strong style={{ color: 'var(--accent)', fontSize: '16px' }}>{money(total)}</strong>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t mt-5">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onPrintReceipt && onPrintReceipt(order)}
          >
            <Printer size={15} /> Cetak Struk
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {order.status === 'pending' && (
              <>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onUpdateStatus(order, 'cancelled')}
                >
                  Tolak Pesanan
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onUpdateStatus(order, 'confirmed')}
                >
                  <Check size={15} /> Terima Pesanan
                </button>
              </>
            )}

            {order.status === 'confirmed' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onUpdateStatus(order, 'preparing')}
              >
                <Utensils size={15} /> Mulai Siapkan
              </button>
            )}

            {order.status === 'preparing' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onUpdateStatus(order, 'ready')}
              >
                <Package size={15} /> Tandai Siap Diambil
              </button>
            )}

            {order.status === 'ready' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onUpdateStatus(order, 'completed')}
              >
                <CheckCircle2 size={15} /> Selesaikan & Lunas
              </button>
            )}

            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CashierDashboard({
  api,
  show
}) {
  const calculateOrderTotal = (order) => {
    const storedTotal = Number(order?.total || 0);

    if (storedTotal > 0) {
      return storedTotal;
    }

    return (order?.order_items || []).reduce(
      (sum, item) =>
        sum +
        Number(item.unit_price || 0) *
        Number(item.quantity || 0),
      0
    );
  };

  const [data, setData] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    paidOrders: 0,
    omzetToday: 0
  });

  const [orders, setOrders] = useState([]);

  const load = async () => {
    try {
      const [dashboard, allOrders] = await Promise.all([
        api('/cashier/dashboard'),
        api('/cashier/orders')
      ]);

      setData(dashboard);
      setOrders(allOrders.slice(0, 15)); // Increased to 15 to show more items on the board
    } catch(error) {
      show(error.message, 'error');
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col p-6 gap-6">
      <section className="cashier-hero">
        <div>
          <span className="eyebrow light">LIVE ORDER CENTER</span>
          <h1>Semua pesanan,<br/>satu kendali.</h1>
          <p>Terima pesanan pelanggan, siapkan makanan, dan tandai siap diambil.</p>
        </div>
        <Package size={68} strokeWidth={1.3} />
      </section>

      <div className="metric-grid">
        <Metric label="Pesanan Masuk" value={data.totalOrders} icon={<ReceiptText/>} />
        <Metric label="Menunggu" value={data.pendingOrders} icon={<Clock3/>} />
        <Metric label="Diproses" value={data.preparingOrders} icon={<Utensils/>} />
        <Metric label="Siap Diambil" value={data.readyOrders} icon={<Package/>} />
        <Metric label="Selesai" value={data.completedOrders} icon={<CheckCircle2/>} />
        <Metric label="Omzet Hari Ini" value={money(data.omzetToday)} icon={<Sparkles/>} />
      </div>

      <div className="order-board">
        <div className="board-column">
          <div className="board-header">Menunggu</div>
          {orders.filter(o => o.status === 'pending').map(order => (
            <div key={order.id} className="cashier-order">
              <div>
                <span className="eyebrow">{order.order_code}</span>
                <h4>{order.customer_name || 'Pelanggan'}</h4>
              </div>
            </div>
          ))}
        </div>

        <div className="board-column">
          <div className="board-header">Diproses</div>
          {orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).map(order => (
            <div key={order.id} className="cashier-order">
              <div>
                <span className="eyebrow">{order.order_code}</span>
                <h4>{order.customer_name || 'Pelanggan'}</h4>
              </div>
            </div>
          ))}
        </div>

        <div className="board-column">
          <div className="board-header">Siap Diambil</div>
          {orders.filter(o => o.status === 'ready').map(order => (
            <div key={order.id} className="cashier-order">
              <div>
                <span className="eyebrow">{order.order_code}</span>
                <h4>{order.customer_name || 'Pelanggan'}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <span>{label}</span>
        <div className="kpi-icon">
          {React.cloneElement(icon, {size:17})}
        </div>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   CASHIER CATEGORIES MANAGEMENT
========================================================= */

function CashierCategories({
  api,
  show
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewCat, setPreviewCat] = useState('Semua');

  const slugify = (text) =>
    (text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const emptyForm = {
    name: '',
    slug: '',
    icon: 'Utensils',
    isActive: true,
    sortOrder: 0
  };

  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/cashier/categories');
      setCategories(data || []);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditingCat(null);
    setForm({
      name: '',
      slug: '',
      icon: 'Utensils',
      isActive: true,
      sortOrder: (categories.length + 1) * 10
    });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    setForm({
      name: cat.name,
      slug: cat.slug || slugify(cat.name),
      icon: cat.icon || 'Utensils',
      isActive: cat.status !== 'inactive',
      sortOrder: cat.sortOrder ?? 0
    });
    setModalOpen(true);
  };

  const onNameChange = (val) => {
    if (!editingCat) {
      setForm((prev) => ({
        ...prev,
        name: val,
        slug: slugify(val)
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        name: val
      }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      show('Nama kategori wajib diisi.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        icon: form.icon || 'Utensils',
        isActive: Boolean(form.isActive),
        sortOrder: Number(form.sortOrder) || 0
      };

      if (editingCat) {
        await api(`/cashier/categories/${editingCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        show(`Kategori "${payload.name}" berhasil diperbarui.`);
      } else {
        await api('/cashier/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        show(`Kategori "${payload.name}" berhasil ditambahkan.`);
      }

      setModalOpen(false);
      await load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.menuCount > 0) {
      show(
        `Kategori "${deleteConfirm.name}" tidak dapat dihapus karena masih digunakan oleh ${deleteConfirm.menuCount} menu.`,
        'error'
      );
      setDeleteConfirm(null);
      return;
    }

    setSaving(true);
    try {
      await api(`/cashier/categories/${deleteConfirm.id}`, {
        method: 'DELETE'
      });
      show(`Kategori "${deleteConfirm.name}" berhasil dihapus.`);
      setDeleteConfirm(null);
      await load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = categories.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.slug && c.slug.toLowerCase().includes(q))
    );
  });

  const activeCategories = categories.filter((c) => c.status !== 'inactive');

  return (
    <div className="flex flex-col p-6 gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="eyebrow">MANAJEMEN KATEGORI</span>
          <h2 className="heading" style={{ fontSize: '26px', margin: '4px 0' }}>
            Kategori Menu
          </h2>
          <p className="text-body text-muted">
            Kelola kategori produk untuk menu kasir dan navigasi aplikasi customer.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openAdd}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      {/* PREVIEW TAMPILAN CUSTOMER */}
      <section className="card p-5" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: '#F97316' }} />
            <h4 className="heading" style={{ fontSize: '16px', margin: 0 }}>
              Preview Tampilan Customer
            </h4>
          </div>
          <span className="text-caption text-muted">
            {activeCategories.length} kategori aktif ditampilkan ke pelanggan
          </span>
        </div>

        <p className="text-caption text-muted mb-3">
          Simulasi chips kategori di halaman pemesanan pelanggan:
        </p>

        <div className="cat-preview-box">
          <div className="category-chips-scroll">
            <button
              type="button"
              className={`category-chip ${previewCat === 'Semua' ? 'active' : ''}`}
              onClick={() => setPreviewCat('Semua')}
            >
              <CategoryIcon name="Semua" size={15} />
              Semua
            </button>
            {activeCategories.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`category-chip ${previewCat === c.name ? 'active' : ''}`}
                onClick={() => setPreviewCat(c.name)}
              >
                <CategoryIcon icon={c.icon} name={c.name} size={15} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* DAFTAR KATEGORI */}
      <section className="card p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
          <div className="bg-background flex items-center gap-2 p-2" style={{ borderRadius: '12px', minWidth: '260px', flex: 1, maxWidth: '400px' }}>
            <Search size={16} className="text-muted ml-2" />
            <input
              type="text"
              className="w-full bg-background border-0"
              style={{ outline: 'none', padding: '4px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori atau slug..."
            />
            {search && (
              <button
                type="button"
                className="btn-icon"
                style={{ minHeight: '22px', minWidth: '22px' }}
                onClick={() => setSearch('')}
              >
                <X size={13} className="text-muted" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-caption text-muted">
              Total: <strong>{categories.length}</strong> kategori
            </span>
            <button className="btn btn-secondary" onClick={load} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="cat-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th style={{ width: '70px' }}>Icon</th>
                <th>Nama Kategori</th>
                <th>Slug URL</th>
                <th>Jumlah Menu</th>
                <th>Urutan</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat, idx) => (
                <tr key={cat.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: '#FFF7ED',
                        color: '#F97316',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CategoryIcon icon={cat.icon} name={cat.name} size={18} />
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontSize: '14.5px' }}>{cat.name}</strong>
                  </td>
                  <td>
                    <code style={{ fontSize: '12px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '6px' }}>
                      {cat.slug || slugify(cat.name)}
                    </code>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        background: cat.menuCount > 0 ? '#E0F2FE' : '#F1F5F9',
                        color: cat.menuCount > 0 ? '#0369A1' : '#64748B',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {cat.menuCount} menu
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: '#475569' }}>
                      {cat.sortOrder ?? 0}
                    </span>
                  </td>
                  <td>
                    {cat.status === 'inactive' ? (
                      <span className="cat-badge-inactive">● Nonaktif</span>
                    ) : (
                      <span className="cat-badge-active">● Aktif</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setDeleteConfirm(cat)}
                      >
                        <Trash2 size={13} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    {loading ? 'Memuat data kategori...' : 'Tidak ada kategori yang ditemukan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD LIST */}
        <div className="cat-card-grid">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="card p-4"
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#FFF7ED',
                      color: '#F97316',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <CategoryIcon icon={cat.icon} name={cat.name} size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{cat.name}</strong>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      slug: {cat.slug || slugify(cat.name)}
                    </div>
                  </div>
                </div>
                {cat.status === 'inactive' ? (
                  <span className="cat-badge-inactive">Nonaktif</span>
                ) : (
                  <span className="cat-badge-active">Aktif</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#E5E7EB' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                  Jumlah Menu: <strong>{cat.menuCount}</strong> · Urutan: <strong>{cat.sortOrder ?? 0}</strong>
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    onClick={() => setDeleteConfirm(cat)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="card p-6 text-center text-muted">
              {loading ? 'Memuat kategori...' : 'Tidak ada kategori yang ditemukan.'}
            </div>
          )}
        </div>
      </section>

      {/* MODAL TAMBAH / EDIT KATEGORI */}
      {modalOpen && (
        <div className="cat-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="cat-modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              <div>
                <span className="eyebrow">{editingCat ? 'PERBARUI' : 'TAMBAH'}</span>
                <h3 className="heading" style={{ fontSize: '20px', margin: 0 }}>
                  {editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="form-stack mt-4">
              <label>
                Nama Kategori
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Contoh: Paket Nasi, Cemilan, dll"
                  required
                />
              </label>

              <label>
                Slug URL (identitas URL)
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="paket-nasi"
                  required
                />
                <small style={{ color: '#64748B', marginTop: '2px' }}>
                  Format ramah URL untuk filter customer.
                </small>
              </label>

              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Pilih Icon Kategori
                </span>
                <div className="category-icon-picker">
                  {AVAILABLE_CATEGORY_ICONS.map((item) => {
                    const IconCmp = item.icon;
                    const isSelected = form.icon === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`category-icon-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, icon: item.id })}
                      >
                        <IconCmp size={20} />
                        <span style={{ fontSize: '10.5px', textAlign: 'center', lineHeight: 1.2 }}>
                          {item.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label>
                Urutan Tampilan (Angka terkecil tampil paling depan)
                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </label>

              <label className="check-row" style={{ marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Kategori aktif & tampil di menu pelanggan
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: '#E5E7EB', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : editingCat ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfirm && (
        <div className="cat-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="cat-modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: deleteConfirm.menuCount > 0 ? '#FEF3C7' : '#FEE2E2',
                  color: deleteConfirm.menuCount > 0 ? '#D97706' : '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="heading" style={{ fontSize: '18px', margin: 0 }}>
                  {deleteConfirm.menuCount > 0 ? 'Kategori Tidak Dapat Dihapus' : 'Hapus Kategori?'}
                </h3>
                <span className="text-caption text-muted">
                  Kategori: <strong>{deleteConfirm.name}</strong>
                </span>
              </div>
            </div>

            {deleteConfirm.menuCount > 0 ? (
              <div className="text-body mb-5" style={{ color: '#475569', lineHeight: 1.5 }}>
                Kategori ini masih digunakan oleh{' '}
                <strong style={{ color: '#DC2626' }}>{deleteConfirm.menuCount} menu</strong>.
                Sistem tidak mengizinkan penghapusan kategori yang masih memiliki menu aktif.
                Silakan edit menu terkait dan pindahkan ke kategori lain terlebih dahulu.
              </div>
            ) : (
              <div className="text-body mb-5" style={{ color: '#475569', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus kategori <strong>"{deleteConfirm.name}"</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </div>
            )}

            <div className="flex justify-end gap-3">
              {deleteConfirm.menuCount > 0 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Mengerti
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setDeleteConfirm(null)}
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={remove}
                    disabled={saving}
                  >
                    {saving ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   CASHIER MENU
========================================================= */

function CashierMenu({
  api,
  show
}) {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const emptyForm = {
    categoryId: '',
    name: '',
    description: '',
    price: '',
    isActive: true,
    image: null
  };

  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [m, c] = await Promise.all([
      api('/cashier/menu'),
      api('/categories')
    ]);
    setMenu(m || []);
    setCategories(c || []);
  };

  useEffect(() => {
    load().catch((e) => show(e.message, 'error'));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: categories.length > 0 ? String(categories[0].id) : ''
    });
    setPreview('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      categoryId: String(item.category_id || ''),
      name: item.name,
      description: item.description || '',
      price: item.price,
      isActive: item.is_active,
      image: null
    });
    setPreview(item.image_url || '');
    setModalOpen(true);
  };

  const imageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      show('Gunakan JPG, PNG, atau WEBP.', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      show('Ukuran gambar maksimal 3 MB.', 'error');
      return;
    }

    setForm((current) => ({ ...current, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      show('Nama menu wajib diisi.', 'error');
      return;
    }
    if (!form.categoryId) {
      show('Pilih kategori menu terlebih dahulu.', 'error');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      show('Harga menu harus lebih besar dari 0.', 'error');
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      body.append('categoryId', form.categoryId);
      body.append('name', form.name.trim());
      body.append('description', form.description.trim());
      body.append('price', form.price);
      body.append('isActive', String(form.isActive));

      if (form.image) {
        body.append('image', form.image);
      }

      const result = await api(
        editing ? `/cashier/menu/${editing.id}` : '/cashier/menu',
        {
          method: editing ? 'PUT' : 'POST',
          body
        }
      );

      show(editing ? `${result.name} berhasil diperbarui.` : `${result.name} berhasil ditambahkan.`);
      setModalOpen(false);
      await load();
    } catch (error) {
      show(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item) => {
    try {
      await api(`/cashier/menu/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !item.is_active })
      });
      show(item.is_active ? `${item.name} dinonaktifkan.` : `${item.name} diaktifkan.`);
      await load();
    } catch (error) {
      show(error.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      const res = await api(`/cashier/menu/${deleteConfirm.id}`, {
        method: 'DELETE'
      });
      show(res.message || `Menu "${deleteConfirm.name}" berhasil dihapus.`);
      setDeleteConfirm(null);
      await load();
    } catch (error) {
      show(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filter search + category + status
  const filteredMenu = menu.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchName = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
    const matchCategory = selectedCategory === 'Semua' || (item.categories?.name || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchStatus = selectedStatus === 'all' || (selectedStatus === 'active' ? item.is_active : !item.is_active);
    return matchName && matchCategory && matchStatus;
  });

  return (
    <div className="flex flex-col p-6 gap-6">
      {/* TOOLBAR COMPACT & RAPI */}
      <div className="cashier-menu-toolbar">
        <div className="cashier-menu-topbar">
          <div>
            <span className="eyebrow">KATALOG RESTORAN</span>
            <h2 className="heading" style={{ fontSize: '24px', margin: '2px 0 0' }}>
              Kelola Menu ({filteredMenu.length} produk)
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/kasir/kategori" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
              <Tags size={15} /> Kategori Menu
            </Link>
            <Link to="/kasir/variasi" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
              <Layers size={15} /> Variasi Menu
            </Link>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openAdd}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <Plus size={16} /> + Tambah Menu
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Options */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="cashier-search-bar">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                aria-label="Bersihkan"
              >
                <X size={15} className="text-muted" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Saja</option>
              <option value="inactive">Nonaktif Saja</option>
            </select>
          </div>
        </div>

        {/* Filter Chips per Kategori */}
        <div className="category-chips-scroll" style={{ paddingBottom: '4px' }}>
          <button
            type="button"
            className={`category-chip ${selectedCategory === 'Semua' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Semua')}
          >
            <CategoryIcon name="Semua" size={14} />
            Semua ({menu.length})
          </button>
          {categories.map((c) => {
            const count = menu.filter((m) => String(m.category_id) === String(c.id) || (m.categories?.name || '').toLowerCase() === c.name.toLowerCase()).length;
            return (
              <button
                type="button"
                key={c.id}
                className={`category-chip ${selectedCategory.toLowerCase() === c.name.toLowerCase() ? 'active' : ''}`}
                onClick={() => setSelectedCategory(c.name)}
              >
                <CategoryIcon icon={c.icon} name={c.name} size={14} />
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* DAFTAR MENU GRID (2-kolom di mobile, 3-4 kolom di desktop) */}
      <div className="cashier-menu-grid">
        {filteredMenu.map((item) => (
          <article className="cashier-menu-card" key={item.id}>
            <div className="cashier-card-img">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} loading="lazy" />
              ) : (
                <span style={{ fontSize: '38px' }}>🍗</span>
              )}
              <span
                className={`cashier-status-badge ${item.is_active ? 'cat-badge-active' : 'cat-badge-inactive'}`}
              >
                {item.is_active ? '● Aktif' : '● Nonaktif'}
              </span>
            </div>

            <div className="product-card-body">
              <span className="product-card-cat">
                {item.categories?.name || 'Tanpa Kategori'}
              </span>

              <h3 className="product-card-title" title={item.name}>
                {item.name}
              </h3>

              <strong className="product-card-price mb-2" style={{ display: 'block' }}>
                {money(item.price)}
              </strong>

              <div className="cashier-card-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px', flex: 1 }}
                  onClick={() => openEdit(item)}
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  className={`btn ${item.is_active ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '6px 8px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
                  onClick={() => toggle(item)}
                  title={item.is_active ? 'Nonaktifkan menu' : 'Aktifkan menu'}
                >
                  {item.is_active ? 'Off' : 'On'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 8px', color: 'var(--danger)', fontSize: '12px' }}
                  onClick={() => setDeleteConfirm(item)}
                  title="Hapus menu"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </article>
        ))}

        {filteredMenu.length === 0 && (
          <div className="card p-8 text-center text-muted" style={{ gridColumn: '1 / -1' }}>
            <Search size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <strong style={{ display: 'block', fontSize: '16px', color: 'var(--text)' }}>
              Tidak ada menu yang sesuai
            </strong>
            <p className="text-caption mt-1">
              Coba sesuaikan kata kunci pencarian atau reset filter kategori/status.
            </p>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT MENU */}
      {modalOpen && (
        <div className="cat-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="cat-modal-content p-6" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <span className="eyebrow">{editing ? 'PERBARUI' : 'TAMBAH'}</span>
                <h3 className="heading" style={{ fontSize: '18px', margin: 0 }}>
                  {editing ? 'Edit Menu' : 'Tambah Menu Baru'}
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <form className="form-stack mt-4" onSubmit={submit}>
              <label>
                Nama Menu
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Ayam Geprek Sambal Matah"
                  required
                />
              </label>

              <label>
                Kategori
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Harga (Rp)
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Contoh: 18000"
                  required
                />
              </label>

              <label>
                Deskripsi Singkat
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsikan menu, rasa, dan kelebihannya..."
                />
              </label>

              <div className="upload-field">
                <span>Foto Produk</span>
                <label className="upload-box">
                  <ImagePlus size={22} />
                  <strong>Pilih foto makanan</strong>
                  <small>JPG, PNG, WEBP · Maks. 3 MB</small>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={imageChange} />
                </label>
              </div>

              {preview && (
                <div className="preview-box">
                  <img src={preview} alt="Preview" />
                  <button type="button" className="preview-remove" onClick={() => { setPreview(''); setForm({ ...form, image: null }); }}>
                    <X size={15} />
                  </button>
                </div>
              )}

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Menu aktif & dapat dipesan oleh pelanggan
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfirm && (
        <div className="cat-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="cat-modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#FEE2E2',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="heading" style={{ fontSize: '18px', margin: 0 }}>
                  Hapus Menu?
                </h3>
                <span className="text-caption text-muted">
                  Menu: <strong>{deleteConfirm.name}</strong>
                </span>
              </div>
            </div>

            <p className="text-body mb-5" style={{ color: 'var(--text-muted)' }}>
              Apakah Anda yakin ingin menghapus <strong>"{deleteConfirm.name}"</strong>? Jika menu ini pernah dipesan, sistem akan menonaktifkannya secara aman tanpa merusak riwayat transaksi.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusActive({
  active
}) {
  return (
    <span
      className={
        `active-pill ${
          active
            ? 'yes'
            : 'no'
        }`
      }
    >
      {
        active
          ? 'Aktif'
          : 'Nonaktif'
      }
    </span>
  );
}

/* =========================================================
   CASHIER ORDERS
========================================================= */


function CashierOrders({
  api,
  show
}) {

  const [
    orders,
    setOrders
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);


  const calculateOrderTotal =
    (order) => {

      const storedTotal =
        Number(
          order?.total || 0
        );

      if (
        storedTotal > 0
      ) {
        return storedTotal;
      }


      return (
        order?.order_items || []
      ).reduce(
        (
          sum,
          item
        ) =>
          sum +
          (
            Number(
              item.unit_price ||
              0
            ) *
            Number(
              item.quantity ||
              0
            )
          ),

        0
      );
    };


  const load =
    async () => {

      try {

        const data =
          await api(
            '/cashier/orders'
          );

        setOrders(
          data || []
        );

      } catch(error) {

        show(
          error.message,
          'error'
        );

      } finally {

        setLoading(
          false
        );

      }
    };


  useEffect(() => {

    load();

    const timer =
      setInterval(
        load,
        5000
      );

    return () =>
      clearInterval(
        timer
      );

  }, []);


  const updateStatus =
    async (
      order,
      status
    ) => {

      try {

        await api(
          `/cashier/orders/${order.id}/status`,
          {
            method:
              'PATCH',

            body:
              JSON.stringify({
                status
              })
          }
        );


        show(
          `${order.order_code} berhasil diubah menjadi ${labels[status]}.`
        );


        await load();

      } catch(error) {

        show(
          error.message,
          'error'
        );

      }
    };


  const cancelOrder =
    async (
      order
    ) => {

      const yakin =
        window.confirm(
          `Tolak pesanan ${order.order_code}?`
        );

      if (!yakin) {
        return;
      }

      await updateStatus(
        order,
        'cancelled'
      );
    };


  const completeOrder =
    async (
      order
    ) => {

      try {

        await api(
          `/cashier/orders/${order.id}/status`,
          {
            method:
              'PATCH',

            body:
              JSON.stringify({
                status:
                  'completed'
              })
          }
        );


        show(
          `Pesanan ${order.order_code} berhasil diselesaikan dan pembayaran dinyatakan lunas.`
        );


        await load();

      } catch(error) {

        show(
          error.message,
          'error'
        );

      }

    };


  if (
    loading
  ) {

    return (
      <div className="flex flex-col p-6 gap-6">

        <PageHeader
          eyebrow="ORDER MANAGEMENT"
          title="Kelola Pesanan"
          description="Terima, proses, dan selesaikan pesanan pelanggan."
        />

        <div className="card">
          Memuat pesanan...
        </div>

      </div>
    );
  }


  const pendingCount =
    orders.filter(
      (o) =>
        o.status ===
        'pending'
    ).length;


  const processingCount =
    orders.filter(
      (o) =>
        [
          'confirmed',
          'preparing'
        ].includes(
          o.status
        )
    ).length;


  const readyCount =
    orders.filter(
      (o) =>
        o.status ===
        'ready'
    ).length;


  const completedCount =
    orders.filter(
      (o) =>
        o.status ===
        'completed'
    ).length;


  return (
    <div className="flex flex-col p-6 gap-6">

      <PageHeader
        eyebrow="ORDER MANAGEMENT"
        title="Kelola Pesanan"
        description="Terima, siapkan, dan selesaikan pesanan pelanggan."
      />


      <div className="order-filter-summary">

        <div className="order-filter-card">

          <span>
            Menunggu
          </span>

          <strong>
            {pendingCount}
          </strong>

        </div>


        <div className="order-filter-card">

          <span>
            Diproses
          </span>

          <strong>
            {processingCount}
          </strong>

        </div>


        <div className="order-filter-card">

          <span>
            Siap Diambil
          </span>

          <strong>
            {readyCount}
          </strong>

        </div>


        <div className="order-filter-card">

          <span>
            Selesai
          </span>

          <strong>
            {completedCount}
          </strong>

        </div>

      </div>


      {orders.length === 0 ? (

        <Empty
          title="Belum ada pesanan"
          text="Pesanan pelanggan akan muncul di sini."
          icon={
            <ReceiptText
              size={28}
            />
          }
        />

      ) : (

        <div className="order-board">

          {orders.map(
            (order) => {

              const total =
                calculateOrderTotal(
                  order
                );


              const paymentStatus =
                order.status ===
                'completed'
                  ? 'paid'
                  : 'pending';


              return (

                <article
                  className="cashier-order"
                  key={
                    order.id
                  }
                >

                  <div className="cashier-order-head">

                    <div>

                      <span className="eyebrow">
                        {
                          order.order_code
                        }
                      </span>

                      <h3>
                        {
                          order.customer_name ||
                          'Pelanggan'
                        }
                      </h3>

                      <small>
                        {
                          fmtDate(
                            order.ordered_at
                          )
                        }
                      </small>

                    </div>


                    <Status
                      status={
                        order.status
                      }
                    />

                  </div>


                  <div className="order-items">

                    {(
                      order.order_items ||
                      []
                    ).map(
                      (item) => {

                        const isAyamGeprek =
                          item.menu
                            ?.categories
                            ?.name ===
                          'Ayam Geprek';


                        const itemTotal =
                          Number(
                            item.unit_price ||
                            0
                          ) *
                          Number(
                            item.quantity ||
                            0
                          );


                        return (

                          <div
                            className="cashier-order-item"
                            key={
                              item.id
                            }
                          >

                            <div>

                              <strong>
                                {
                                  item.menu?.name ||
                                  'Menu'
                                }

                                {' × '}

                                {
                                  item.quantity
                                }
                              </strong>


                              {isAyamGeprek && (
                                <small>
                                  Level Sambal:{' '}
                                  {
                                    spiceLabel(
                                      item.spice_level
                                    )
                                  }
                                </small>
                              )}

                              {item.notes && (
                                <small style={{ color: 'var(--accent)', display: 'block', marginTop: '2px' }}>
                                  {item.notes}
                                </small>
                              )}

                            </div>


                            <b>
                              {
                                money(
                                  itemTotal
                                )
                              }
                            </b>

                          </div>

                        );
                      }
                    )}

                  </div>


                  {order.order_notes && (

                    <div className="cashier-order-note">

                      <strong>
                        Catatan Pesanan
                      </strong>

                      <span>
                        {
                          order.order_notes
                        }
                      </span>

                    </div>

                  )}


                  {order.address && (

                    <div className="address-line">

                      <MapPin
                        size={13}
                      />

                      <span>
                        {
                          order.address
                        }
                      </span>

                    </div>

                  )}


                  <div className="cashier-payment-info">

                    <div>

                      <span>
                        Metode Pembayaran
                      </span>

                      <strong>
                        {
                          (
                            order.payment_method ||
                            '-'
                          ).toUpperCase()
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Status Pembayaran
                      </span>

                      <strong
                        className={
                          paymentStatus ===
                          'paid'
                            ? 'payment-paid'
                            : 'payment-pending'
                        }
                      >
                        {
                          paymentStatus ===
                          'paid'
                            ? 'LUNAS'
                            : 'MENUNGGU'
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Total
                      </span>

                      <strong>
                        {
                          money(
                            total
                          )
                        }
                      </strong>

                    </div>

                  </div>


                  <div className="cashier-actions">

                    {order.status ===
                      'pending' && (

                      <>

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() =>
                            updateStatus(
                              order,
                              'confirmed'
                            )
                          }
                        >

                          <Check
                            size={14}
                          />

                          Terima Pesanan

                        </button>


                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() =>
                            cancelOrder(
                              order
                            )
                          }
                        >

                          Tolak

                        </button>

                      </>
                    )}


                    {order.status ===
                      'confirmed' && (

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          updateStatus(
                            order,
                            'preparing'
                          )
                        }
                      >

                        <Utensils
                          size={14}
                        />

                        Mulai Siapkan

                      </button>
                    )}


                    {order.status ===
                      'preparing' && (

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          updateStatus(
                            order,
                            'ready'
                          )
                        }
                      >

                        <Package
                          size={14}
                        />

                        Siap Diambil

                      </button>
                    )}


                    {order.status ===
                      'ready' && (

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          completeOrder(
                            order
                          )
                        }
                      >

                        <CheckCircle2
                          size={14}
                        />

                        Selesaikan & Lunas

                      </button>
                    )}


                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        printReceipt(
                          order
                        )
                      }
                    >

                      <Printer
                        size={14}
                      />

                      Struk

                    </button>

                  </div>

                </article>

              );

            }
          )}

        </div>

      )}

      {!orders.length && (
        <Empty
          title="Belum ada pesanan"
          text="Pesanan pelanggan akan muncul di halaman ini."
          icon={<ReceiptText />}
        />
      )}
    </div>
  );
}

function ManualOrder({
  api,
  show
}) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [salesChannel, setSalesChannel] = useState('offline');
  const [method, setMethod] = useState('cash');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/cashier/menu')
      .then((data) => setMenu(data || []))
      .catch((e) => show(e.message, 'error'));
  }, []);

  const add = (item, delta) => {
    setCart((current) => {
      const existing =
        current[item.id] || {
          quantity: 0,
          spiceLevel: 'sedang'
        };

      const quantity = Math.max(
        0,
        Number(existing.quantity || 0) +
          delta
      );

      const next = {
        ...current
      };

      if (!quantity) {
        delete next[item.id];
      } else {
        next[item.id] = {
          ...existing,
          quantity
        };
      }

      return next;
    });
  };

  const updateSpice = (
    id,
    value
  ) => {
    setCart((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {
          quantity: 1
        }),
        spiceLevel: value
      }
    }));
  };

  const entries =
    Object.entries(cart)
      .map(([id, item]) => ({
        m: menu.find(
          (x) => x.id === Number(id)
        ),
        q: Number(
          item?.quantity || 0
        ),
        spiceLevel:
          item?.spiceLevel || 'sedang'
      }))
      .filter(
        (x) => x.m && x.q > 0
      );

  const total = entries.reduce(
    (sum, item) =>
      sum +
      Number(item.m.price) *
        item.q,
    0
  );

  const save = async () => {
    if (!entries.length) {
      show(
        'Tambahkan minimal satu menu.',
        'error'
      );
      return;
    }

    setSaving(true);

    try {
      const result = await api(
        '/cashier/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            customerName:
              name ||
              'Pelanggan Offline',
            customerPhone:
              phone || null,
            orderNotes:
              orderNotes.trim() || null,
            salesChannel,
            paymentMethod: method,
            paymentStatus: 'paid',
            items: entries.map((item) => {
              const isAyamGeprek =
                item.m.categories?.name ===
                'Ayam Geprek';

              return {
                menuId: item.m.id,
                quantity: item.q,
                spiceLevel:
                  isAyamGeprek
                    ? item.spiceLevel
                    : 'sedang'
              };
            })
          })
        }
      );

      show(
        `Transaksi ${result.order_code} berhasil disimpan.`
      );

      setCart({});
      setName('');
      setPhone('');
      setOrderNotes('');
      setSalesChannel('offline');
      setMethod('cash');
    } catch (error) {
      show(
        error.message,
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col p-6 gap-6">
      <PageHeader
        eyebrow="OFFLINE TRANSACTION"
        title="Input Manual Kasir"
        description="Input pesanan langsung seperti transaksi kasir offline."
      />

      <div className="manual-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <span className="eyebrow">
                QUICK MENU
              </span>
              <h3>Pilih Menu</h3>
            </div>
          </div>

          <div className="manual-menu">
            {menu
              .filter((m) => m.is_active)
              .map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className="manual-card"
                  onClick={() =>
                    add(m, 1)
                  }
                >
                  <div>
                    {m.image_url ? (
                      <img
                        src={m.image_url}
                        alt={m.name}
                      />
                    ) : (
                      '🍗'
                    )}
                  </div>
                  <b>{m.name}</b>
                  <span>
                    {money(m.price)}
                  </span>
                </button>
              ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <span className="eyebrow">
                MANUAL ORDER
              </span>
              <h3>Ringkasan Pesanan</h3>
            </div>
          </div>

          <div className="form-stack">
            <label>
              Nama Pelanggan
              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Pelanggan Offline"
              />
            </label>

            <label>
              Telepon
              <input
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
                placeholder="08xxxxxxxxxx"
              />
            </label>

            <div className="manual-items">
              {entries.map((item) => {
                const isAyamGeprek =
                  item.m.categories?.name ===
                  'Ayam Geprek';

                return (
                  <div
                    className="manual-item"
                    key={item.m.id}
                  >
                    <div className="manual-item-main">
                      <b>{item.m.name}</b>
                      <small>
                        {money(item.m.price)}
                      </small>
                    </div>

                    <div className="manual-options">
                      {isAyamGeprek && (
                        <label>
                          Level
                          <select
                            value={
                              item.spiceLevel
                            }
                            onChange={(e) =>
                              updateSpice(
                                item.m.id,
                                e.target.value
                              )
                            }
                          >
                            <option value="tidak_pedas">
                              Tidak Pedas
                            </option>
                            <option value="sedang">
                              Sedang
                            </option>
                            <option value="pedas">
                              Pedas
                            </option>
                            <option value="extra_pedas">
                              Extra Pedas
                            </option>
                          </select>
                        </label>
                      )}
                    </div>

                    <div className="qty">
                      <button
                        type="button"
                        onClick={() =>
                          add(item.m, -1)
                        }
                      >
                        <Minus size={12} />
                      </button>

                      <b>{item.q}</b>

                      <button
                        type="button"
                        onClick={() =>
                          add(item.m, 1)
                        }
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {!entries.length && (
                <Empty
                  title="Belum ada item"
                  text="Klik menu untuk menambahkan pesanan."
                  icon={<ShoppingBag />}
                />
              )}
            </div>

            <div className="order-note-field">
              <label>Catatan Pesanan</label>
              <textarea
                rows="3"
                value={orderNotes}
                onChange={(e) =>
                  setOrderNotes(
                    e.target.value
                  )
                }
                placeholder="Contoh: sambal dipisah, nasi sedikit, jangan pakai timun..."
                maxLength={300}
              />
              <small>
                Catatan berlaku untuk seluruh pesanan.
              </small>
            </div>

            <div>
              <span className="form-caption">
                Sumber Penjualan
              </span>

              <div className="payment-grid">
                <button
                  type="button"
                  className={
                    salesChannel === 'offline'
                      ? 'selected'
                      : ''
                  }
                  onClick={() =>
                    setSalesChannel('offline')
                  }
                >
                  OFFLINE
                </button>

                <button
                  type="button"
                  className={
                    salesChannel === 'shopeefood'
                      ? 'selected'
                      : ''
                  }
                  onClick={() =>
                    setSalesChannel('shopeefood')
                  }
                >
                  SHOPEEFOOD
                </button>
              </div>
            </div>

            <div>
              <span className="form-caption">
                Metode Pembayaran
              </span>

              <div className="payment-grid">
                {[
                  'cash',
                  'qris',
                  'transfer'
                ].map((paymentMethod) => (
                  <button
                    type="button"
                    key={paymentMethod}
                    className={
                      method === paymentMethod
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      setMethod(paymentMethod)
                    }
                  >
                    {paymentMethod.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="summary-box">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>

            <button
              type="button"
              className="btn btn-primary full"
              onClick={save}
              disabled={saving}
            >
              {saving
                ? 'Menyimpan...'
                : 'Simpan Transaksi Manual'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function OrderMiniTable({
  orders
}) {
  const calculateOrderTotal = (order) => {
    const storedTotal = Number(order?.total || 0);

    if (storedTotal > 0) {
      return storedTotal;
    }

    return (order?.order_items || []).reduce(
      (sum, item) =>
        sum +
        Number(item?.unit_price || 0) *
        Number(item?.quantity || 0),
      0
    );
  };

  return (
    <div className="table-scroll">
      <table className="finance-table">
        <thead>
          <tr>
            <th>KODE</th>
            <th>PELANGGAN</th>
            <th>STATUS</th>
            <th>TOTAL</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>

              <td>
                <strong>
                  {order.order_code}
                </strong>
              </td>

              <td>
                {order.customer_name || 'Pelanggan'}
              </td>

              <td>
                <Status
                  status={order.status}
                />
              </td>

              <td>
                <strong>
                  {money(
                    calculateOrderTotal(order)
                  )}
                </strong>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({
  title,
  text,
  icon,
  action
}) {
  return (
    <div className="empty">

      <div>
        {icon}
      </div>

      <b>
        {title}
      </b>

      <span>
        {text}
      </span>

      {action}

    </div>
  );
}

/* =========================================================
   CART STORAGE
========================================================= */

function spiceLabel(level) {
  const labels = {
    tidak_pedas: 'Tidak Pedas',
    sedang: 'Sedang',
    pedas: 'Pedas',
    extra_pedas: 'Extra Pedas'
  };

  return labels[level] ||
    'Sedang';
}

function normalizeCart(raw) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const normalized = {};

  Object.entries(raw).forEach(([id, value]) => {
    if (typeof value === 'number') {
      // Legacy: just a quantity number
      normalized[id] = {
        quantity:   Math.max(0, Number(value)),
        spiceLevel: 'sedang',
        toppings:   [],
        sideMenu:   null,
        notes:      '',
        totalPrice: 0,
      };
      return;
    }

    normalized[id] = {
      quantity:   Math.max(0, Number(value?.quantity || 0)),
      spiceLevel: value?.spiceLevel || 'sedang',
      toppings:   Array.isArray(value?.toppings) ? value.toppings : [],
      sideMenu:   value?.sideMenu || null,
      notes:      value?.notes || '',
      totalPrice: Number(value?.totalPrice || 0),
    };
  });

  return normalized;
}


function readCart() {
  try {
    return JSON.parse(
      localStorage.getItem(
        'p1_cart'
      ) || '{}'
    );
  } catch {
    return {};
  }
}

function loadCart() {
  return readCart();
}

function saveCart(cart) {
  localStorage.setItem(
    'p1_cart',
    JSON.stringify(
      cart
    )
  );
}

/* =========================================================
   RECEIPT
========================================================= */

function printReceipt(order) {

  const rows =
    (
      order.order_items ||
      []
    )
      .map(
        (i) => `
          <div class="r">
            <span>
              ${esc(
                i.menu?.name ||
                'Menu'
              )}
              x${i.quantity}
            </span>
            <b>
              ${money(
                Number(
                  i.unit_price
                ) *
                  i.quantity
              )}
            </b>
          </div>
        `
      )
      .join('');

  const w =
    window.open(
      '',
      '_blank',
      'width=420,height=700'
    );

  if (!w) {
    alert(
      'Izinkan pop-up browser untuk mencetak struk.'
    );
    return;
  }

  w.document.write(
    `
      <!doctype html>

      <html>

      <head>

        <title>
          ${esc(
            order.order_code ||
            'Struk'
          )}
        </title>

        <style>

          @page {
            size: 80mm auto;
            margin: 0;
          }

          body {
            width: 80mm;
            margin: 0;
            padding: 4mm;
            font: 11px Arial;
            color: #000;
          }

          .c {
            text-align: center;
          }

          .store {
            font-size: 17px;
            font-weight: 800;
          }

          .line {
            border-top:
              1px dashed #000;
            margin: 8px 0;
          }

          .r {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 5px 0;
          }

          .total {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 800;
          }

          .meta {
            font-size: 10px;
            line-height: 1.55;
          }

        </style>

      </head>

      <body>

        <div class="c">

          <div class="store">
            AYAM GEPREK DAPOER SARI
          </div>

          <div>
            Ayam Geprek & Order Center
          </div>

        </div>

        <div class="line"></div>

        <div class="meta">

          Kode:
          ${esc(
            order.order_code ||
            ''
          )}

          <br/>

          Pelanggan:
          ${esc(
            order.customer_name ||
            'Umum'
          )}

          <br/>

          Waktu:
          ${esc(
            fmtDate(
              order.ordered_at
            )
          )}

          <br/>

          Pembayaran:
          ${esc(
            (
              order.payment_method ||
              ''
            ).toUpperCase()
          )}

        </div>

        <div class="line"></div>

        ${rows}

        <div class="line"></div>

        <div class="total">

          <span>
            TOTAL
          </span>

          <span>
            ${money(
              order.total
            )}
          </span>

        </div>

        <div class="line"></div>

        <div class="c">
          Terima kasih telah berbelanja.
        </div>

      </body>

      </html>
    `
  );

  w.document.close();
  w.focus();

  setTimeout(
    () => {
      w.print();
      w.close();
    },
    300
  );
}

function esc(x) {
  return String(
    x || ''
  )
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );
}

export default App;