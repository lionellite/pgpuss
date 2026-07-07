import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { complaintsAPI, establishmentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiUpload, FiX, FiChevronRight, FiChevronLeft, FiVolume2, FiVolumeX, FiCopy, FiCheck, FiMic, FiTrash2, FiCheckCircle } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const STEPS = ['Établissement', 'Catégorie', 'Description', 'Identité', 'Confirmation']

function cleanCategoryLabel(cat) {
  const name = typeof cat === 'string' ? cat : (cat?.display_name || cat?.name || '')
  if (!name) return ''
  return name
    .replace(/[\u{1F300}-\u{1F9FF}\u2600-\u27BF]/gu, '')
    .replace(/^\s*P\d+\s*[—–\-:]\s*/i, '')
    .replace(/\bP[1-5]\b\s*[—–\-:]?\s*/gi, ' ')
    .replace(/\s*[—–\-]+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const VOCAL_GUIDES = [
  "Étape 1 : Choisissez l'établissement de santé concerné par votre plainte. Vous pouvez filtrer par région.",
  "Étape 2 : Sélectionnez la catégorie qui correspond le mieux à votre problème. Cliquez sur une image.",
  "Étape 3 : Donnez un titre et expliquez ce qui s'est passé. Vous pouvez joindre des fichiers et enregistrer un message vocal si vous préférez parler plutôt qu'écrire.",
  "Étape 4 : Souhaitez-vous rester anonyme ou donner votre nom ? Vos coordonnées nous permettent de vous répondre.",
  "Étape 5 : Vérifiez vos informations une dernière fois avant de valider l'envoi."
]

export default function DepotPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isCallCenter = user?.role === 'AGENT_CALL_CENTER'
  const [step, setStep] = useState(0)
  const [categories, setCategories] = useState([])
  const [establishments, setEstablishments] = useState([])
  const [regions, setRegions] = useState([])
  const [services, setServices] = useState([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedEst, setSelectedEst] = useState(null)
  const [manualEstablishment, setManualEstablishment] = useState(false)
  const [manualEstName, setManualEstName] = useState('')
  const [manualEstAddress, setManualEstAddress] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const [files, setFiles] = useState([])
  const [vocalEnabled, setVocalEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const [voiceBlob, setVoiceBlob] = useState(null)
  const [descriptionMode, setDescriptionMode] = useState('text')
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const voicePreviewUrl = useMemo(() => (voiceBlob ? URL.createObjectURL(voiceBlob) : null), [voiceBlob])
  useEffect(() => () => {
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl)
  }, [voicePreviewUrl])

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      is_anonymous: false,
      channel: user?.role === 'AGENT_CALL_CENTER' ? 'CALL_CENTER' : 'WEB',
      complainant_name: user && user.role === 'USAGER' ? `${user.first_name} ${user.last_name}` : '',
      complainant_email: user && user.role === 'USAGER' ? user?.email || '' : '',
      complainant_phone: user && user.role === 'USAGER' ? user?.phone || '' : '',
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
    }).catch((e) => {
      console.error('Error loading data:', e)
      toast.error("Erreur de chargement des données, veuillez actualiser la page")
    })
  }, [])

  useEffect(() => {
    if (user?.role === 'USAGER') {
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
      if (name) setValue('complainant_name', name)
      if (user.email) setValue('complainant_email', user.email)
      if (user.phone) setValue('complainant_phone', user.phone)
    }
  }, [user, setValue])

  useEffect(() => {
    if (selectedEst) {
      establishmentsAPI.services(selectedEst).then(({ data }) => {
        setServices(data.results || data)
      }).catch(() => setServices([]))
    }
  }, [selectedEst])

  const estId = watch('establishment')
  const watched = useWatch({
    control,
    name: [
      'establishment', 'category', 'title', 'description',
      'is_anonymous', 'complainant_name', 'complainant_phone', 'complainant_email',
    ],
  })
  useEffect(() => { if (estId) setSelectedEst(estId) }, [estId])

  // Accessibility: Vocal Guide
  useEffect(() => {
    if (vocalEnabled && !submitted) {
      const speak = () => {
        const msg = new SpeechSynthesisUtterance(VOCAL_GUIDES[step])
        msg.lang = 'fr-FR'
        try {
          const voices = window.speechSynthesis?.getVoices?.() || []
          const frVoices = voices.filter(v => (v.lang || '').toLowerCase().startsWith('fr'))
          const googleFr = frVoices.find(v => /google/i.test(v.name || ''))
          if (googleFr) msg.voice = googleFr
          else if (frVoices[0]) msg.voice = frVoices[0]
        } catch {}
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(msg)
      }

      // Certains navigateurs ne chargent les voix qu'après l'événement voiceschanged.
      const voices = window.speechSynthesis?.getVoices?.() || []
      if (voices.length > 0) {
        speak()
        return
      }
      const onVoicesChanged = () => {
        window.speechSynthesis?.removeEventListener?.('voiceschanged', onVoicesChanged)
        speak()
      }
      window.speechSynthesis?.addEventListener?.('voiceschanged', onVoicesChanged)
      // Fallback si l'événement ne vient pas
      const t = setTimeout(() => {
        window.speechSynthesis?.removeEventListener?.('voiceschanged', onVoicesChanged)
        speak()
      }, 400)
      return () => {
        clearTimeout(t)
        window.speechSynthesis?.removeEventListener?.('voiceschanged', onVoicesChanged)
      }
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      audioChunksRef.current = []
      mr.ondataavailable = (ev) => {
        if (ev.data?.size) audioChunksRef.current.push(ev.data)
      }
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' })
        setVoiceBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch {
      toast.error('Microphone inaccessible. Vérifiez les permissions du navigateur.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecording(false)
  }

  const clearVoice = () => setVoiceBlob(null)

  const switchDescriptionMode = (mode) => {
    setDescriptionMode(mode)
    if (mode === 'voice') {
      setValue('description', '')
    } else {
      clearVoice()
      if (recording) stopRecording()
    }
  }

  const handleCopy = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.top = '0'
        textArea.style.left = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      toast.success('Numéro de ticket copié !')
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
      toast.error("Erreur lors de la copie du ticket")
    }
  }

  const canAdvanceStep = () => {
    switch (step) {
      case 0:
        return manualEstablishment
          ? manualEstName.trim().length > 0
          : Boolean(watched?.[0])
      case 1:
        return Boolean(watched?.[1])
      case 2:
        if (!String(watched?.[2] || '').trim()) return false
        if (descriptionMode === 'voice') return Boolean(voiceBlob)
        return Boolean(String(watched?.[3] || '').trim())
      case 3:
        if (isCallCenter) {
          return Boolean(String(watched?.[5] || '').trim()) && Boolean(String(watched?.[6] || '').trim())
        }
        if (watched?.[4]) {
          return true
        }
        return Boolean(String(watched?.[5] || '').trim())
      default:
        return true
    }
  }

  const goNextStep = () => {
    if (!canAdvanceStep()) {
      toast.error('Veuillez compléter les champs obligatoires de cette étape.')
      return
    }
    setStep((s) => s + 1)
  }

  const onSubmit = async (data) => {
    try {
      const isVoice = descriptionMode === 'voice'
      const payload = {
        title: data.title,
        description_mode: isVoice ? 'voice' : 'text',
        description: isVoice ? undefined : data.description,
        category: data.category,
        is_anonymous: Boolean(data.is_anonymous),
        channel: data.channel || 'WEB',
      }
      if (data.subcategory) payload.subcategory = data.subcategory
      if (manualEstablishment) {
        payload.establishment_name_manual = manualEstName.trim()
        if (manualEstAddress.trim()) payload.establishment_address_manual = manualEstAddress.trim()
      } else {
        payload.establishment = data.establishment
      }
      if (data.service) payload.service = data.service
      if (data.is_anonymous) {
        payload.complainant_phone = data.complainant_phone || ''
      } else {
        if (data.complainant_name) payload.complainant_name = data.complainant_name
        if (data.complainant_email) payload.complainant_email = data.complainant_email
        if (data.complainant_phone) payload.complainant_phone = data.complainant_phone
      }

      const { data: result } = await complaintsAPI.createJson(payload)
      const complaintId = result.complaint_id
      const uploadToken = result.upload_token

      let mediaError = ''
      if (complaintId && uploadToken) {
        const reportMediaError = (e) => {
          const d = e.response?.data
          mediaError = d?.error || d?.detail || mediaError
        }
        if (isVoice && voiceBlob) {
          try {
            const vfd = new FormData()
            vfd.append('voice_file', voiceBlob, 'message-vocal.webm')
            await complaintsAPI.uploadDepositMedia(complaintId, vfd, uploadToken)
          } catch (e) {
            reportMediaError(e)
          }
        }
        for (const file of files) {
          try {
            const afd = new FormData()
            afd.append('attachment', file)
            await complaintsAPI.uploadDepositMedia(complaintId, afd, uploadToken)
          } catch (e) {
            reportMediaError(e)
          }
        }
      }

      setSubmitted(result)
      toast.success('Plainte déposée avec succès!')
      if (mediaError) {
        toast.error(
          `Plainte enregistrée, mais le fichier n'a pas pu être envoyé : ${mediaError}`,
          { duration: 10000 },
        )
      }
    } catch (e) {
      console.error('Error submitting complaint:', e)
      console.error('Error details:', e.response)
      const d = e.response?.data
      let msg = d?.error
      if (!msg && d && typeof d === 'object') {
        msg = Object.entries(d)
          .map(([k, v]) => {
            const val = Array.isArray(v) ? v.join(', ') : String(v)
            return `${k}: ${val}`
          })
          .join(' · ')
      }
      toast.error(msg || "Erreur lors du dépôt. Vérifiez tous les champs.")
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
              background: 'rgba(0,102,102,0.1)', border: '3px solid var(--color-primary-container)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem',
            }}><FiCheckCircle aria-hidden style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }} /></div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Plainte déposée !
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
              Votre plainte a été enregistrée avec succès. Conservez votre numéro de ticket pour le suivi.
            </p>
            <div style={{
              padding: '1.5rem', background: 'var(--surface-container-low)',
              border: '2px solid var(--color-primary-container)', borderRadius: '8px', marginBottom: '2rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Votre numéro de ticket</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 900, fontSize: '2.25rem', color: 'var(--color-primary)', letterSpacing: '0.08em', wordBreak: 'break-all' }}>
                      {submitted.ticket_number}
                    </div>
                    <button
                      onClick={() => handleCopy(submitted.ticket_number)}
                      aria-label="Copier le numéro de ticket"
                      style={{
                        background: copied ? 'var(--color-success)' : 'var(--color-primary)', 
                        border: 'none',
                        color: 'white', 
                        borderRadius: '8px', 
                        padding: '0.75rem 1.25rem', 
                        cursor: 'pointer',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        minWidth: '160px',
                        minHeight: '48px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {copied ? <><FiCheck size={20} /> Copié !</> : <><FiCopy size={20} /> Copier</>}
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
    <div style={{ padding: '4rem 0', minHeight: '80vh', background: 'var(--bg-page)' }}>
      <div className="page-container">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Bannière Call Center 136 */}
          {isCallCenter && (
            <div style={{
              marginBottom: '1.5rem', padding: '1rem 1.5rem', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
              color: 'white', display: 'flex', alignItems: 'center', gap: '1rem',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📞</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>Mode Call Center — Ligne Verte 136</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    Saisie de plainte au nom de l'usager. Le canal sera automatiquement enregistré comme « Call Center 136 ».
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)',
                  color: 'white', padding: '0.5rem 1rem', borderRadius: '6px',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                ← Tableau de bord
              </button>
            </div>
          )}

          <div style={{ marginBottom: '3rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="page-title">{isCallCenter ? 'Saisie de plainte (136)' : 'Déposer une plainte'}</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {isCallCenter
                  ? 'Transcrivez la plainte de l\'usager en remplissant le formulaire. Le numéro de ticket sera généré automatiquement.'
                  : 'Suivez les étapes pour soumettre votre dossier aux autorités sanitaires compétentes.'
                }
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
                      background: i < step ? 'var(--color-primary)' : i === step ? 'var(--color-primary)' : 'var(--border-color)',
                      color: i <= step ? 'white' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700
                    }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'uppercase' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ height: 2, background: i < step ? 'var(--color-primary)' : 'var(--border-color)', flex: 1, marginBottom: '1.2rem' }} />}
              </React.Fragment>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <form onSubmit={handleSubmit(onSubmit)}>

              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>1. Établissement concerné</h2>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={manualEstablishment}
                      onChange={(e) => {
                        setManualEstablishment(e.target.checked)
                        if (e.target.checked) setValue('establishment', '')
                        else { setManualEstName(''); setManualEstAddress('') }
                      }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Mon établissement n&apos;est pas dans la liste</span>
                  </label>
                  {manualEstablishment ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Nom de l&apos;établissement *</label>
                        <input
                          className="form-input"
                          value={manualEstName}
                          onChange={(e) => setManualEstName(e.target.value)}
                          placeholder="Ex. Centre de santé de..."
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Adresse / localisation (optionnel)</label>
                        <input
                          className="form-input"
                          value={manualEstAddress}
                          onChange={(e) => setManualEstAddress(e.target.value)}
                          placeholder="Quartier, commune..."
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Région</label>
                        <select className="form-select" value={selectedRegion} onChange={e => {
                          setSelectedRegion(e.target.value)
                          setValue('establishment', '')
                          setSelectedEst(null)
                        }}>
                          <option value="">Toutes les régions</option>
                          {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Établissement *</label>
                        <select className="form-select" {...register('establishment')}>
                          <option value="">Sélectionnez un établissement</option>
                          {establishments
                            .filter(e => !selectedRegion || String(e.region) === String(selectedRegion))
                            .map(e => <option key={e.id} value={e.id}>{e.name}</option>)
                          }
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="depot-service">Service concerné (optionnel)</label>
                        <select id="depot-service" className="form-select" disabled={!selectedEst} {...register('service')}>
                          <option value="">— Tout l&apos;établissement —</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>2. Type de plainte</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {categories.map(cat => (
                      <label key={cat.id} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                        padding: '1.5rem', borderRadius: '4px', cursor: 'pointer',
                        background: String(catId) === String(cat.id) ? 'var(--surface-container-low)' : 'var(--bg-card)',
                        border: String(catId) === String(cat.id) ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                        textAlign: 'center',
                      }}>
                        <input type="radio" value={cat.id} {...register('category', { required: 'Requis' })} style={{ display: 'none' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cleanCategoryLabel(cat)}</span>
                      </label>
                    ))}
                  </div>
                  {errors.category && <span className="form-error">{errors.category.message}</span>}
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>3. Description</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Choisissez <strong>une seule</strong> option : texte au clavier ou message vocal.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} role="group" aria-label="Mode de description">
                    <button
                      type="button"
                      className={`btn ${descriptionMode === 'text' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => switchDescriptionMode('text')}
                    >
                      Texte au clavier
                    </button>
                    <button
                      type="button"
                      className={`btn ${descriptionMode === 'voice' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => switchDescriptionMode('voice')}
                    >
                      Message vocal
                    </button>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Titre de la plainte *</label>
                    <input className="form-input" placeholder="Résumez votre plainte"
                      {...register('title', { required: 'Titre requis' })} />
                  </div>
                  {descriptionMode === 'text' ? (
                    <div className="form-group">
                      <label className="form-label">Détails *</label>
                      <textarea className="form-textarea" style={{ minHeight: 150 }}
                        placeholder="Expliquez ce qui s'est passé..."
                        {...register('description', { required: descriptionMode === 'text' ? 'Description requise' : false })} />
                      {errors.description && <span className="form-error">{errors.description.message}</span>}
                    </div>
                  ) : (
                    <div className="form-group">
                      <span className="form-label" id="vocal-record-label">Enregistrement vocal *</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Décrivez oralement votre plainte. Le texte détaillé n&apos;est pas nécessaire dans ce mode.
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                        {!recording ? (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={startRecording} aria-labelledby="vocal-record-label">
                            <FiMic aria-hidden /> Enregistrer
                          </button>
                        ) : (
                          <button type="button" className="btn btn-danger btn-sm" onClick={stopRecording}>
                            Arrêter l&apos;enregistrement
                          </button>
                        )}
                        {voiceBlob && (
                          <>
                            <audio controls src={voicePreviewUrl || undefined} style={{ maxWidth: '100%', flex: '1 1 200px' }}>
                              <track kind="captions" />
                            </audio>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={clearVoice} aria-label="Supprimer le message vocal">
                              <FiTrash2 aria-hidden /> Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label" htmlFor="depot-files">Pièces jointes (photos, PDF…)</label>
                    <input
                      id="depot-files"
                      type="file"
                      className="form-input"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      aria-describedby="depot-files-hint"
                    />
                    <p id="depot-files-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Jusqu&apos;à 5 fichiers, 4 Mo max chacun. Envoyés après validation de la plainte.
                    </p>
                    {files.length > 0 && (
                      <ul style={{ marginTop: '0.75rem', fontSize: '0.8rem', listStyle: 'none', padding: 0 }}>
                        {files.map((f, idx) => (
                          <li key={`${f.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <FiUpload aria-hidden />
                            {f.name}
                            <button type="button" className="btn btn-ghost btn-sm" aria-label={`Retirer ${f.name}`} onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}>
                              <FiX />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {isCallCenter ? '4. Coordonnées de l\'usager' : '4. Identité'}
                  </h2>
                  {isCallCenter ? (
                    <>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Renseignez le nom et le numéro de téléphone de l'usager qui appelle. Ces informations permettront de le recontacter.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input className="form-input" placeholder="Nom complet de l'usager *"
                          {...register('complainant_name', { required: 'Nom requis pour le call center' })} />
                        {errors.complainant_name && <span className="form-error">{errors.complainant_name.message}</span>}
                        <input className="form-input" placeholder="Téléphone de l'usager *"
                          {...register('complainant_phone', { required: 'Téléphone requis pour le call center' })} />
                        {errors.complainant_phone && <span className="form-error">{errors.complainant_phone.message}</span>}
                        <input className="form-input" placeholder="Email (optionnel)" {...register('complainant_email')} />
                      </div>
                    </>
                  ) : (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" {...register('is_anonymous')} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Déposer de façon anonyme</span>
                      </label>
                      {isAnonymous ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Votre identité reste confidentielle. Email et téléphone sont facultatifs.
                          </p>
                          <input
                            className="form-input"
                            placeholder="Email (optionnel)"
                            {...register('complainant_email')}
                          />
                          <input
                            className="form-input"
                            placeholder="Téléphone (optionnel)"
                            {...register('complainant_phone')}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {user?.role === 'USAGER' && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              Vos coordonnées sont préremplies depuis votre compte. Vous pouvez les modifier avant validation.
                            </p>
                          )}
                          <input className="form-input" placeholder="Nom complet *" {...register('complainant_name', { required: !isAnonymous ? 'Nom requis' : false })} />
                          {errors.complainant_name && <span className="form-error">{errors.complainant_name.message}</span>}
                          <input className="form-input" placeholder="Email (optionnel)" {...register('complainant_email')} />
                          <input className="form-input" placeholder="Téléphone (optionnel)" {...register('complainant_phone')} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>5. Confirmation</h2>
                  <div style={{ background: 'var(--bg-page)', padding: '1rem', borderRadius: '4px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.75rem' }}>Récapitulatif</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                      {[
                        { label: 'Établissement', value: manualEstablishment ? (manualEstName || '—') : (establishments.find(e => String(e.id) === String(watched?.[0]))?.name || '—') },
                        { label: 'Service', value: services.find(s => String(s.id) === String(watched?.[1]))?.name || '—' },
                        { label: 'Catégorie', value: categories.find(c => String(c.id) === String(watched?.[4] || watched?.[1]))?.display_name || categories.find(c => String(c.id) === String(watched?.[1]))?.display_name || '—' },
                        { label: 'Titre', value: String(watched?.[2] || '').trim() || '—' },
                        { label: 'Mode description', value: descriptionMode === 'voice' ? 'Message vocal' : 'Texte' },
                        { label: 'Pièces jointes', value: files.length ? `${files.length} fichier(s)` : 'Aucune' },
                        { label: 'Vocal', value: voiceBlob ? 'Oui' : 'Non' },
                        { label: 'Identité', value: isCallCenter ? 'Saisie call center' : (watched?.[4] ? 'Anonyme' : (String(watched?.[5] || '').trim() || '—')) },
                        { label: 'Email', value: String(watched?.[6] || '').trim() || '—' },
                        { label: 'Téléphone', value: String(watched?.[7] || '').trim() || '—' },
                      ].map((it, i) => (
                        <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{it.label}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'pre-wrap' }}>{it.value}</div>
                        </div>
                      ))}
                    </div>
                    {descriptionMode === 'text' && String(watched?.[3] || '').trim() && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Description</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{String(watched?.[3] || '').trim()}</div>
                      </div>
                    )}
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
                  <button type="button" className="btn btn-primary" onClick={goNextStep} style={{ marginLeft: 'auto' }} disabled={!canAdvanceStep()}>
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
