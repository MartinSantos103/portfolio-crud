import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import FormField from '../../../components/ui/FormField.jsx';

/**
 * Sección 05 / CONTACTO según el prototipo Portfolio_animado_v4.html + Ajuste 1:
 * - Dos columnas (texto y redes a la izquierda, formulario a la derecha) con los mismos campos del proyecto.
 * - Conserva el onSubmit y las validaciones actuales (también funciona Enter).
 * - El botón pasa a "Enviando…" al iniciar la petición real; pasa a "Mensaje enviado" con estrellas
 *   voladoras (.cf) DENTRO del botón SOLO si el servidor responde OK (feedback?.type === 'success').
 *   Si falla, muestra el error y vuelve el botón a su estado normal.
 */
export default function ContactSection({
  contact,
  socialLinks = [],
  user = null,
  isAuthenticated = false,
  formData,
  onFormChange,
  onSubmitForm,
  sending = false,
  feedback = null,
}) {
  const [copied, setCopied] = useState(false);
  const [sentVisual, setSentVisual] = useState(false);
  const [stars, setStars] = useState([]);
  const btnRef = useRef(null);
  const prevFeedbackRef = useRef(null);

  useEffect(() => {
    if (
      feedback?.type === 'success' &&
      prevFeedbackRef.current !== feedback
    ) {
      prevFeedbackRef.current = feedback;
      const btnEl = btnRef.current;
      const halfW = btnEl ? btnEl.offsetWidth / 2 : 180;
      const halfH = btnEl ? btnEl.offsetHeight / 2 : 29;

      const generated = Array.from({ length: 22 }, (_, i) => {
        const angle = Math.random() * 6.28;
        const k = 0.35 + Math.random() * 0.65;
        return {
          id: `${Date.now()}-${i}`,
          symbol: i % 3 ? '✦' : '★',
          dx: `${Math.cos(angle) * (halfW - 24) * k}px`,
          dy: `${Math.sin(angle) * (halfH - 10) * k}px`,
          fontSize: `${12 + Math.random() * 12}px`,
          color: i % 4 === 0 ? '#0a0c1b' : '#ffffff',
        };
      });

      const showTimer = setTimeout(() => {
        setSentVisual(true);
        setStars(generated);
      }, 0);

      const clearStarsTimer = setTimeout(() => {
        setStars([]);
      }, 1500);

      const resetBtnTimer = setTimeout(() => {
        setSentVisual(false);
      }, 3000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(clearStarsTimer);
        clearTimeout(resetBtnTimer);
      };
    }

    if (feedback?.type === 'error') {
      prevFeedbackRef.current = feedback;
      const errTimer = setTimeout(() => {
        setSentVisual(false);
        setStars([]);
      }, 0);
      return () => clearTimeout(errTimer);
    }

    if (!feedback) {
      prevFeedbackRef.current = null;
    }
  }, [feedback]);

  const serviceOptions =
    contact.serviceOptions?.length > 0
      ? contact.serviceOptions
      : [
          'Sitios y landing pages',
          'Aplicaciones web a medida',
          'APIs y backend',
        ];

  const displayName =
    formData.name !== '' ? formData.name : isAuthenticated ? user?.name || '' : '';
  const displayEmail =
    formData.email !== ''
      ? formData.email
      : isAuthenticated
        ? user?.email || ''
        : '';

  const handleCopyEmail = async () => {
    const emailToCopy = contact.email || 'martinsantos4890@gmail.com';
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(emailToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = emailToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('No se pudo copiar el correo al portapapeles:', err);
    }
  };

  return (
    <section id="contacto" className="relative z-10 w-full py-[72px] lg:py-[90px]">
      <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 items-start gap-[40px] px-[20px] lg:grid-cols-2 lg:gap-[56px]">
        {/* Columna izquierda (.ct-l) */}
        <div className="flex flex-col items-start lg:sticky lg:top-[110px]">
          <p className="ey">{contact.sectionLabel}</p>

          <h2 className="mt-[14px] mb-[24px] font-heading text-[clamp(32px,5.5vw,68px)] font-bold leading-[1.02] tracking-[-0.02em] text-[var(--tx)]">
            {contact.titleLines?.[0] || '¿Tenés una idea?'}
            <br />
            {contact.titleLines?.[1] || 'Hablemos.'}
          </h2>

          <p className="font-sans-ui max-w-[34ch] text-[18px] leading-[1.6] text-[var(--mut)]">
            {contact.description}
          </p>

          {/* Fila de redes sociales (.soc) */}
          <div className="mt-[32px] flex flex-wrap items-center gap-[10px]">
            <div className="relative">
              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label="Copiar correo electrónico del desarrollador"
                title={copied ? '¡Correo copiado!' : 'Copiar correo electrónico'}
                className={`grid h-[54px] w-[54px] cursor-pointer place-items-center rounded-[14px] border transition-all duration-300 hover:-translate-y-[6px] ${
                  copied
                    ? 'border-[var(--ok)] bg-[rgba(52,211,153,0.14)] text-[var(--ok)]'
                    : 'border-[var(--bd)] bg-[var(--card)] text-[var(--tx)] hover:border-[var(--ac)]'
                }`}
              >
                {copied ? (
                  <Check size={20} className="text-[var(--ok)]" />
                ) : (
                  <IconSlot size={20} name="contact-mail" />
                )}
              </button>

              {copied && (
                <span
                  role="status"
                  className="font-mono-ui pointer-events-none absolute -top-[34px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[8px] border border-[var(--bd)] bg-[var(--bg2)] px-[8px] py-[3px] text-[11px] font-medium text-[var(--ok)] shadow-lg"
                >
                  ¡Copiado!
                </span>
              )}
            </div>

            {socialLinks.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
                title={social.name}
                className="grid h-[54px] w-[54px] place-items-center rounded-[14px] border border-[var(--bd)] bg-[var(--card)] text-[var(--tx)] transition-all duration-300 hover:-translate-y-[6px] hover:border-[var(--ac)]"
              >
                <IconSlot
                  size={20}
                  name={`contact-${social.id}`}
                  iconUrl={social.iconUrl}
                />
              </a>
            ))}
          </div>
        </div>

        {/* Columna derecha: Formulario (.card) */}
        <form
          id="fm"
          onSubmit={onSubmitForm}
          noValidate
          data-interactive-card="true"
          className="card flex w-full flex-col gap-[20px] rounded-[24px] p-[22px] sm:p-[32px]"
        >
          <FormField
            as="input"
            label="Nombre"
            name="name"
            value={displayName}
            onChange={onFormChange}
            placeholder="Tu nombre"
            required
          />

          <FormField
            as="input"
            type="email"
            label="Email"
            name="email"
            value={displayEmail}
            onChange={onFormChange}
            placeholder="tu@email.com"
            required
          />

          {/* Tipo de consulta */}
          <FormField
            as="select"
            label="Tipo de consulta"
            name="type"
            value={formData.type}
            onChange={onFormChange}
            options={
              contact.consultationTypes || [
                { value: 'cotizacion', label: 'Cotización' },
                { value: 'consulta', label: 'Consulta general' },
                { value: 'asesoria', label: 'Asesoría técnica' },
              ]
            }
          />

          {/* Campos dinámicos según el tipo de consulta seleccionado */}
          {formData.type === 'cotizacion' && (
            <>
              <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                <FormField
                  as="select"
                  label="Servicio de interés"
                  name="service"
                  value={formData.service}
                  onChange={onFormChange}
                  options={serviceOptions}
                />
                <FormField
                  as="select"
                  label="Presupuesto estimado"
                  name="presupuesto"
                  value={formData.presupuesto || '< $1.000 USD'}
                  onChange={onFormChange}
                  options={[
                    { value: '< $1.000 USD', label: 'Menos de $1.000 USD' },
                    { value: '$1.000 - $3.000 USD', label: '$1.000 - $3.000 USD' },
                    { value: '$3.000 - $5.000 USD', label: '$3.000 - $5.000 USD' },
                    { value: '> $5.000 USD', label: 'Más de $5.000 USD' },
                    { value: 'A definir', label: 'A definir / A conversar' },
                  ]}
                />
              </div>
              <FormField
                as="select"
                label="Plazo deseado"
                name="plazo"
                value={formData.plazo || '1 a 2 meses'}
                onChange={onFormChange}
                options={[
                  { value: 'Urgente (< 2 semanas)', label: 'Urgente (< 2 semanas)' },
                  { value: '1 mes', label: 'Aprox. 1 mes' },
                  { value: '1 a 2 meses', label: '1 a 2 meses' },
                  { value: '2 a 3 meses', label: '2 a 3 meses' },
                  { value: 'Flexible', label: 'Flexible / Sin apuro' },
                ]}
              />
            </>
          )}

          {formData.type === 'asesoria' && (
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <FormField
                as="select"
                label="Tema técnico"
                name="tema_tecnico"
                value={formData.tema_tecnico || 'Arquitectura Frontend & React'}
                onChange={onFormChange}
                options={[
                  { value: 'Arquitectura Frontend & React', label: 'Arquitectura Frontend & React' },
                  { value: 'APIs REST & Backend Node.js', label: 'APIs REST & Backend Node.js' },
                  { value: 'Bases de Datos & PostgreSQL', label: 'Bases de Datos & PostgreSQL' },
                  { value: 'Code Review & Optimización', label: 'Code Review & Optimización' },
                  { value: 'Despliegue & DevOps', label: 'Despliegue & DevOps' },
                  { value: 'Otro tema técnico', label: 'Otro tema técnico' },
                ]}
              />
              <FormField
                as="select"
                label="Modalidad deseada"
                name="modalidad"
                value={formData.modalidad || 'Sesión puntual (1h)'}
                onChange={onFormChange}
                options={[
                  { value: 'Sesión puntual (1h)', label: 'Sesión 1 a 1 puntual (1 hora)' },
                  { value: 'Acompañamiento semanal', label: 'Acompañamiento semanal' },
                  { value: 'Auditoría de código', label: 'Auditoría de código' },
                  { value: 'A coordinar', label: 'A coordinar' },
                ]}
              />
            </div>
          )}

          {formData.type === 'consulta' && (
            <FormField
              as="input"
              label="Asunto de la consulta"
              name="asunto"
              value={formData.asunto || ''}
              onChange={onFormChange}
              placeholder="Ej: Propuesta laboral, charla técnica o consulta general..."
            />
          )}

          <FormField
            as="textarea"
            label="Mensaje"
            name="body"
            value={formData.body}
            onChange={onFormChange}
            placeholder={
              formData.type === 'cotizacion'
                ? 'Contame sobre los objetivos, alcance y funcionalidades requeridas...'
                : formData.type === 'asesoria'
                  ? 'Describí brevemente sobre qué tecnología, problema o proyecto te gustaría que trabajemos...'
                  : 'Contame brevemente qué necesitás o en qué te puedo ayudar…'
            }
            required
            rows={4}
          />

          {feedback && (
            <div
              role="status"
              style={
                feedback.type === 'success'
                  ? {
                      borderColor: 'color-mix(in srgb, var(--ok) 40%, transparent)',
                      backgroundColor: 'color-mix(in srgb, var(--ok) 12%, transparent)',
                      color: 'var(--ok)',
                    }
                  : {
                      borderColor: 'color-mix(in srgb, var(--bad) 40%, transparent)',
                      backgroundColor: 'color-mix(in srgb, var(--bad) 12%, transparent)',
                      color: 'var(--bad)',
                    }
              }
              className="font-sans-ui rounded-[12px] border px-[14px] py-[10px] text-[13.5px]"
            >
              {feedback.message}
            </div>
          )}

          {/* Botón de envío con estados Enviando… / Mensaje enviado + estrellas (.cf) */}
          <button
            ref={btnRef}
            id="sd"
            type="submit"
            disabled={sending}
            className="btn p h-[58px] w-full rounded-[14px] text-[17px] font-semibold"
          >
            {sending ? (
              <>
                <i className="sp" aria-hidden="true" />
                <span>Enviando…</span>
              </>
            ) : sentVisual ? (
              <>
                <svg
                  className="ok"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M5 13l4 4 10-10" />
                </svg>
                <span>Mensaje enviado</span>
              </>
            ) : (
              <>
                <span>{contact.submitLabel || 'Enviar mensaje'}</span>
                <IconSlot size={16} name="send-arrow-right" />
              </>
            )}

            {stars.map((s) => (
              <span
                key={s.id}
                aria-hidden="true"
                className="cf"
                style={{
                  '--dx': s.dx,
                  '--dy': s.dy,
                  fontSize: s.fontSize,
                  color: s.color,
                }}
              >
                {s.symbol}
              </span>
            ))}
          </button>

          {/* Aviso de sesión / privacidad */}
          <p className="flex items-center gap-[8px] font-sans-ui text-[13px] text-[var(--mut)]">
            <IconSlot
              size={14}
              name={isAuthenticated ? 'check' : 'contact-lock'}
            />
            <span>
              {isAuthenticated
                ? `Sesión iniciada: tu mensaje queda vinculado a tu cuenta (${user?.email})`
                : (contact.authNotice ||
                    'Mensaje directo a mi casilla de correo (o iniciá sesión si querés vincular tu cuenta)')}
            </span>
          </p>
        </form>
      </div>
    </section>
  );
}
