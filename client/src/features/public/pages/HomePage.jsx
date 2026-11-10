import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StarfieldCanvas from '../../../components/ui/StarfieldCanvas.jsx';
import Navbar from '../../../components/layout/Navbar.jsx';
import Footer from '../../../components/layout/Footer.jsx';
import HeroSection from '../components/HeroSection.jsx';
import AboutSection from '../components/AboutSection.jsx';
import TrajectorySection from '../components/TrajectorySection.jsx';
import ProjectsSection from '../components/ProjectsSection.jsx';
import ServicesSection from '../components/ServicesSection.jsx';
import ContactSection from '../components/ContactSection.jsx';
import AuthModal from '../../auth/pages/AuthModal.jsx';
import SuspendedAccountModal from '../../../components/ui/SuspendedAccountModal.jsx';
import { usePortfolioData } from '../hooks/usePortfolioData.js';
import { useAuth } from '../../auth/index.js';
import { apiFetch } from '../../../services/api.js';
import { trackPortfolioEvent } from '../../../services/analytics.js';

const SECTION_DOTS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'sobre-mi', label: 'Sobre mí' },
  { id: 'trayectoria', label: 'Trayectoria' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'contacto', label: 'Contacto' },
];

/**
 * Página principal del Portfolio según el prototipo Portfolio_animado_v4.html:
 * - Incluye barra de progreso superior (#prog), puntos laterales de navegación (.dots)
 *   y las 6 secciones públicas.
 * - Conserva intacta toda la lógica de negocio, llamadas a la API, rutas y validaciones.
 */
