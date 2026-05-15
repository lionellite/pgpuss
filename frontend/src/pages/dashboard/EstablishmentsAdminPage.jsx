import React, { useEffect, useState } from 'react'
import { adminEstablishmentsAPI, establishmentsAPI } from '../../api'
import toast from 'react-hot-toast'

const TYPES = ['CHU', 'CHR', 'HZ', 'CS', 'PRIVE', 'PHARMACIE', 'LABORATOIRE']
const OPS = ['OPERATIONAL', 'LIMITED', 'CLOSED_TEMP', 'CLOSED_PERM']

export default function EstablishmentsAdminPage() {
  const [regions, setRegions] = useState([])
  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)
  const [services, setServices] = useState([])
  const [newEst, setNewEst] = useState({
    name: '',
    type: 'HZ',
    region: '',
    address: '',
    phone: '',
    email: '',
    is_active: true,
    operational_status: 'OPERATIONAL',
  })
  const [newSvc, setNewSvc] = useState({ name: '', operational_status: 'OPERATIONAL', is_active: true })

  const loadRegions = () => {
    establishmentsAPI.regions().then(({ data }) => setRegions(data.results || data)).catch(() => {})
  }

  const loadList = () => {
    adminEstablishmentsAPI.list()
      .then(({ data }) => setList(data.results || data))
      .catch(() => toast.error('Accès refusé ou erreur réseau'))
  }

  useEffect(() => {
    loadRegions()
    loadList()
  }, [])

  const loadServices = (estId) => {
    adminEstablishmentsAPI.servicesList(estId)
      .then(({ data }) => setServices(data.results || data))
      .catch(() => setServices([]))
  }

  const selectEst = (e) => {
    setSelected(e)
    loadServices(e.id)
    setNewSvc({ name: '', operational_status: 'OPERATIONAL', is_active: true })
  }

  const createEst = async (ev) => {
    ev.preventDefault()
    try {
      await adminEstablishmentsAPI.create(newEst)
      toast.success('Établissement créé')
      setNewEst({
        name: '',
        type: 'HZ',
        region: newEst.region,
        address: '',
        phone: '',
        email: '',
        is_active: true,
        operational_status: 'OPERATIONAL',
      })
      loadList()
    } catch {
      toast.error('Création impossible')
    }
  }

  const patchEst = async (patch) => {
    if (!selected) return
    try {
      await adminEstablishmentsAPI.update(selected.id, patch)
      toast.success('Mis à jour')
      loadList()
      const { data } = await adminEstablishmentsAPI.list()
      const rows = data.results || data
      const fresh = rows.find((r) => r.id === selected.id)
      if (fresh) setSelected(fresh)
    } catch {
      toast.error('Erreur')
    }
  }

  const createSvc = async (ev) => {
    ev.preventDefault()
    if (!selected || !newSvc.name.trim()) return
    try {
      await adminEstablishmentsAPI.serviceCreate(selected.id, newSvc)
      toast.success('Service créé')
      setNewSvc({ name: '', operational_status: 'OPERATIONAL', is_active: true })
      loadServices(selected.id)
    } catch {
      toast.error('Erreur création service')
    }
  }

  const patchSvc = async (svc, patch) => {
    try {
      await adminEstablishmentsAPI.serviceUpdate(svc.id, patch)
      toast.success('Service mis à jour')
      loadServices(selected.id)
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 800 }}>Centres et services de santé</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Création, modification et statut de fonctionnement des établissements listés sur le portail usager (seuls les établissements « opérationnels » apparaissent au dépôt public).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <section className="glass-card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Nouvel établissement</h2>
          <form onSubmit={createEst} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <input className="form-input" placeholder="Nom" value={newEst.name} onChange={(e) => setNewEst({ ...newEst, name: e.target.value })} required />
            <select className="form-select" value={newEst.type} onChange={(e) => setNewEst({ ...newEst, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="form-select" value={newEst.region} onChange={(e) => setNewEst({ ...newEst, region: e.target.value })} required>
              <option value="">Région</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <textarea className="form-textarea" placeholder="Adresse" value={newEst.address} onChange={(e) => setNewEst({ ...newEst, address: e.target.value })} rows={2} />
            <input className="form-input" placeholder="Téléphone" value={newEst.phone} onChange={(e) => setNewEst({ ...newEst, phone: e.target.value })} />
            <input className="form-input" placeholder="Email" value={newEst.email} onChange={(e) => setNewEst({ ...newEst, email: e.target.value })} />
            <select className="form-select" value={newEst.operational_status} onChange={(e) => setNewEst({ ...newEst, operational_status: e.target.value })}>
              {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={newEst.is_active} onChange={(e) => setNewEst({ ...newEst, is_active: e.target.checked })} />
              Actif
            </label>
            <button type="submit" className="btn btn-primary btn-sm">Créer</button>
          </form>
        </section>

        <section className="glass-card" style={{ padding: '1.25rem', minWidth: 0 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Établissements</h2>
          <div style={{ overflowX: 'auto', maxHeight: 320 }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.operational_status_display || e.operational_status}</td>
                    <td>
                      <button type="button" className={`btn btn-sm ${selected?.id === e.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => selectEst(e)}>
                        Sélectionner
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>{selected.name}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem' }}>
                  Fonctionnement{' '}
                  <select className="form-select" style={{ marginLeft: '0.35rem' }} value={selected.operational_status} onChange={(ev) => patchEst({ operational_status: ev.target.value })}>
                    {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input type="checkbox" checked={selected.is_active} onChange={(ev) => patchEst({ is_active: ev.target.checked })} />
                  Actif
                </label>
              </div>

              <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Services</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', fontSize: '0.8rem' }}>
                {services.map((s) => (
                  <li key={s.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ minWidth: 120 }}>{s.name}</span>
                    <select className="form-select" style={{ width: 'auto' }} value={s.operational_status} onChange={(ev) => patchSvc(s, { operational_status: ev.target.value })}>
                      {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <input type="checkbox" checked={s.is_active} onChange={(ev) => patchSvc(s, { is_active: ev.target.checked })} />
                      actif
                    </label>
                  </li>
                ))}
              </ul>
              <form onSubmit={createSvc} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <input className="form-input" placeholder="Nouveau service" value={newSvc.name} onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })} />
                <button type="submit" className="btn btn-secondary btn-sm">Ajouter service</button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
