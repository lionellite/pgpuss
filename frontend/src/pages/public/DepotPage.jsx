import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { complaintsAPI, establishmentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiUpload, FiX, FiCheckCircle, FiChevronRight, FiChevronLeft, FiVolume2, FiVolumeX, FiCopy, FiCheck } from 'react-icons/fi'
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
  const [submitted, setSubmitted] = useState(null)
  const [files, setFiles] = useState([])
  const [vocalEnabled, setVocalEnabled] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Numéro de ticket copié !')
    setTimeout(() => setCopied(false), 2000)
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
            <h1 style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: '2rem', color: '#111', marginBottom: '0.75rem' }}>
              Plainte déposée !
            </h1>
            <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.7 }}>
              Votre plainte a été enregistrée avec succès. Conservez votre numéro de ticket pour le suivi.
            </p>
            <div style={{
              padding: '1.5rem', background: '#f0f9f5',
              border: '2px solid #06D6A0', borderRadius: '8px', marginBottom: '2rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Votre numéro de ticket</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontWeight: 900, fontSize: '2.5rem', color: '#008751', letterSpacing: '0.1em' }}>
                  {submitted.ticket_number}
                </div>
                <button
                  onClick={() => handleCopy(submitted.ticket_number)}
                  aria-label="Copier le numéro de ticket"
                  style={{
                    background: 'white', border: '1px solid #ccc',
                    color: '#333', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {copied ? <FiCheck size={20} /> : <FiCopy size={20} />}
                </button>
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
              type="button"
              onClick={toggleVocal}
              className={`btn ${vocalEnabled ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '50px', padding: '0.5rem 1rem' }}
              title={vocalEnabled ? "Désactiver l'aide vocale" : "Activer l'aide vocale"}
            >
              {vocalEnabled ? <FiVolume2 /> : <FiVolumeX />}
              <span style={{ fontSize: '0.7rem', marginLeft: '0.3rem' }}>{t('vocal_help')}</span>
            </button>
          </div>

          <div className="steps" style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i < step ? '#008751' : i === step ? '#008751' : '#eee',
                      color: i <= step ? 'white' : '#999', fontSize: '0.8rem', fontWeight: 700
                    }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: i === step ? '#111' : '#999', textTransform: 'uppercase' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ height: 2, background: i < step ? '#008751' : '#eee', flex: 1, marginBottom: '1.2rem' }} />}
              </React.Fragment>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid #ddd', boxShadow: 'none' }}>
            <form onSubmit={handleSubmit(onSubmit)}>

              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#111' }}>1. Établissement concerné</h2>
                  <div className="form-group">
                    <label className="form-label">Région</label>
                    <select className="form-select" value={selectedRegion} onChange={e => {
                      setSelectedRegion(e.target.value)
                      setValue('establishment', '')
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
                        .map(e => <option key={e.id} value={e.id}>{e.name}</option>)
                      }
                    </select>
                    {errors.establishment && <span className="form-error">{errors.establishment.message}</span>}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#111' }}>2. Type de plainte</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {categories.map(cat => (
                      <label key={cat.id} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                        padding: '1.5rem', borderRadius: '4px', cursor: 'pointer',
                        background: String(catId) === String(cat.id) ? '#f0f9f5' : '#fff',
                        border: String(catId) === String(cat.id) ? '2px solid #008751' : '1px solid #ddd',
                        textAlign: 'center',
                      }}>
                        <input type="radio" value={cat.id} {...register('category', { required: 'Requis' })} style={{ display: 'none' }} />
                        <span style={{ fontSize: '2rem' }}>{cat.icon}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.category && <span className="form-error">{errors.category.message}</span>}
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: '#111' }}>3. Description</h2>
                  <div className="form-group">
                    <label className="form-label">Titre de la plainte *</label>
                    <input className="form-input" placeholder="Résumez votre plainte"
                      {...register('title', { required: 'Titre requis' })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Détails *</label>
                    <textarea className="form-textarea" style={{ minHeight: 150 }}
                      placeholder="Expliquez ce qui s'est passé..."
                      {...register('description', { required: 'Description requise' })} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: '#111' }}>4. Identité</h2>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" {...register('is_anonymous')} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Déposer de façon anonyme</span>
                  </label>
                  {!isAnonymous && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <input className="form-input" placeholder="Nom complet" {...register('complainant_name')} />
                      <input className="form-input" placeholder="Email" {...register('complainant_email')} />
                      <input className="form-input" placeholder="Téléphone" {...register('complainant_phone')} />
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#111' }}>5. Confirmation</h2>
                  <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '4px', marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#444' }}>Veuillez vérifier vos informations avant de valider.</p>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%' }}>
                    {isSubmitting ? 'Envoi...' : 'Soumettre ma plainte'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                {step > 0 && step < 5 && (
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
                    <FiChevronLeft /> Précédent
                  </button>
                )}
                {step < 4 && (
                  <button type="button" className="btn btn-primary" onClick={() => setStep(s => s + 1)} style={{ marginLeft: 'auto' }}>
                    Suivant <FiChevronRight />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
