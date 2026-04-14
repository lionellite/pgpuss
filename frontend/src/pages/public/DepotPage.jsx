import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { complaintsAPI, establishmentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiUpload, FiX, FiCheckCircle, FiChevronRight, FiChevronLeft, FiVolume2, FiVolumeX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const STEPS = ['Établissement', 'Catégorie', 'Description', 'Identité', 'Confirmation']

const VOCAL_GUIDES = [
  "Étape 1 : Choisissez l'établissement de santé concerné par votre plainte. Vous pouvez filtrer par région.",
  "Étape 2 : Sélectionnez la catégorie qui correspond le mieux à votre problème. Cliquez sur une image.",
  "Étape 3 : Donnez un titre et expliquez ce qui s'est passé en détail. Vous pouvez aussi ajouter des photos.",
  "Étape 4 : Souhaitez-vous rester anonyme ou donner votre nom ? Vos coordonnées nous permettent de vous répondre.",
  "Étape 5 : Vérifiez vos informations une dernière fois avant de valider l'envoi."
]

export default function DepotPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [categories, setCategories] = useState([])
  const [establishments, setEstablishments] = useState([])
  const [regions, setRegions] = useState([])
  const [services, setServices] = useState([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedEst, setSelectedEst] = useState(null)
  const [selectedCat, setSelectedCat] = useState(null)
  const [submitted, setSubmitted] = useState(null)
  const [files, setFiles] = useState([])
  const [vocalEnabled, setVocalEnabled] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      is_anonymous: false,
      channel: 'WEB',
      complainant_name: user ? `${user.first_name} ${user.last_name}` : '',
      complainant_email: user?.email || '',
      complainant_phone: user?.phone || '',
    }
  })

  useEffect(() => {
    Promise.all([
      complaintsAPI.categories(),
      establishmentsAPI.list(),
      establishmentsAPI.regions(),
    ]).then(([cats, ests, regs]) => {
      setCategories(cats.data.results || cats.data)
      setEstablishments(ests.data.results || ests.data)
      setRegions(regs.data.results || regs.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedEst) {
      establishmentsAPI.services(selectedEst).then(({ data }) => {
        setServices(data.results || data)
      }).catch(() => setServices([]))
    }
  }, [selectedEst])

  const estId = watch('establishment')
  useEffect(() => { if (estId) setSelectedEst(estId) }, [estId])

  // Accessibility: Vocal Guide
  useEffect(() => {
    if (vocalEnabled && !submitted) {
      const msg = new SpeechSynthesisUtterance(VOCAL_GUIDES[step])
      msg.lang = 'fr-FR'
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(msg)
    }
  }, [step, vocalEnabled, submitted])

  const toggleVocal = () => {
    if (!vocalEnabled) {
      setVocalEnabled(true)
    } else {
      window.speechSynthesis.cancel()
      setVocalEnabled(false)
    }
  }

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
  }

  const onSubmit = async (data) => {
    try {
      const formData = {
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        establishment: data.establishment,
        service: data.service || null,
        is_anonymous: data.is_anonymous,
        complainant_name: data.is_anonymous ? '' : data.complainant_name,
        complainant_email: data.is_anonymous ? '' : data.complainant_email,
        complainant_phone: data.is_anonymous ? '' : data.complainant_phone,
        channel: 'WEB',
      }
      const { data: result } = await complaintsAPI.create(formData)
      setSubmitted(result)
      toast.success('Plainte déposée avec succès!')
    } catch (e) {
      toast.error("Erreur lors du dépôt. Vérifiez tous les champs.")
    }
  }

  const isAnonymous = watch('is_anonymous')
  const catId = watch('category')
  const selectedCategory = categories.find(c => String(c.id) === String(catId))

  if (submitted) {
    return (
      <div style={{ padding: '5rem 0', minHeight: '80vh' }}>
        <div className="page-container">
          <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 2rem',
              background: 'rgba(6,214,160,0.1)', border: '3px solid #06D6A0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem',
            }}>✅</div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: '#F0F4FF', marginBottom: '0.75rem' }}>
              Plainte déposée !
            </h1>
            <p style={{ color: '#8FA3BF', marginBottom: '2rem', lineHeight: 1.7 }}>
              Votre plainte a été enregistrée avec succès. Conservez votre numéro de ticket pour le suivi.
            </p>
            <div style={{
              padding: '1.5rem', background: 'rgba(6,214,160,0.05)',
              border: '2px solid rgba(6,214,160,0.3)', borderRadius: '16px', marginBottom: '2rem',
            }}>
              <div style={{ fontSize: '0.8rem', color: '#8FA3BF', marginBottom: '0.25rem' }}>Votre numéro de ticket</div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2rem', color: '#06D6A0', letterSpacing: '0.1em' }}>
                {submitted.ticket_number}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate(`/suivi?ticket=${submitted.ticket_number}`)}>
                Suivre ma plainte
              </button>
              {user && (
                <button className="btn btn-ghost" onClick={() => navigate('/espace/plaintes')}>
                  Mes plaintes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '4rem 0', minHeight: '80vh', background: '#fff' }}>
      <div className="page-container">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="page-title">Déposer une plainte</h1>
              <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Suivez les étapes pour soumettre votre dossier aux autorités sanitaires compétentes.
              </p>
            </div>
            <button
              onClick={toggleVocal}
              className={`btn ${vocalEnabled ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '50px', padding: '0.5rem 1rem' }}
              title={vocalEnabled ? "Désactiver l'aide vocale" : "Activer l'aide vocale"}
            >
              {vocalEnabled ? <FiVolume2 /> : <FiVolumeX />}
              <span style={{ fontSize: '0.7rem', marginLeft: '0.3rem' }}>{t('vocal_help')}</span>
            </button>
          </div>

          {/* Step indicator */}
          <div className="steps" style={{ marginBottom: '3rem' }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className="step">
                  <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                </div>
                {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid #ddd', boxShadow: 'none' }}>
            <form onSubmit={handleSubmit(onSubmit)}>

              {/* Step 0 — Établissement */}
              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#111' }}>
                    1. Établissement concerné
                  </h2>
                  <div className="form-group">
                    <label className="form-label">Région</label>
                    <select className="form-select" value={selectedRegion} onChange={e => {
                      setSelectedRegion(e.target.value)
                      setValue('establishment', '')
                      setValue('service', '')
                    }}>
                      <option value="">Toutes les régions</option>
                      {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Établissement *</label>
                    <select className="form-select" {...register('establishment', { required: 'Requis' })}>
                      <option value="">Sélectionnez un établissement</option>
                      {establishments
                        .filter(e => !selectedRegion || e.region === selectedRegion)
                        .map(e => <option key={e.id} value={e.id}>{e.name} ({e.type_display})</option>)
                      }
                    </select>
                    {errors.establishment && <span className="form-error">{errors.establishment.message}</span>}
                  </div>
                  {services.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Service (optionnel)</label>
                      <select className="form-select" {...register('service')}>
                        <option value="">Sélectionnez un service</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Step 1 — Catégorie */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#111' }}>
                    2. Type de plainte
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {categories.map(cat => (
                      <label key={cat.id} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                        padding: '1.5rem', borderRadius: '4px', cursor: 'pointer',
                        background: String(catId) === String(cat.id) ? '#f0f9f5' : '#fff',
                        border: String(catId) === String(cat.id) ? '2px solid var(--color-primary)' : '1px solid #ddd',
                        textAlign: 'center',
                      }}>
                        <input type="radio" value={cat.id} {...register('category', { required: 'Requis' })} style={{ display: 'none' }} />
                        <span style={{ fontSize: '2rem' }}>{cat.icon}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.category && <span className="form-error">{errors.category.message}</span>}

                  {selectedCategory?.subcategories?.length > 0 && (
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label className="form-label">Sous-catégorie (optionnel)</label>
                      <select className="form-select" {...register('subcategory')}>
                        <option value="">Sélectionnez une sous-catégorie</option>
                        {selectedCategory.subcategories.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 — Description */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: '#111' }}>3. Description de la plainte</h2>
                  <div className="form-group">
                    <label className="form-label">Titre de la plainte *</label>
                    <input className="form-input" placeholder="Résumez votre plainte en une phrase"
                      {...register('title', { required: 'Titre requis', minLength: { value: 10, message: 'Min. 10 caractères' } })} />
                    {errors.title && <span className="form-error">{errors.title.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description détaillée *</label>
                    <textarea className="form-textarea" style={{ minHeight: 180 }}
                      placeholder="Décrivez le problème en détail : que s'est-il passé ? Quand ? Qui était impliqué ?..."
                      {...register('description', { required: 'Description requise', minLength: { value: 50, message: 'Min. 50 caractères' } })} />
                    {errors.description && <span className="form-error">{errors.description.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pièces jointes (optionnel — max 5 fichiers)</label>
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                      padding: '2rem', border: '2px dashed rgba(0,119,182,0.3)', borderRadius: '12px',
                      cursor: 'pointer', background: 'rgba(0,119,182,0.03)',
                      transition: 'all 0.2s',
                    }}>
                      <FiUpload style={{ fontSize: '1.5rem', color: '#8FA3BF' }} />
                      <span style={{ fontSize: '0.875rem', color: '#8FA3BF' }}>Cliquez pour ajouter des fichiers</span>
                      <span style={{ fontSize: '0.75rem', color: '#4A6080' }}>PDF, images — Max 10 MB par fichier</span>
                      <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                    </label>
                    {files.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {files.map((f, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.5rem 0.875rem', background: 'rgba(0,119,182,0.05)',
                            borderRadius: '8px', border: '1px solid rgba(0,119,182,0.1)',
                          }}>
                            <span style={{ fontSize: '0.8rem', color: '#8FA3BF' }}>📎 {f.name}</span>
                            <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                              style={{ background: 'none', border: 'none', color: '#EF476F', cursor: 'pointer' }}>
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3 — Identité */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: '#111' }}>4. Vos coordonnées</h2>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1.25rem', borderRadius: '4px',
                    background: isAnonymous ? '#f8f9fa' : '#fff',
                    border: isAnonymous ? '1px solid var(--color-primary)' : '1px solid #ddd',
                    cursor: 'pointer',
                  }}>
                    <input type="checkbox" {...register('is_anonymous')} style={{ width: 20, height: 20 }} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#111', fontSize: '0.9rem' }}>Déposer de façon anonyme</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Votre identité ne sera pas communiquée à l'établissement concerné.</div>
                    </div>
                  </label>

                  {!isAnonymous && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Nom complet</label>
                        <input className="form-input" placeholder="Prénom et Nom" {...register('complainant_name')} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Email</label>
                          <input className="form-input" type="email" placeholder="email@exemple.com" {...register('complainant_email')} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Téléphone</label>
                          <input className="form-input" type="tel" placeholder="+229 XX XX XX XX" {...register('complainant_phone')} />
                        </div>
                      </div>
                    </>
                  )}

                  {isAnonymous && (
                    <div className="alert alert-info">
                      Votre plainte sera traitée de façon confidentielle. Notez que sans coordonnées, nous ne pourrons pas vous notifier directement.
                    </div>
                  )}
                </div>
              )}

              {/* Step 4 — Confirmation */}
              {step === 4 && (
                <div>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#111' }}>
                    5. Récapitulatif et confirmation
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                    {[
                      { label: 'Établissement', value: establishments.find(e => String(e.id) === String(watch('establishment')))?.name },
                      { label: 'Catégorie', value: selectedCategory?.name },
                      { label: 'Titre', value: watch('title') },
                      { label: 'Anonymat', value: isAnonymous ? 'OUI' : 'NON' },
                      { label: 'Pièces jointes', value: files.length > 0 ? `${files.length} fichier(s)` : 'Aucune' },
                    ].map((row, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        padding: '1rem', background: '#f8f9fa', borderRadius: '4px',
                        border: '1px solid #eee',
                      }}>
                        <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 700, textTransform: 'uppercase' }}>{row.label}</span>
                        <span style={{ fontSize: '0.9rem', color: '#111', textAlign: 'right', maxWidth: '60%', fontWeight: 500 }}>{row.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                    En soumettant, vous acceptez que vos informations soient utilisées uniquement dans le cadre du traitement de votre plainte.
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
                    <FiCheckCircle />
                    {isSubmitting ? 'Envoi en cours...' : 'Soumettre ma plainte'}
                  </button>
                </div>
              )}

              {/* Navigation buttons */}
              {step < 4 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                    <FiChevronLeft /> Précédent
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                    Suivant <FiChevronRight />
                  </button>
                </div>
              )}
              {step === 4 && (
                <button type="button" className="btn btn-ghost" onClick={() => setStep(3)} style={{ marginTop: '1rem' }}>
                  <FiChevronLeft /> Modifier
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
