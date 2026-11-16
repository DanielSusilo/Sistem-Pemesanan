import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X,
  Layers,
  Sparkles,
  Check,
  Utensils
} from 'lucide-react';

const money = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(n || 0));

export function CashierVariations({ api, show }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Group modal state
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    type: 'single',
    required: false,
    status: 'active',
    sortOrder: 1
  });

  // Option modal state
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [optionForm, setOptionForm] = useState({
    name: '',
    icon: '✨',
    price: 0,
    desc: '',
    status: 'active',
    sortOrder: 1
  });

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'group' | 'option', groupId, optId, name }

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/cashier/variations');
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* --- GROUP ACTIONS --- */
  const openAddGroup = () => {
    setEditingGroup(null);
    setGroupForm({
      name: '',
      description: '',
      type: 'single',
      required: false,
      status: 'active',
      sortOrder: groups.length + 1
    });
    setGroupModalOpen(true);
  };

  const openEditGroup = (g) => {
    setEditingGroup(g);
    setGroupForm({
      name: g.name,
      description: g.description || '',
      type: g.type || 'single',
      required: Boolean(g.required),
      status: g.status || 'active',
      sortOrder: g.sortOrder ?? 1
    });
    setGroupModalOpen(true);
  };

  const saveGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      show('Nama kelompok variasi wajib diisi.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: editingGroup ? editingGroup.id : undefined,
        name: groupForm.name.trim(),
        description: groupForm.description.trim(),
        type: groupForm.type,
        required: groupForm.required,
        status: groupForm.status,
        sortOrder: Number(groupForm.sortOrder) || 1
      };
      await api('/cashier/variations/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      show(`Kelompok "${payload.name}" berhasil disimpan.`);
      setGroupModalOpen(false);
      await load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* --- OPTION ACTIONS --- */
  const openAddOption = (groupId) => {
    setActiveGroupId(groupId);
    setEditingOption(null);
    const grp = groups.find((g) => g.id === groupId);
    const count = grp?.options?.length || 0;
    setOptionForm({
      name: '',
      icon: '✨',
      price: 0,
      desc: '',
      status: 'active',
      sortOrder: count + 1
    });
    setOptionModalOpen(true);
  };

  const openEditOption = (groupId, opt) => {
    setActiveGroupId(groupId);
    setEditingOption(opt);
    setOptionForm({
      name: opt.name,
      icon: opt.icon || '✨',
      price: opt.price || 0,
      desc: opt.desc || '',
      status: opt.status || 'active',
      sortOrder: opt.sortOrder ?? 1
    });
    setOptionModalOpen(true);
  };

  const saveOption = async (e) => {
    e.preventDefault();
    if (!optionForm.name.trim()) {
      show('Nama opsi variasi wajib diisi.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: editingOption ? editingOption.id : undefined,
        name: optionForm.name.trim(),
        icon: optionForm.icon.trim() || '✨',
        price: Number(optionForm.price) || 0,
        desc: optionForm.desc.trim(),
        status: optionForm.status,
        sortOrder: Number(optionForm.sortOrder) || 1
      };
      await api(`/cashier/variations/group/${activeGroupId}/option`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      show(`Opsi "${payload.name}" berhasil disimpan.`);
      setOptionModalOpen(false);
      await load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* --- DELETE ACTIONS --- */
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      if (deleteConfirm.type === 'group') {
        await api(`/cashier/variations/group/${deleteConfirm.groupId}`, {
          method: 'DELETE'
        });
        show(`Kelompok "${deleteConfirm.name}" berhasil dihapus.`);
      } else {
        await api(
          `/cashier/variations/group/${deleteConfirm.groupId}/option/${deleteConfirm.optId}`,
          { method: 'DELETE' }
        );
        show(`Opsi "${deleteConfirm.name}" berhasil dihapus.`);
      }
      setDeleteConfirm(null);
      await load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col p-6 gap-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-2">
        <nav className="breadcrumb-nav">
          <Link to="/kasir" className="breadcrumb-link">Dashboard</Link>
          <ChevronRight size={14} className="text-muted" />
          <Link to="/kasir/menu" className="breadcrumb-link">Kelola Menu</Link>
          <ChevronRight size={14} className="text-muted" />
          <span className="breadcrumb-current">Variasi Menu</span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
          <div className="flex items-center gap-3">
            <Link to="/kasir/menu" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
              <ArrowLeft size={16} /> Kembali ke Kelola Menu
            </Link>
            <div>
              <span className="eyebrow">PENGATURAN PRODUK</span>
              <h2 className="heading" style={{ fontSize: '24px', margin: 0 }}>
                Kelola Variasi Menu
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddGroup}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={16} /> Tambah Kelompok Variasi
          </button>
        </div>
      </div>

      <p className="text-body text-muted" style={{ marginTop: '-12px' }}>
        Atur pilihan level pedas, topping (keju, mayonaise, hot lava, sambal matah), minuman, dan menu pendamping lainnya.
      </p>

      {/* Variation Groups List */}
      <div className="flex flex-col gap-6">
        {groups.map((group) => {
          const isActive = group.status !== 'inactive';
          return (
            <div key={group.id} className="card p-5" style={{ background: '#FFFFFF', border: '1px solid var(--border)' }}>
              {/* Group Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}
                  >
                    <Layers size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong style={{ fontSize: '16px' }}>{group.name}</strong>
                      {isActive ? (
                        <span className="cat-badge-active">● Aktif</span>
                      ) : (
                        <span className="cat-badge-inactive">● Nonaktif</span>
                      )}
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: group.type === 'multiple' ? '#EFF6FF' : '#F1F5F9',
                          color: group.type === 'multiple' ? '#2563EB' : '#475569',
                          fontWeight: 600
                        }}
                      >
                        {group.type === 'multiple' ? 'Pilihan Jamak (Multi-select)' : 'Pilihan Tunggal (Single)'}
                      </span>
                      {group.required ? (
                        <span className="variation-required-badge" style={{ fontSize: '10px' }}>Wajib</span>
                      ) : (
                        <span className="variation-optional-badge" style={{ fontSize: '10px' }}>Opsional</span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-caption text-muted mt-1">{group.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => openEditGroup(group)}
                  >
                    <Pencil size={13} /> Edit Kelompok
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger)' }}
                    onClick={() => setDeleteConfirm({ type: 'group', groupId: group.id, name: group.name })}
                  >
                    <Trash2 size={13} /> Hapus
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => openAddOption(group.id)}
                  >
                    <Plus size={13} /> Tambah Opsi
                  </button>
                </div>
              </div>

              {/* Options Table */}
              <div className="table-scroll mt-3">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Icon</th>
                      <th>Nama Opsi</th>
                      <th>Harga Tambahan</th>
                      <th>Keterangan</th>
                      <th>Urutan</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(group.options || []).map((opt) => (
                      <tr key={opt.id}>
                        <td>
                          <span style={{ fontSize: '20px' }}>{opt.icon || '✨'}</span>
                        </td>
                        <td>
                          <strong>{opt.name}</strong>
                        </td>
                        <td>
                          {Number(opt.price) > 0 ? (
                            <strong style={{ color: 'var(--accent)' }}>+{money(opt.price)}</strong>
                          ) : (
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Gratis (Rp0)</span>
                          )}
                        </td>
                        <td>
                          <span className="text-caption text-muted">{opt.desc || '-'}</span>
                        </td>
                        <td>{opt.sortOrder ?? 1}</td>
                        <td>
                          {opt.status === 'inactive' ? (
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
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => openEditOption(group.id, opt)}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => setDeleteConfirm({ type: 'option', groupId: group.id, optId: opt.id, name: opt.name })}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!group.options || group.options.length === 0) && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                          Belum ada opsi pada kelompok ini. Klik tombol "Tambah Opsi".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {groups.length === 0 && !loading && (
          <div className="card p-8 text-center text-muted">
            Belum ada kelompok variasi. Klik "Tambah Kelompok Variasi" untuk memulai.
          </div>
        )}
      </div>

      {/* MODAL GROUP */}
      {groupModalOpen && (
        <div className="cat-modal-backdrop" onClick={() => setGroupModalOpen(false)}>
          <div className="cat-modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <span className="eyebrow">{editingGroup ? 'PERBARUI' : 'TAMBAH'}</span>
                <h3 className="heading" style={{ fontSize: '18px', margin: 0 }}>
                  {editingGroup ? 'Edit Kelompok Variasi' : 'Tambah Kelompok Variasi Baru'}
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setGroupModalOpen(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveGroup} className="form-stack mt-4">
              <label>
                Nama Kelompok Variasi
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="Contoh: Level Pedas, Topping, Minuman..."
                  required
                />
              </label>

              <label>
                Keterangan / Subjudul (Opsional)
                <input
                  type="text"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Contoh: Pedasnya mau seberapa? / Tambah topping favoritmu"
                />
              </label>

              <label>
                Jenis Pilihan Pelanggan
                <select
                  value={groupForm.type}
                  onChange={(e) => setGroupForm({ ...groupForm, type: e.target.value })}
                >
                  <option value="single">Pilihan Tunggal (Hanya boleh pilih 1 opsi)</option>
                  <option value="multiple">Pilihan Jamak (Boleh pilih lebih dari 1 opsi)</option>
                </select>
              </label>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={groupForm.required}
                  onChange={(e) => setGroupForm({ ...groupForm, required: e.target.checked })}
                />
                Wajib dipilih pelanggan sebelum tambah ke keranjang
              </label>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={groupForm.status === 'active'}
                  onChange={(e) => setGroupForm({ ...groupForm, status: e.target.checked ? 'active' : 'inactive' })}
                />
                Status aktif (tampil di pilihan variasi pelanggan)
              </label>

              <label>
                Urutan Tampilan
                <input
                  type="number"
                  min="1"
                  value={groupForm.sortOrder}
                  onChange={(e) => setGroupForm({ ...groupForm, sortOrder: e.target.value })}
                />
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setGroupModalOpen(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Kelompok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OPTION */}
      {optionModalOpen && (
        <div className="cat-modal-backdrop" onClick={() => setOptionModalOpen(false)}>
          <div className="cat-modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <span className="eyebrow">{editingOption ? 'PERBARUI' : 'TAMBAH'}</span>
                <h3 className="heading" style={{ fontSize: '18px', margin: 0 }}>
                  {editingOption ? 'Edit Opsi Variasi' : 'Tambah Opsi Variasi Baru'}
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setOptionModalOpen(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveOption} className="form-stack mt-4">
              <label>
                Nama Opsi
                <input
                  type="text"
                  value={optionForm.name}
                  onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                  placeholder="Contoh: Sedang, Keju, Es Teh Manis..."
                  required
                />
              </label>

              <label>
                Icon / Emoji
                <input
                  type="text"
                  value={optionForm.icon}
                  onChange={(e) => setOptionForm({ ...optionForm, icon: e.target.value })}
                  placeholder="Contoh: 🔥 / 🧀 / 🧋 / 🌿"
                  maxLength={10}
                />
              </label>

              <label>
                Harga Tambahan (Rp)
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={optionForm.price}
                  onChange={(e) => setOptionForm({ ...optionForm, price: e.target.value })}
                  placeholder="0 untuk gratis"
                />
              </label>

              <label>
                Deskripsi Singkat (Opsional)
                <input
                  type="text"
                  value={optionForm.desc}
                  onChange={(e) => setOptionForm({ ...optionForm, desc: e.target.value })}
                  placeholder="Contoh: Pedas nampol!"
                />
              </label>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={optionForm.status === 'active'}
                  onChange={(e) => setOptionForm({ ...optionForm, status: e.target.checked ? 'active' : 'inactive' })}
                />
                Status opsi aktif
              </label>

              <label>
                Urutan Opsi
                <input
                  type="number"
                  min="1"
                  value={optionForm.sortOrder}
                  onChange={(e) => setOptionForm({ ...optionForm, sortOrder: e.target.value })}
                />
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setOptionModalOpen(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Opsi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DELETE CONFIRM */}
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
                  justifyContent: 'center'
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="heading" style={{ fontSize: '18px', margin: 0 }}>
                  Hapus {deleteConfirm.type === 'group' ? 'Kelompok' : 'Opsi'}?
                </h3>
                <span className="text-caption text-muted">
                  {deleteConfirm.name}
                </span>
              </div>
            </div>

            <p className="text-body mb-5" style={{ color: 'var(--text-muted)' }}>
              Apakah Anda yakin ingin menghapus "{deleteConfirm.name}"? Tindakan ini tidak dapat dibatalkan.
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
                onClick={confirmDelete}
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