export default function HomePage({ initialSection = null }) {
  const {
    navLinks,
    technologies,
    stackCategories,
    profile,
    about,
    trajectory,
    projectsSection,
    servicesSection,
    contact,
    footer,
    isInitialLoading,
  } = usePortfolioData();

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalContext, setAuthModalContext] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const progRef = useRef(null);

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    type: contact.consultationTypes?.[0]?.value || 'cotizacion',
    service: contact.defaultServiceOption || 'Sitios y landing pages',
    presupuesto: '',
    plazo: '1 a 2 meses',
    tema_tecnico: '',
    asunto: '',
    body: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [contactSending, setContactSending] = useState(false);
  const [contactFeedback, setContactFeedback] = useState(null);
  const [suspendedMailModal, setSuspendedMailModal] = useState({
    open: false,
    email: '',
    message: '',
  });

  useEffect(() => {
    if (profile?.fullName) {
      const roleSuffix = profile.role ? ` - ${profile.role}` : '';
      document.title = `${profile.fullName}${roleSuffix}`;
    }
  }, [profile?.fullName, profile?.role]);

  useEffect(() => {
    trackPortfolioEvent({ type: 'visit', path: window.location.pathname || '/' });
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const docEl = document.documentElement;
      const totalScroll = Math.max(docEl.scrollHeight - window.innerHeight, 1);
      const pct = Math.min(100, Math.max(0, (window.scrollY / totalScroll) * 100));
      if (progRef.current) {
        progRef.current.style.width = `${pct}%`;
      }

      let currentIdx = 0;
      SECTION_DOTS.forEach((sec, idx) => {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.45) {
            currentIdx = idx;
          }
        }
      });
      if (window.innerHeight + window.scrollY >= docEl.scrollHeight - 8) {
        currentIdx = SECTION_DOTS.length - 1;
      }
      setActiveSectionIdx(currentIdx);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (initialSection && initialSection !== 'inicio' && initialSection !== 'sobre-mi') {
      const timer = setTimeout(() => {
        const el = document.getElementById(initialSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSection]);

  const handleOpenAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalContext('');
    setPendingAction(null);
    setAuthModalOpen(true);
  };

  const handleSelectProject = (project) => {
    if (isAuthenticated) {
      navigate(`/proyectos/${project.id}`);
    } else {
      setAuthModalMode('login');
      setAuthModalContext(
        `Iniciá sesión para acceder al detalle técnico y las demos de "${project.title}".`
      );
      setPendingAction({ type: 'project', projectId: project.id });
      setAuthModalOpen(true);
    }
  };

  const handleRequestQuote = (service) => {
    setContactForm((prev) => ({
      ...prev,
      type: 'cotizacion',
      service: service.title,
    }));
    const contactEl = document.getElementById('contacto');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (contactFeedback) setContactFeedback(null);
  };

  const formatDigitsWithThousandSeparators = (val) => {
    const rawDigits = String(val || '').replace(/\D/g, '');
    if (!rawDigits) return '';
    return rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePresupuestoChange = (e) => {
    const formatted = formatDigitsWithThousandSeparators(e.target.value);
    setContactForm((prev) => ({ ...prev, presupuesto: formatted }));
    if (formErrors.presupuesto) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.presupuesto;
        return next;
      });
    }
    if (contactFeedback) setContactFeedback(null);
  };

  const handleFileAttachAttempt = () => {
    setContactFeedback({
      type: 'error',
      message:
        'Por razones de seguridad no se admiten archivos adjuntos directos. Podés compartir enlaces (Google Drive, Dropbox, GitHub, Figma, etc.) en el cuerpo del mensaje.',
    });
  };

  const sendContactMessage = async (authUser) => {
    const activeUser = authUser || user;
    const finalName = (isAuthenticated ? activeUser?.name : contactForm.name)?.trim() || '';
    const finalEmail = (isAuthenticated ? activeUser?.email : contactForm.email)?.trim() || '';

    if (!finalName || !finalEmail) {
      setContactFeedback({
        type: 'error',
        message: 'Completá tu nombre y correo electrónico.',
      });
      return;
    }

    setContactSending(true);
    setContactFeedback(null);
    try {
      const subject =
        contactForm.type === 'cotizacion'
          ? `COTIZACIÓN — ${contactForm.service || 'Servicio'}`
          : contactForm.type === 'asesoria'
            ? `ASESORÍA — ${contactForm.tema_tecnico?.trim() || 'Técnica'}`
            : `CONSULTA — ${contactForm.asunto?.trim() || 'Consulta general'}`;

      const payload = {
        type: contactForm.type,
        name: finalName,
        email: finalEmail,
        subject,
        body: contactForm.body.trim(),
        ...(contactForm.type === 'cotizacion' && {
          servicio_interes: contactForm.service,
          tipo_proyecto: contactForm.service,
          presupuesto: contactForm.presupuesto ? `$ ${contactForm.presupuesto.trim()}` : '',
          plazo: contactForm.plazo,
        }),
        ...(contactForm.type === 'asesoria' && {
          tema_tecnico: contactForm.tema_tecnico?.trim(),
        }),
        ...(contactForm.type === 'consulta' && {
          asunto_consulta: contactForm.asunto?.trim(),
        }),
      };

      await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setContactFeedback({
        type: 'success',
        message: '¡Mensaje enviado con éxito! Te responderé a la brevedad.',
      });
      setFormErrors({});
      setContactForm((prev) => ({
        ...prev,
        asunto: '',
        tema_tecnico: '',
        presupuesto: '',
        body: '',
      }));
    } catch (err) {
      if (
        err.code === 'ACCOUNT_SUSPENDED' ||
        err.code === 'ACCOUNT_DISABLED' ||
        err.status === 403
      ) {
        setSuspendedMailModal({
          open: true,
          email: finalEmail,
          message:
            err.message ||
            'Tu cuenta se encuentra suspendida. El correo del emisario no es válido para enviar mensajes a través del programa.',
        });
        setContactFeedback({
          type: 'error',
          message:
            'No es posible enviar el correo: la cuenta asociada al emisario se encuentra suspendida.',
        });
      } else {
        setContactFeedback({
          type: 'error',
          message:
            err.message || 'No se pudo enviar el mensaje. Intentá nuevamente.',
        });
      }
    } finally {
      setContactSending(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactFeedback(null);

    const finalName = (isAuthenticated ? user?.name : contactForm.name)?.trim() || '';
    const finalEmail = (isAuthenticated ? user?.email : contactForm.email)?.trim() || '';
    const newErrors = {};

    // 1. Nombre
    if (!finalName) {
      newErrors.name = 'Por favor completá tu nombre.';
    } else if (finalName.length < 2) {
      newErrors.name = 'El nombre debe contener al menos 2 caracteres.';
    }

    // 2. Email
    if (!finalEmail) {
      newErrors.email = 'Por favor completá tu correo electrónico.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalEmail)) {
        newErrors.email = 'El formato del correo electrónico es inválido.';
      }
    }

    // 3. Específicos por tipo de consulta
    if (contactForm.type === 'cotizacion') {
      const rawPresupuesto = (contactForm.presupuesto || '').replace(/\D/g, '');
      if (!rawPresupuesto) {
        newErrors.presupuesto = 'Por favor ingresá un presupuesto estimado (solo números).';
      } else if (Number(rawPresupuesto) <= 0) {
        newErrors.presupuesto = 'El presupuesto debe ser un monto mayor a 0.';
      }
    } else if (contactForm.type === 'asesoria') {
      const tema = (contactForm.tema_tecnico || '').trim();
      if (!tema) {
        newErrors.tema_tecnico = 'Por favor completá el tema técnico.';
      } else if (tema.length < 3) {
        newErrors.tema_tecnico = 'El tema técnico debe contener al menos 3 caracteres.';
      }
    } else if (contactForm.type === 'consulta') {
      const asunto = (contactForm.asunto || '').trim();
      if (!asunto) {
        newErrors.asunto = 'Por favor ingresá el asunto de la consulta.';
      } else if (asunto.length < 3) {
        newErrors.asunto = 'El asunto debe tener al menos 3 caracteres.';
      }
    }

    // 4. Mensaje
    const bodyTrim = (contactForm.body || '').trim();
    if (!bodyTrim) {
      newErrors.body = 'Por favor escribí tu mensaje.';
    } else if (bodyTrim.length < 10) {
      newErrors.body = 'El mensaje debe tener al menos 10 caracteres.';
    } else if (bodyTrim.length > 2000) {
      newErrors.body = 'El mensaje no puede superar los 2000 caracteres.';
    }

    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    await sendContactMessage(user);
  };

  const handleAuthSuccess = (loggedInUser) => {
    if (loggedInUser?.role === 'admin') {
      navigate('/admin');
      return;
    }

    if (pendingAction?.type === 'project' && pendingAction.projectId) {
      const targetProjectId = pendingAction.projectId;
      setPendingAction(null);
      navigate(`/proyectos/${targetProjectId}`);
      return;
    }

    if (pendingAction?.type === 'contact') {
      setPendingAction(null);
      sendContactMessage(loggedInUser);
    }
  };

  const scrollToSection = (sectionId) => {
    if (sectionId === 'inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isInitialLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[var(--bg)] text-[var(--tx)]">
        <StarfieldCanvas />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--bd)] border-t-[var(--ac)]" />
          <p className="font-mono-ui text-sm text-[var(--mut)]">Cargando portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[var(--bg)] text-[var(--tx)]">
      {/* Capa de estrellas fija detrás de todo el contenido */}
      <StarfieldCanvas />

      {/* Barra de progreso superior (#prog) */}
      <div id="prog" ref={progRef} aria-hidden="true" />

      {/* Header fijo superpuesto */}
      <Navbar
        developerName={profile.fullName}
        navLinks={navLinks}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Puntos laterales de sección (.dots) */}
      <div className="dots" aria-label="Secciones de la página">
        {SECTION_DOTS.map((sec, idx) => (
          <button
            key={sec.id}
            type="button"
            aria-label={sec.label}
            title={sec.label}
            onClick={() => scrollToSection(sec.id)}
            className={activeSectionIdx === idx ? 'on' : ''}
          />
        ))}
      </div>

      {/* Columna principal de secciones */}
      <main id="home-content" className="relative z-10 flex flex-col">
        <HeroSection profile={profile} />

        <AboutSection
          about={about}
          technologies={technologies}
          stackCategories={stackCategories}
        />

        <TrajectorySection trajectory={trajectory} />

        <ProjectsSection
          projectsSection={projectsSection}
          technologies={technologies}
          isAuthenticated={isAuthenticated}
          onSelectProject={handleSelectProject}
        />

        <ServicesSection
          servicesSection={servicesSection}
          onRequestQuote={handleRequestQuote}
        />

        <ContactSection
          contact={contact}
          socialLinks={profile.socialLinks}
          user={user}
          isAuthenticated={isAuthenticated}
          formData={contactForm}
          errors={formErrors}
          onFormChange={handleContactChange}
          onPresupuestoChange={handlePresupuestoChange}
          onFileAttachAttempt={handleFileAttachAttempt}
          onSubmitForm={handleContactSubmit}
          sending={contactSending}
          feedback={contactFeedback}
        />
      </main>

      {/* Pie de página */}
      <Footer copyright={footer.copyright} socialLinks={profile.socialLinks} />

      {/* Ventana emergente de Login / Registro */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        contextMessage={authModalContext}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Ventana emergente de cuenta suspendida al enviar correo */}
      <SuspendedAccountModal
        isOpen={suspendedMailModal.open}
        email={suspendedMailModal.email}
        context="mail"
        customMessage={suspendedMailModal.message}
        onClose={() =>
          setSuspendedMailModal((prev) => ({ ...prev, open: false }))
        }
      />
    </div>
  );
}
