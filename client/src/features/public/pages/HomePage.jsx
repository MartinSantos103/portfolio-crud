import { useState, useEffect } from 'react';
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
import { usePortfolioData } from '../hooks/usePortfolioData.js';
import { useAuth } from '../../auth/index.js';
import { apiFetch } from '../../../services/api.js';

/**
 * Página principal del Portfolio ("Landing — Oscuro").
 * Estructura vertical de 1440 px con orden:
 * Header, Inicio, Sobre mí, Trayectoria, Proyectos, Servicios, Contacto y Pie de página,
 * sobre una capa fija de estrellas en Canvas.
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
  } = usePortfolioData();

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalContext, setAuthModalContext] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    type: contact.consultationTypes?.[0]?.value || 'cotizacion',
    service: contact.defaultServiceOption || 'Sitios y landing pages',
    body: '',
  });
  const [contactSending, setContactSending] = useState(false);
  const [contactFeedback, setContactFeedback] = useState(null);

  // Al cargar y recargar, situarse siempre en Inicio (top: 0) y limpiar cualquier hash que fuerce el salto
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Solo si se accede expresamente a una ruta dedicada (/proyectos o /contacto)
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
    if (contactFeedback) setContactFeedback(null);
  };

  const sendContactMessage = async (authUser) => {
    const activeUser = authUser || user;
    const finalName = contactForm.name.trim() || activeUser?.name || '';
    const finalEmail = contactForm.email.trim() || activeUser?.email || '';

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
      const subject = `${contactForm.type.toUpperCase()} — ${contactForm.service}`;
      await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          type: contactForm.type,
          name: finalName,
          email: finalEmail,
          subject,
          body: contactForm.body.trim(),
          servicio_interes: contactForm.service,
        }),
      });
      setContactFeedback({
        type: 'success',
        message: '¡Mensaje enviado con éxito! Te responderé a la brevedad.',
      });
      setContactForm((prev) => ({ ...prev, body: '' }));
    } catch (err) {
      setContactFeedback({
        type: 'error',
        message:
          err.message || 'No se pudo enviar el mensaje. Intentá nuevamente.',
      });
    } finally {
      setContactSending(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactFeedback(null);

    if (!contactForm.body.trim()) {
      setContactFeedback({
        type: 'error',
        message: 'Por favor escribí tu mensaje antes de enviar.',
      });
      return;
    }

    if (!isAuthenticated) {
      setAuthModalMode('login');
      setAuthModalContext(
        'Iniciá sesión para completar el envío de tu mensaje. Lo que escribiste se conserva automáticamente.'
      );
      setPendingAction({ type: 'contact' });
      setAuthModalOpen(true);
      return;
    }

    await sendContactMessage(user);
  };

  const handleAuthSuccess = (loggedInUser) => {
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

  return (
    <div className="relative min-h-screen w-full bg-[var(--fondo)] text-[var(--texto)]">
      {/* Capa de estrellas fija detrás de todo el contenido */}
      <StarfieldCanvas />

      {/* Header fijo superpuesto */}
      <Navbar
        developerName={profile.fullName}
        navLinks={navLinks}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Columna principal de secciones */}
      <main className="relative z-10 flex flex-col">
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
          onFormChange={handleContactChange}
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
    </div>
  );
}
