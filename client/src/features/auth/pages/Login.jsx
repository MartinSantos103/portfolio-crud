import { useNavigate, useLocation } from 'react-router-dom';
import StarfieldCanvas from '../../../components/ui/StarfieldCanvas.jsx';
import Navbar from '../../../components/layout/Navbar.jsx';
import Footer from '../../../components/layout/Footer.jsx';
import AuthModal from './AuthModal.jsx';
import { NAV_LINKS, PROFILE_DATA, FOOTER_DATA } from '../../public/data/portfolioData.js';

/**
 * Vista dedicada para la ruta /login.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from?.pathname;

  return (
    <div className="relative min-h-screen bg-[var(--fondo)] text-[var(--texto)]">
      <StarfieldCanvas />
      <Navbar developerName={PROFILE_DATA.fullName} navLinks={NAV_LINKS} />
      <main className="relative z-10 flex min-h-[calc(100vh-140px)] items-center justify-center px-[24px] pt-[96px] pb-[48px]">
        <AuthModal
          isOpen={true}
          initialMode="login"
          contextMessage={
            fromPath
              ? `Iniciá sesión para continuar hacia ${fromPath}`
              : 'Ingresá con tu cuenta para ver detalles técnicos y demos de proyectos.'
          }
          onClose={() => navigate('/')}
          onSuccess={(user) => {
            if (fromPath) {
              navigate(fromPath, { replace: true });
            } else {
              navigate(user?.role === 'admin' ? '/admin' : '/', { replace: true });
            }
          }}
        />
      </main>
      <Footer copyright={FOOTER_DATA.copyright} socialLinks={PROFILE_DATA.socialLinks} />
    </div>
  );
}
