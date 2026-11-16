
/**
 * VariationModal.jsx
 * Fitur pilihan variasi menu untuk Ayam Geprek Dapoer Sari
 * - Bottom sheet di mobile, modal 2-kolom di desktop
 * - Sticky footer dengan CTA selalu di bagian kanan bawah
 * - Konten variasi dapat di-scroll terpisah dari footer
 * - Mengambil kelompok variasi dinamis jika tersedia, atau fallback ke default
 */

import React, { useState, useEffect } from 'react';
import { Check, X, ChevronLeft, Minus, Plus, ShoppingBag } from 'lucide-react';

/* =========================================================
   FALLBACK / DEFAULT VARIATIONS
========================================================= */

export const DEFAULT_VARIATION_GROUPS = [
  {
    id: 'spice_level',
    name: 'Level Pedas',
    description: 'Pedasnya mau seberapa? 🌶',
    type: 'single',
    required: true,
    status: 'active',
    sortOrder: 1,
    options: [
      { id: 'tidak_pedas', name: 'Tidak Pedas', icon: '🌿', price: 0, desc: 'Tanpa sambal pedas', status: 'active', sortOrder: 1 },
      { id: 'sedang',      name: 'Sedang',      icon: '🔥', price: 0, desc: 'Sedikit pedas, cocok semua', status: 'active', sortOrder: 2 },
      { id: 'pedas',       name: 'Pedas',       icon: '🔥🔥', price: 1000, desc: 'Pedas nampol!', status: 'active', sortOrder: 3 },
      { id: 'extra_pedas', name: 'Extra Pedas', icon: '🔥🔥🔥', price: 2000, desc: 'Berani pedas banget?', status: 'active', sortOrder: 4 },
    ]
  },
  {
    id: 'toppings',
    name: 'Pilih Topping',
    description: 'Tambah topping favoritmu!',
    type: 'multiple',
    required: false,
    status: 'active',
    sortOrder: 2,
    options: [
      { id: 'cheese',      name: 'Keju',         icon: '🧀', price: 4000, desc: '', status: 'active', sortOrder: 1 },
      { id: 'mayonnaise',  name: 'Mayonaise',    icon: '🥛', price: 3000, desc: '', status: 'active', sortOrder: 2 },
      { id: 'hot_lava',    name: 'Hot Lava',     icon: '🌋', price: 5000, desc: '', status: 'active', sortOrder: 3 },
      { id: 'sambal_matah',name: 'Sambal Matah', icon: '🌶', price: 3000, desc: '', status: 'active', sortOrder: 4 },
    ]
  },
  {
    id: 'side_menus',
    name: 'Menu Pendamping / Minuman',
    description: 'Mau sekalian minum?',
    type: 'single',
    required: false,
    status: 'active',
    sortOrder: 3,
    options: [
      { id: 'iced_tea',   name: 'Es Teh Manis', icon: '🧋', price: 5000, desc: '', status: 'active', sortOrder: 1 },
      { id: 'orange_ice', name: 'Es Jeruk',     icon: '🍊', price: 6000, desc: '', status: 'active', sortOrder: 2 },
      { id: 'lemon_tea',  name: 'Lemon Tea',    icon: '🍋', price: 6000, desc: '', status: 'active', sortOrder: 3 },
      { id: 'milo',       name: 'Milo',         icon: '🥛', price: 8000, desc: '', status: 'active', sortOrder: 4 },
    ]
  }
];

export const SPICE_LEVELS = DEFAULT_VARIATION_GROUPS[0].options;
export const TOPPINGS = DEFAULT_VARIATION_GROUPS[1].options;
export const SIDE_MENUS = [
  { id: 'none', name: 'Tidak perlu', icon: '🚫', price: 0 },
  ...DEFAULT_VARIATION_GROUPS[2].options
];

/* =========================================================
   UTILITAS
========================================================= */

const money = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n || 0));

