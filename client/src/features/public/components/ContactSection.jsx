import { useState } from 'react';
import { Check } from 'lucide-react';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';

/**
 * Sección 05 / CONTACTO.
 * - Una sola fila de dos bloques separados 80 px, alineados arriba (apilados debajo de 1024px).
 * - Izquierda (columna flexible con 24 px entre elementos):
 *   - Etiqueta 05 / CONTACTO (JetBrains Mono 500, 13 px, 2 px, --acento)
 *   - Título de dos líneas (Space Grotesk 700, 60 px, interlineado 64 px, -1.2 px)
 *   - Párrafo (Inter 400, 18 px, interlineado 28 px, --texto-suave)
 *   - Fila de botones cuadrados de 44 px con borde 1 px y radio 12 px para Correo (con copiado al portapapeles),
 *     GitHub y LinkedIn, con iconos de 20 px y 12 px entre botones.
 * - Derecha (formulario):
 *   - 520 px de ancho, padding 32 px, 18 px entre elementos, radio 20 px, fondo --superficie, borde 1 px --borde.
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
        // Fallback para entornos donde Clipboard API no esté disponible
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
    <section id="contacto" className="relative z-10 w-full py-[80px] lg:py-[110px]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-[48px] px-[24px] sm:px-[64px] lg:flex-row lg:gap-[80px] xl:px-[160px]">
        {/* Columna izquierda flexible con 24 px entre elementos */}
        <div className="flex flex-1 flex-col items-start gap-[24px]">
          <span className="font-mono-ui text-[13px] font-medium uppercase tracking-[2px] text-[var(--acento)]">
            {contact.sectionLabel}
          </span>

          <h2 className="font-heading text-[40px] font-bold leading-[1.08] tracking-[-1.2px] text-[var(--texto)] sm:text-[52px] lg:text-[60px] lg:leading-[64px]">
            {contact.titleLines?.[0] || '¿Tenés una idea?'}
            <br />
            {contact.titleLines?.[1] || 'Hablemos.'}
          </h2>

          <p className="font-sans-ui max-w-[480px] text-[18px] font-normal leading-[28px] text-[var(--texto-suave)]">
            {contact.description}
          </p>

          {/* Fila de botones de contacto: Correo (copiar al portapapeles), GitHub y LinkedIn */}
          <div className="flex items-center gap-[12px]">
            {/* Botón con icono de correo que copia el correo del dueño del repo */}
            <div className="relative">
              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label="Copiar correo electrónico del desarrollador"
                title={copied ? '¡Correo copiado!' : 'Copiar correo electrónico'}
                className={`flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[12px] border transition-all duration-150 ${
                  copied
                    ? 'border-[var(--disponible)] bg-[var(--disponible)]/15 text-[var(--disponible)]'
                    : 'border-[var(--borde)] bg-[var(--superficie)] text-[var(--texto-suave)] hover:border-[var(--acento)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)]'
                }`}
              >
                {copied ? (
                  <Check size={20} className="text-[var(--disponible)]" />
                ) : (
                  <IconSlot size={20} name="contact-mail" />
                )}
              </button>

              {/* Aviso flotante de confirmación */}
              {copied && (
                <span
                  role="status"
                  className="font-mono-ui pointer-events-none absolute -top-[34px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[8px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-[8px] py-[3px] text-[11px] font-medium text-[var(--disponible)] shadow-lg"
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
                className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] border border-[var(--borde)] bg-[var(--superficie)] text-[var(--texto-suave)] transition-colors duration-150 hover:border-[var(--acento)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)]"
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

        {/* Columna derecha: formulario de 520 px de ancho, padding 32 px y 18 px entre elementos */}
        <form
          onSubmit={onSubmitForm}
          noValidate
          data-interactive-card="true"
          className="flex w-full shrink-0 flex-col gap-[18px] rounded-[20px] border border-[var(--borde)] bg-[var(--superficie)] p-[24px] sm:p-[32px] lg:w-[520px]"
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

          {/* Fila de dos selectores con 16 px de separación */}
          <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
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
                  { value: 'asesoria', label: 'Asesoría' },
                ]
              }
            />

            <FormField
              as="select"
              label="Servicio de interés"
              name="service"
              value={formData.service}
              onChange={onFormChange}
              options={serviceOptions}
            />
          </div>

          <FormField
            as="textarea"
            label="Mensaje"
            name="body"
            value={formData.body}
            onChange={onFormChange}
            placeholder="Contame brevemente qué necesitás..."
            required
          />

          {feedback && (
            <div
              role="status"
              className={`font-sans-ui rounded-[12px] border px-[14px] py-[10px] text-[13px] ${
                feedback.type === 'success'
                  ? 'border-[var(--disponible)]/40 bg-[var(--disponible)]/10 text-[var(--disponible)]'
                  : 'border-red-400/40 bg-red-500/10 text-red-300'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth disabled={sending}>
            <span>{sending ? 'Enviando...' : contact.submitLabel}</span>
            <IconSlot size={18} name="send-arrow-right" />
          </Button>

          {/* Línea con candado de 14 px y aviso de inicio de sesión */}
          <div className="flex items-center gap-[8px] text-[var(--texto-suave)]">
            <IconSlot size={14} name="contact-lock" />
            <span className="font-sans-ui text-[13px] font-normal text-[var(--texto-suave)]">
              {isAuthenticated
                ? `Enviando con sesión activa (${user?.email})`
                : (contact.authNotice || 'Mensaje directo a mi casilla de correo (o iniciá sesión si querés vincular tu cuenta)')}
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}
