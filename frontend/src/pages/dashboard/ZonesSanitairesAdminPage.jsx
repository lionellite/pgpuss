import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { adminZonesSanitairesAPI, establishmentsAPI } from '../../api'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'

export default function ZonesSanitairesAdminPage() {
  const [zones, setZones] = useState([])
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [currentZone, setCurrentZone] = useState(null)
  const [formData, setFormData] = useState({ name: '', code: '', region: '', is_active: true })

  const loadData = async () => {
    try {
      setLoading(true)
      const [resZones, resRegions] = await Promise.all([
        adminZonesSanitairesAPI.list({ search }),
        establishmentsAPI.regions()
      ])
      setZones(resZones.data.results || resZones.data)
      setRegions(resRegions.data.results || resRegions.data)
    } catch (e) {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search])

  const openModal = (zone = null) => {
    if (zone) {
      setCurrentZone(zone)
      setFormData({
        name: zone.name,
        code: zone.code || '',
        region: zone.region?.id || zone.region || '',
        is_active: zone.is_active
      })
    } else {
      setCurrentZone(null)
      setFormData({ name: '', code: '', region: '', is_active: true })
    }
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentZone) {
        await adminZonesSanitairesAPI.update(currentZone.id, formData)
        toast.success('Zone sanitaire modifiée')
      } else {
        await adminZonesSanitairesAPI.create(formData)
        toast.success('Zone sanitaire créée')
      }
      setModal(false)
      loadData()
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.name?.[0] || err?.code?.[0] || 'Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment désactiver cette zone sanitaire ?')) return
    try {
      await adminZonesSanitairesAPI.update(id, { is_active: false })
      toast.success('Zone sanitaire désactivée')
      loadData()
    } catch (e) {
      toast.error('Erreur lors de la désactivation')
    }
  }

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Zones Sanitaires
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Gestion du référentiel des zones sanitaires (départements/communes).
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FiPlus /> Ajouter une zone
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', maxWidth: 400 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher une zone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Code</th>
                  <th>Région</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id}>
                    <td style={{ fontWeight: 600 }}>{zone.name}</td>
                    <td>{zone.code || '—'}</td>
                    <td>{zone.region?.name || '—'}</td>
                    <td>
                      <span className={`badge badge-${zone.is_active ? 'success' : 'danger'}`}>
                        {zone.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => openModal(zone)} title="Modifier">
                        <FiEdit2 />
                      </button>
                      {zone.is_active && (
                        <button className="btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(zone.id)} title="Désactiver">
                          <FiTrash2 />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {zones.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Aucune zone sanitaire trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{currentZone ? 'Modifier la zone' : 'Nouvelle zone'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nom de la zone *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Code (optionnel)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Région *</label>
                <select
                  className="form-select"
                  required
                  value={formData.region}
                  onChange={e => setFormData({ ...formData, region: e.target.value })}
                >
                  <option value="">Sélectionner une région</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>Zone active</label>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentZone ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
