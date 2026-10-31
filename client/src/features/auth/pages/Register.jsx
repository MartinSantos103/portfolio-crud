import { useNavigate } from 'react-router-dom';
import StarfieldCanvas from '../../../components/ui/StarfieldCanvas.jsx';
import Navbar from '../../../components/layout/Navbar.jsx';
import Footer from '../../../components/layout/Footer.jsx';
import AuthModal from './AuthModal.jsx';
import { NAV_LINKS, PROFILE_DATA, FOOTER_DATA } from '../../public/data/portfolioData.js';

/**
 * Vista dedicada para la ruta /registro.
 */
export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[var(--fondo)] text-[var(--texto)]">
      <StarfieldCanvas />
      <Navbar developerName={PROFILE_DATA.fullName} navLinks={NAV_LINKS} />
      <main className="relative z-10 flex min-h-[calc(100vh-140px)] items-center justify-center px-[24px] pt-[96px] pb-[48px]">
        <AuthModal
          isOpen={true}
          initialMode="register"
          contextMessage="Creá tu cuenta para acceder al detalle de los proyectos y ponerte en contacto."
          onClose={() => navigate('/')}
          onSuccess={() => navigate('/', { replace: true })}
        />
      </main>
      <Footer copyright={FOOTER_DATA.copyright} socialLinks={PROFILE_DATA.socialLinks} />
    </div>
  );
}
