import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import adminStyles from '../../styles/admin.module.css';
import styles from '../../styles/firm.module.css';

const ACCESS_FLAGS = [
  { key: 'leaderboard', label: 'Live Leaderboard' },
  { key: 'analytics', label: 'Performance Analytics' },
  { key: 'registrantProfiles', label: 'Registrant Profiles' },
  { key: 'finalistProfiles', label: 'Finalist Profiles' },
  { key: 'resumeDownload', label: 'Resume Download' },
  { key: 'linkedinAccess', label: 'LinkedIn Access' },
  { key: 'csvExport', label: 'CSV Export' },
  { key: 'psCoDesign', label: 'PS Co-Design (Apex)' },
  { key: 'namingRights', label: 'Naming Rights (Apex)' },
];

const TIER_LABELS = {
  derivation: 'DERIVATION',
  convergence: 'CONVERGENCE',
  apex: 'APEX',
};

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins} IST`;
}

function countEnabled(access) {
  if (!access) return 0;
  return Object.values(access).filter(Boolean).length;
}

async function getAuthHeader(currentUser) {
  const token = await currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function getTierBadgeClass(tier) {
  if (tier === 'apex') return `${styles.tierBadge} ${styles.tierApex}`;
  if (tier === 'convergence') return `${styles.tierBadge} ${styles.tierConvergence}`;
  return `${styles.tierBadge} ${styles.tierDerivation}`;
}

export default function AdminFirms() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [firms, setFirms] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [toggleLoading, setToggleLoading] = useState({});
  const [toggleMsg, setToggleMsg] = useState(null);

  // Create panel state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    firmName: '',
    email: '',
    password: '',
    tier: 'derivation',
    notes: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createMsg, setCreateMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setChecking(false);
      } else {
        router.replace('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadFirms = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/admin/get-firms', { method: 'POST', headers, body: JSON.stringify({}) });
      const data = await res.json();
      setFirms(data.firms || []);
    } catch (err) {
      console.error('[AdminFirms] loadFirms error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadFirms();
  }, [user, loadFirms]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'admin' }),
      });
    } catch {
      // Proceed with client-side logout even if server call fails
    }
    await signOut(auth);
    router.push('/admin/login');
  }

  async function handleToggleAccess(flag, value) {
    if (!selectedFirm) return;
    setToggleMsg(null);
    setToggleLoading((prev) => ({ ...prev, [flag]: true }));

    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/admin/update-firm-access', {
        method: 'POST',
        headers,
        body: JSON.stringify({ uid: selectedFirm.id, flag, value }),
      });
      const data = await res.json();

      if (data.success) {
        const updated = { ...selectedFirm, access: { ...selectedFirm.access, [flag]: value } };
        setSelectedFirm(updated);
        setFirms((prev) =>
          prev.map((f) => (f.id === selectedFirm.id ? { ...f, access: { ...f.access, [flag]: value } } : f))
        );
        setToggleMsg({ type: 'success', text: `${flag} → ${value ? 'ENABLED' : 'DISABLED'}` });
      } else {
        setToggleMsg({ type: 'error', text: data.error || 'Update failed.' });
      }
    } catch {
      setToggleMsg({ type: 'error', text: 'Network error.' });
    } finally {
      setToggleLoading((prev) => ({ ...prev, [flag]: false }));
    }

    // Auto-clear feedback after 3 seconds
    setTimeout(() => setToggleMsg(null), 3000);
  }

  function handleFormChange(field, value) {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setCreateError('');
  }

  async function handleCreateFirm(e) {
    e.preventDefault();
    setCreateError('');
    setCreateMsg('');

    const { firmName, email, password, tier, notes } = createForm;

    if (!firmName.trim()) return setCreateError('Firm name is required.');
    if (!email.trim()) return setCreateError('Email is required.');
    if (!email.endsWith('@firms.amsderive.in'))
      return setCreateError('Email must end in @firms.amsderive.in');
    if (password.length < 12) return setCreateError('Password must be at least 12 characters.');

    setCreateLoading(true);
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/admin/create-firm', {
        method: 'POST',
        headers,
        body: JSON.stringify({ firmName: firmName.trim(), tier, email: email.trim(), password, notes: notes.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setCreateMsg(`${data.firmName} created. UID: ${data.uid}`);
        setCreateForm({ firmName: '', email: '', password: '', tier: 'derivation', notes: '' });
        setCreateOpen(false);
        loadFirms();
      } else {
        setCreateError(data.error || 'Failed to create firm.');
      }
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  }

  if (checking) {
    return (
      <div className={adminStyles.checkingWrap}>
        <span className={adminStyles.checkingDot} />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Firms — AMS Derive Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={adminStyles.dashPage}>
        {/* Top bar */}
        <header className={adminStyles.topBar}>
          <span className={adminStyles.topBarTitle}>
            AMS <span className={adminStyles.topBarGold}>DERIVE</span>
            <span className={adminStyles.topBarAdmin}> — ADMIN</span>
          </span>
          <div className={adminStyles.topBarRight}>
            <span className={adminStyles.topBarEmail}>{user?.email}</span>
            <button className={adminStyles.logoutBtn} onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
        </header>

        <main className={adminStyles.dashMain}>
          {/* Tab bar */}
          <div className={adminStyles.tabBar}>
            <Link href="/admin/dashboard" className={adminStyles.tab}>REGISTRANTS</Link>
            <Link href="/admin/analytics" className={adminStyles.tab}>ANALYTICS</Link>
            <Link href="/admin/ambassadors" className={adminStyles.tab}>AMBASSADORS</Link>
            <span className={`${adminStyles.tab} ${adminStyles.tabActive}`}>FIRMS</span>
          </div>

          {/* Action bar */}
          <div className={styles.actionBar}>
            <button
              className={styles.actionBtn}
              onClick={() => {
                setCreateOpen((o) => !o);
                setCreateError('');
                setCreateMsg('');
              }}
            >
              {createOpen ? 'CANCEL' : '+ CREATE FIRM'}
            </button>
            <button className={styles.actionBtn} onClick={loadFirms} disabled={loading}>
              REFRESH
            </button>
            {createMsg && <span className={styles.feedbackSuccess}>{createMsg}</span>}
          </div>

          {/* Create firm panel */}
          {createOpen && (
            <div className={styles.createPanel}>
              <p className={styles.createPanelTitle}>CREATE FIRM ACCOUNT</p>
              <form onSubmit={handleCreateFirm}>
                <div className={styles.createPanelGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Firm Name</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="Jane Street"
                      value={createForm.firmName}
                      onChange={(e) => handleFormChange('firmName', e.target.value)}
                      maxLength={80}
                      disabled={createLoading}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Tier</label>
                    <select
                      className={styles.fieldSelect}
                      value={createForm.tier}
                      onChange={(e) => handleFormChange('tier', e.target.value)}
                      disabled={createLoading}
                    >
                      <option value="derivation">DERIVATION — ₹1.5L</option>
                      <option value="convergence">CONVERGENCE — ₹2L</option>
                      <option value="apex">APEX — Structured</option>
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Login Email</label>
                    <input
                      type="email"
                      className={styles.fieldInput}
                      placeholder="jane-street@firms.amsderive.in"
                      value={createForm.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      maxLength={120}
                      disabled={createLoading}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Password (min 12 chars)</label>
                    <input
                      type="password"
                      className={styles.fieldInput}
                      placeholder="••••••••••••"
                      value={createForm.password}
                      onChange={(e) => handleFormChange('password', e.target.value)}
                      maxLength={128}
                      disabled={createLoading}
                    />
                  </div>
                </div>
                <div className={styles.createPanelFull}>
                  <label className={styles.fieldLabel}>Internal Notes (optional)</label>
                  <textarea
                    className={styles.fieldTextarea}
                    placeholder="e.g. Point of contact: Alice, confirmed ₹2L payment on 2026-04-01"
                    value={createForm.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    disabled={createLoading}
                  />
                </div>
                {createError && (
                  <div className={adminStyles.errorBanner} style={{ marginBottom: 12 }}>
                    <span className={adminStyles.errorIcon}>!</span>
                    <span>{createError}</span>
                  </div>
                )}
                <div className={styles.createPanelActions}>
                  <button type="submit" className={styles.createBtn} disabled={createLoading}>
                    {createLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setCreateOpen(false)}
                    disabled={createLoading}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Firms table */}
          {loading ? (
            <div className={adminStyles.tableLoading}>Loading firm accounts...</div>
          ) : (
            <div className={styles.tableWrap}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {['Firm', 'Tier', 'Email', 'Last Login', 'Features Active', ''].map((h) => (
                        <th key={h} className={styles.th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {firms.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyRow}>
                          No firm accounts yet. Use &quot;CREATE FIRM&quot; to add one.
                        </td>
                      </tr>
                    ) : (
                      firms.map((firm, i) => (
                        <tr
                          key={firm.id}
                          className={`${styles.tr} ${i % 2 === 1 ? styles.trAlt : ''} ${
                            selectedFirm?.id === firm.id ? styles.trSelected : ''
                          }`}
                          onClick={() => {
                            setSelectedFirm(selectedFirm?.id === firm.id ? null : firm);
                            setToggleMsg(null);
                          }}
                        >
                          <td className={styles.td} style={{ fontWeight: 600, color: '#f0ede6' }}>
                            {firm.firmName}
                          </td>
                          <td className={styles.td}>
                            <span className={getTierBadgeClass(firm.tier)}>
                              {TIER_LABELS[firm.tier] || firm.tier}
                            </span>
                          </td>
                          <td className={`${styles.td} ${styles.mono}`} style={{ fontSize: '0.75rem', color: '#6b6560' }}>
                            {firm.primaryEmail}
                          </td>
                          <td className={`${styles.td} ${styles.mono}`} style={{ fontSize: '0.75rem' }}>
                            {formatDate(firm.lastLogin)}
                          </td>
                          <td className={`${styles.td} ${styles.mono}`} style={{ fontSize: '0.75rem', color: '#6b6560' }}>
                            {countEnabled(firm.access)}/{ACCESS_FLAGS.length}
                          </td>
                          <td className={styles.td} style={{ textAlign: 'center', fontSize: '0.6rem', color: '#6b6560' }}>
                            {selectedFirm?.id === firm.id ? '▲' : '▼'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Side panel — access toggles */}
      {selectedFirm && (
        <>
          <div
            className={adminStyles.panelBackdrop}
            onClick={() => setSelectedFirm(null)}
          />
          <aside className={adminStyles.sidePanel}>
            <div className={adminStyles.panelHeader}>
              <span className={adminStyles.panelName}>{selectedFirm.firmName}</span>
              <button
                className={adminStyles.panelClose}
                onClick={() => setSelectedFirm(null)}
              >
                CLOSE ✕
              </button>
            </div>
            <div className={adminStyles.panelBody}>
              {/* Firm info */}
              <div className={adminStyles.panelSection}>
                <p className={adminStyles.panelLabel}>Tier</p>
                <span className={getTierBadgeClass(selectedFirm.tier)}>
                  {TIER_LABELS[selectedFirm.tier] || selectedFirm.tier}
                </span>
              </div>
              <div className={adminStyles.panelSection}>
                <p className={adminStyles.panelLabel}>Login Email</p>
                <p className={adminStyles.panelValue}>{selectedFirm.primaryEmail}</p>
              </div>
              <div className={adminStyles.panelSection}>
                <p className={adminStyles.panelLabel}>Firm Slug</p>
                <p className={adminStyles.panelValue} style={{ color: '#6b6560' }}>
                  {selectedFirm.firmSlug}
                </p>
              </div>
              <div className={adminStyles.panelSection}>
                <p className={adminStyles.panelLabel}>Created</p>
                <p className={adminStyles.panelValue} style={{ color: '#6b6560', fontSize: '0.78rem' }}>
                  {formatDate(selectedFirm.createdAt)}
                </p>
              </div>
              {selectedFirm.notes && (
                <div className={adminStyles.panelSection}>
                  <p className={adminStyles.panelLabel}>Notes</p>
                  <p className={adminStyles.panelValue} style={{ color: '#6b6560', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
                    {selectedFirm.notes}
                  </p>
                </div>
              )}

              <div className={adminStyles.panelDivider} />

              {/* Access toggles */}
              <p className={adminStyles.panelLabel} style={{ marginBottom: 4 }}>
                ACCESS FLAGS
              </p>
              {ACCESS_FLAGS.map((flag) => (
                <div key={flag.key} className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>{flag.label}</span>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={!!selectedFirm.access?.[flag.key]}
                      disabled={!!toggleLoading[flag.key]}
                      onChange={() =>
                        handleToggleAccess(flag.key, !selectedFirm.access?.[flag.key])
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              ))}

              {toggleMsg && (
                <p
                  className={
                    toggleMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
                  }
                  style={{ marginTop: 8 }}
                >
                  {toggleMsg.text}
                </p>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
