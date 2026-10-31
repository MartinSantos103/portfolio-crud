import { useState, useEffect } from 'react';
import { apiFetch } from '../../../services/api.js';
import {
  TECHNOLOGIES_COLLECTION,
  STACK_CATEGORIES,
  NAV_LINKS,
  PROFILE_DATA,
  ABOUT_DATA,
  TRAJECTORY_DATA,
  PROJECTS_DATA,
  SERVICES_DATA,
  CONTACT_DATA,
  FOOTER_DATA,
} from '../data/portfolioData.js';

/**
 * Hook que provee todos los datos del portfolio para los componentes públicos.
 * Intenta sincronizar con la API del backend si los endpoints ya están activos
 * y mantiene los datos estructurados del diseño como base.
 */
export function usePortfolioData() {
  const [technologies, setTechnologies] = useState(TECHNOLOGIES_COLLECTION);
  const [profile, setProfile] = useState(PROFILE_DATA);
  const [about, setAbout] = useState(ABOUT_DATA);
  const [trajectory, setTrajectory] = useState(TRAJECTORY_DATA);
  const [projectsSection, setProjectsSection] = useState(PROJECTS_DATA);
  const [servicesSection, setServicesSection] = useState(SERVICES_DATA);

  useEffect(() => {
    let isMounted = true;

    async function loadRemoteData() {
      const results = await Promise.allSettled([
        apiFetch('/profile'),
        apiFetch('/projects'),
        apiFetch('/services'),
      ]);

      if (!isMounted) return;

      const [profileRes, projectsRes, servicesRes] = results;

      if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
        const remoteProfile = profileRes.value.data;
        setProfile((prev) => ({
          ...prev,
          fullName: remoteProfile.full_name || prev.fullName,
          role: remoteProfile.headline || prev.role,
          photoUrl: remoteProfile.photo_url || prev.photoUrl,
          contactEmail: remoteProfile.contact_email || prev.contactEmail,
        }));
        if (Array.isArray(remoteProfile.skills) && remoteProfile.skills.length > 0) {
          setTechnologies(remoteProfile.skills);
        }
        if (Array.isArray(remoteProfile.experience) && remoteProfile.experience.length > 0) {
          setTrajectory((prev) => ({ ...prev, entries: remoteProfile.experience }));
        }
        if (remoteProfile.bio) {
          setAbout((prev) => ({
            ...prev,
            paragraphs: Array.isArray(remoteProfile.bio)
              ? remoteProfile.bio
              : prev.paragraphs,
          }));
        }
      }

      if (projectsRes.status === 'fulfilled') {
        const list = Array.isArray(projectsRes.value?.data)
          ? projectsRes.value.data
          : Array.isArray(projectsRes.value)
            ? projectsRes.value
            : null;
        if (list && list.length > 0) {
          setProjectsSection((prev) => ({
            ...prev,
            items: list.map((item, idx) => ({
              ...item,
              technologyIds: item.technologies || item.technologyIds || [],
              mockupVariant: item.mockupVariant || ['store', 'cards', 'chart'][idx % 3],
            })),
          }));
        }
      }

      if (servicesRes.status === 'fulfilled') {
        const list = Array.isArray(servicesRes.value?.data)
          ? servicesRes.value.data
          : Array.isArray(servicesRes.value)
            ? servicesRes.value
            : null;
        if (list && list.length > 0) {
          setServicesSection((prev) => ({
            ...prev,
            items: list.map((srv) => ({
              ...srv,
              items: Array.isArray(srv.items) ? srv.items : [],
            })),
          }));
        }
      }
    }

    loadRemoteData();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    navLinks: NAV_LINKS,
    technologies,
    stackCategories: STACK_CATEGORIES,
    profile,
    about,
    trajectory,
    projectsSection,
    servicesSection,
    contact: {
      ...CONTACT_DATA,
      email: profile.contactEmail || CONTACT_DATA.email,
      serviceOptions: servicesSection.items.map((s) => s.title),
    },
    footer: FOOTER_DATA,
  };
}