/**
 * Hitung total harga 1 item beserta variasinya
 */
export function calcItemTotal({ basePrice, spiceLevel, toppings, sideMenu, quantity, selectedOptions = [] }) {
  let addOnPrice = 0;

  if (selectedOptions && selectedOptions.length > 0) {
    addOnPrice = selectedOptions.reduce((acc, opt) => acc + Number(opt.price || 0), 0);
  } else {
    // Fallback standard calculation
    const spice = SPICE_LEVELS.find(s => s.id === spiceLevel);
    const spicePrice = spice?.price ?? 0;
    const toppingPrice = (toppings || []).reduce((s, t) => s + Number(t.price || 0), 0);
    const sidePrice = sideMenu?.price ?? 0;
    addOnPrice = spicePrice + toppingPrice + sidePrice;
  }

  const perItem = Number(basePrice || 0) + addOnPrice;
  return perItem * Number(quantity || 1);
}

/* =========================================================
   DYNAMIC GROUP SELECTOR
========================================================= */

function GroupSelector({ group, selectedValues, onChange }) {
  const isMultiple = group.type === 'multiple';

  const handleClick = (opt) => {
    if (isMultiple) {
      const exists = selectedValues.some(x => x.id === opt.id);
      if (exists) {
        onChange(selectedValues.filter(x => x.id !== opt.id));
      } else {
        onChange([...selectedValues, { id: opt.id, name: opt.name, price: opt.price, icon: opt.icon }]);
      }
    } else {
      const isCurrentlySelected = selectedValues.some(x => x.id === opt.id);
      if (isCurrentlySelected) {
        if (!group.required) {
          onChange([]);
        }
      } else {
        onChange([{ id: opt.id, name: opt.name, price: opt.price, icon: opt.icon }]);
      }
    }
  };

  return (
    <div className="variation-section">
      <div className="variation-section-header">
        <span className="variation-section-title">{group.name}</span>
        {group.required ? (
          <span className="variation-required-badge">Wajib</span>
        ) : (
          <span className="variation-optional-badge">Opsional</span>
        )}
      </div>
      {group.description && (
        <p className="variation-section-sub">{group.description}</p>
      )}
      <div className="spice-grid">
        {(group.options || []).filter(o => o.status !== 'inactive').map((opt) => {
          const isSelected = selectedValues.some(x => x.id === opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              className={`variation-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleClick(opt)}
            >
              {isSelected && <span className="var-check"><Check size={12} /></span>}
              {opt.icon && <span className="var-icon">{opt.icon}</span>}
              <span className="var-name">{opt.name}</span>
              {Number(opt.price) > 0 ? (
                <span className="var-price">+{money(opt.price)}</span>
              ) : (
                <span className="var-price free">Gratis</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   QUANTITY CONTROL
========================================================= */

function QuantityControl({ value, onChange, min = 1, max = 99 }) {
  return (
    <div className="variation-section">
      <div className="variation-section-header">
        <span className="variation-section-title">Jumlah Pesanan</span>
      </div>
      <div className="qty-control-row">
        <button
          type="button"
          className="qty-btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Kurangi"
        >
          <Minus size={16} />
        </button>
        <span className="qty-value">{value}</span>
        <button
          type="button"
          className="qty-btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Tambah"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PRICE SUMMARY
========================================================= */

function PriceSummary({ product, selectionsByGroup, quantity, groups }) {
  let addOnsTotal = 0;
  const breakdown = [];

  groups.forEach((g) => {
    const sel = selectionsByGroup[g.id] || [];
    sel.forEach((item) => {
      const p = Number(item.price || 0);
      addOnsTotal += p;
      if (p > 0) {
        breakdown.push({ name: `${g.name}: ${item.name}`, price: p });
      }
    });
  });

  const perItem = Number(product.price || 0) + addOnsTotal;
  const total = perItem * quantity;

  return (
    <div className="price-summary">
      <div className="price-row">
        <span>Harga dasar</span>
        <span>{money(product.price)}</span>
      </div>
      {breakdown.map((item, idx) => (
        <div className="price-row" key={idx}>
          <span>{item.name}</span>
          <span>+{money(item.price)}</span>
        </div>
      ))}
      {quantity > 1 && (
        <div className="price-row muted">
          <span>Harga satuan</span>
          <span>{money(perItem)}</span>
        </div>
      )}
      <div className="price-divider" />
      <div className="price-total-row">
        <span>Total {quantity > 1 ? `(${quantity}x)` : ''}</span>
        <strong>{money(total)}</strong>
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOMIZATION SUMMARY (shown in cart & checkout)
========================================================= */

export function CustomizationSummary({ spiceLevel, toppings, sideMenu, notes }) {
  const items = [];

  if (spiceLevel) {
    const sName = typeof spiceLevel === 'string'
      ? (SPICE_LEVELS.find(s => s.id === spiceLevel)?.name || spiceLevel)
      : (spiceLevel.name || spiceLevel.id);
    items.push({ icon: '🌶', label: `Level: ${sName}` });
  }

  if (toppings && toppings.length > 0) {
    const topNames = toppings.map(t => typeof t === 'string' ? t : t.name).join(', ');
    items.push({ icon: '🧀', label: `Topping: ${topNames}` });
  }

  if (sideMenu && sideMenu.id !== 'none') {
    const sName = typeof sideMenu === 'string' ? sideMenu : (sideMenu.name || sideMenu.id);
    items.push({ icon: '🥤', label: `Minuman: ${sName}` });
  }

  if (notes && notes.trim()) {
    items.push({ icon: '📝', label: notes.trim() });
  }

  if (!items.length) return null;

  return (
    <div className="custom-summary">
      {items.map((item, i) => (
        <div key={i} className="custom-summary-row">
          <span className="custom-summary-icon">{item.icon}</span>
          <span className="custom-summary-text">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   VARIATION MODAL COMPONENT
========================================================= */

export function VariationModal({
  product,
  initial,
  onConfirm,
  onClose,
  isEdit = false,
  api
}) {
  const [groups, setGroups] = useState(DEFAULT_VARIATION_GROUPS);
  const [selections, setSelections] = useState({});
  const [notes, setNotes] = useState(initial?.notes || '');
  const [quantity, setQuantity] = useState(initial?.quantity || 1);
  const [error, setError] = useState('');

  // Fetch live groups if api is provided
  useEffect(() => {
    let isMounted = true;
    if (typeof api === 'function') {
      api('/variations')
        .then((data) => {
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setGroups(data);
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [api]);

  // Initialize selections from initial props
  useEffect(() => {
    const initialMap = {};
    const spice = initial?.spiceLevel || 'sedang';
    const foundSpice = SPICE_LEVELS.find(s => s.id === spice) || { id: spice, name: spice, price: 0 };
    initialMap['spice_level'] = [foundSpice];

    if (Array.isArray(initial?.toppings)) {
      initialMap['toppings'] = initial.toppings;
    } else {
      initialMap['toppings'] = [];
    }

    if (initial?.sideMenu && initial.sideMenu.id !== 'none') {
      initialMap['side_menus'] = [initial.sideMenu];
    } else {
      initialMap['side_menus'] = [];
    }

    setSelections(initialMap);
  }, [initial]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Compute total
  let addOnsTotal = 0;
  groups.forEach((g) => {
    const sel = selections[g.id] || [];
    sel.forEach((item) => {
      addOnsTotal += Number(item.price || 0);
    });
  });
  const total = (Number(product?.price || 0) + addOnsTotal) * Number(quantity || 1);

  const handleConfirm = () => {
    // Validate required groups
    for (const g of groups) {
      if (g.required) {
        const sel = selections[g.id] || [];
        if (sel.length === 0) {
          setError(`Silakan pilih salah satu opsi pada ${g.name}.`);
          return;
        }
      }
    }

    setError('');

    // Extract compatibility fields
    const spiceItem = (selections['spice_level'] || [])[0];
    const spiceLevel = spiceItem ? spiceItem.id : 'sedang';
    const toppings = selections['toppings'] || [];
    const sideItem = (selections['side_menus'] || [])[0] || null;

    // Collect all selected options
    const allSelected = [];
    groups.forEach(g => {
      const sel = selections[g.id] || [];
      sel.forEach(o => allSelected.push({ ...o, groupName: g.name }));
    });

    onConfirm({
      productId: product.id,
      productName: product.name,
      basePrice: Number(product.price),
      spiceLevel,
      toppings,
      sideMenu: sideItem,
      selectedOptions: allSelected,
      notes: notes.trim(),
      quantity,
      totalPrice: total,
    });
  };

  return (
    <div className="var-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="var-panel">
        {/* Header */}
        <div className="var-panel-header">
          <button className="var-back-btn" onClick={onClose} type="button" aria-label="Kembali">
            <ChevronLeft size={20} />
          </button>
          <span className="var-panel-title">{isEdit ? 'Edit Variasi Menu' : 'Pilihan Variasi Menu'}</span>
          <button className="var-close-btn" onClick={onClose} type="button" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="var-form-scroll">
          {/* Left / Top Product Preview */}
          <div className="var-product-header">
            <div className="var-product-img">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                <span style={{ fontSize: '48px' }}>🍗</span>
              )}
            </div>
            <div className="var-product-info">
              {product.is_best_seller && (
                <span className="var-badge-bestseller">Best Seller</span>
              )}
              <h3 className="heading" style={{ fontSize: '18px', marginTop: '6px' }}>{product.name}</h3>
              {product.description && (
                <p className="text-body text-muted" style={{ marginTop: '4px', fontSize: '13px' }}>
                  {product.description}
                </p>
              )}
              <strong className="text-price" style={{ fontSize: '18px', marginTop: '8px', display: 'block' }}>
                {money(product.price)}
              </strong>
            </div>
          </div>

          {/* Right / Main Option Selectors */}
          <div className="var-form-inner">
            {groups.map((group) => (
              <GroupSelector
                key={group.id}
                group={group}
                selectedValues={selections[group.id] || []}
                onChange={(newVals) => {
                  setSelections(prev => ({ ...prev, [group.id]: newVals }));
                  setError('');
                }}
              />
            ))}

            {/* Order Notes */}
            <div className="variation-section">
              <div className="variation-section-header">
                <span className="variation-section-title">Catatan Khusus</span>
                <span className="variation-optional-badge">Opsional</span>
              </div>
              <textarea
                className="var-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: sambal dipisah, nasi sedikit, tanpa sayur..."
                maxLength={200}
              />
            </div>

            {/* Quantity */}
            <QuantityControl value={quantity} onChange={setQuantity} />

            {/* Price Summary Breakdown */}
            <PriceSummary
              product={product}
              selectionsByGroup={selections}
              quantity={quantity}
              groups={groups}
            />

            {/* Validation error */}
            {error && (
              <div className="var-error">{error}</div>
            )}
          </div>
        </div>

        {/* Footer Bar: Fixed at bottom right */}
        <div className="var-panel-footer">
          <div className="var-footer-summary">
            <span className="var-footer-label">Total Pesanan ({quantity}x)</span>
            <strong className="var-footer-price">{money(total)}</strong>
          </div>
          <button className="var-add-btn" type="button" onClick={handleConfirm}>
            <ShoppingBag size={18} />
            <span>{isEdit ? 'Simpan Perubahan' : 'Tambah Pesanan'}</span>
            <strong>{money(total)}</strong>
          </button>
        </div>
      </div>
    </div>
  );
}
