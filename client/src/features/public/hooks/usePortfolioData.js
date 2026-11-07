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

const CACHE_KEY = 'pf_public_cache_v1';

export function getCachedPublicData() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error al leer caché del portfolio:', e);
    return null;
  }
}

export function setCachedPublicData(partialData) {
  if (typeof window === 'undefined') return;
  try {
    const current = getCachedPublicData() || {};
    const updated = {
      ...current,
      ...partialData,
      updatedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error al escribir caché del portfolio:', e);
  }
}

export function updatePortfolioProfileCache(remoteProfile) {
  if (!remoteProfile) return;
  const mapped = mapRemoteProfileToPublic(remoteProfile);
  setCachedPublicData({
    profile: mapped.profile,
    about: mapped.about,
    trajectory: mapped.trajectory,
    technologies: mapped.technologies,
  });
}

export function getCachedProfile() {
  const cached = getCachedPublicData();
  return cached?.profile || PROFILE_DATA;
}

function parseShortBioToTypewriter(rawShortBio, prevProfile = PROFILE_DATA) {
  const defaultPrefix = prevProfile.typewriterPrefix || 'Construyo aplicaciones web';
  const defaultWords = Array.isArray(prevProfile.typewriterWords) && prevProfile.typewriterWords.length > 0
    ? prevProfile.typewriterWords
    : ['rápidas', 'escalables', 'intuitivas', 'modernas'];

  if (!rawShortBio || typeof rawShortBio !== 'string' || !rawShortBio.trim()) {
    return { typewriterPrefix: defaultPrefix, typewriterWords: defaultWords };
  }

  const withoutTrailingDots = rawShortBio.trim().replace(/\.+$/, '').trim();
  const tokens = withoutTrailingDots.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    const lastWord = tokens.pop();
    const prefix = tokens.join(' ');
    return { typewriterPrefix: prefix, typewriterWords: [lastWord] };
  }

  return { typewriterPrefix: withoutTrailingDots, typewriterWords: defaultWords };
}

export function mapRemoteProfileToPublic(remoteProfile, prevProfile = PROFILE_DATA, prevAbout = ABOUT_DATA, prevTrajectory = TRAJECTORY_DATA) {
  if (!remoteProfile) {
    return {
      profile: prevProfile,
      about: prevAbout,
      trajectory: prevTrajectory,
      technologies: TECHNOLOGIES_COLLECTION,
    };
  }

  // Redes sociales (convierte objeto { github, linkedin, ... } o array a formato de lista pública)
  let socialLinks = prevProfile.socialLinks;
  if (Array.isArray(remoteProfile.social_links) && remoteProfile.social_links.length > 0) {
    socialLinks = remoteProfile.social_links.filter((s) => s?.url);
  } else if (remoteProfile.social_links && typeof remoteProfile.social_links === 'object') {
    const entries = Object.entries(remoteProfile.social_links).filter(
      ([, url]) => typeof url === 'string' && url.trim() !== ''
    );
    if (entries.length > 0) {
      socialLinks = entries.map(([key, url]) => ({
        id: key.toLowerCase(),
        name: key.charAt(0).toUpperCase() + key.slice(1),
        url,
        iconUrl: null,
      }));
    }
  }

  const cleanFullName =
    remoteProfile.full_name && remoteProfile.full_name !== 'Desarrollador Fullstack'
      ? remoteProfile.full_name
      : prevProfile.fullName;

  const cleanRole =
    remoteProfile.headline && remoteProfile.headline !== 'React & Node.js Developer'
      ? remoteProfile.headline
      : prevProfile.role;

  const { typewriterPrefix, typewriterWords } = parseShortBioToTypewriter(
    remoteProfile.short_bio,
    prevProfile
  );

  const nextProfile = {
    ...prevProfile,
    fullName: cleanFullName,
    role: cleanRole,
    shortDescription: remoteProfile.short_bio || prevProfile.shortDescription,
    typewriterPrefix,
    typewriterWords,
    photoUrl: remoteProfile.photo_url ?? prevProfile.photoUrl,
    contactEmail: remoteProfile.contact_email || prevProfile.contactEmail,
    cvUrl: (remoteProfile.cv_url && remoteProfile.cv_url !== '#descargar-cv') ? remoteProfile.cv_url : prevProfile.cvUrl,
    available: remoteProfile.available ?? prevProfile.available,
    location: remoteProfile.location || prevProfile.location,
    socialLinks,
  };

  // Biografía (separa por saltos de línea dobles)
  let paragraphs = prevAbout.paragraphs;
  if (typeof remoteProfile.bio === 'string' && remoteProfile.bio.trim()) {
    paragraphs = remoteProfile.bio
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  } else if (Array.isArray(remoteProfile.bio) && remoteProfile.bio.length > 0) {
    paragraphs = remoteProfile.bio;
  }

  const nextAbout = {
    ...prevAbout,
    paragraphs,
  };

  // Stack tecnológico
  const rawStack =
    Array.isArray(remoteProfile.stack) && remoteProfile.stack.length > 0
      ? remoteProfile.stack
      : Array.isArray(remoteProfile.skills) && remoteProfile.skills.length > 0
        ? remoteProfile.skills
        : null;

  const nextTechnologies = rawStack
    ? rawStack.map((item) => ({
        id: item.icon_key || item.id || String(item.name).toLowerCase(),
        name: item.name,
        category: item.category || 'frontend',
        icon_key: item.icon_key || item.id,
        iconUrl: item.iconUrl || null,
      }))
    : TECHNOLOGIES_COLLECTION;

  // Trayectoria (combina experiencia + educación)
  const expList = Array.isArray(remoteProfile.experience) ? remoteProfile.experience : [];
  const eduList = Array.isArray(remoteProfile.education) ? remoteProfile.education : [];
  const combinedEntries = [...expList, ...eduList].map((item, idx) => {
    const isEdu = item.type === 'educacion' || item.type === 'formacion';
    const endLabel = item.current ? 'Actualidad' : item.end_date || '';
    const dateLabel =
      item.date ||
      (item.start_date
        ? endLabel && endLabel !== item.start_date
          ? `${item.start_date} — ${endLabel}`
          : item.start_date
        : '');
    return {
      id: item.id || `item-${idx}`,
      type: isEdu ? 'formacion' : 'experiencia',
      typeLabel: isEdu ? 'FORMACIÓN' : 'EXPERIENCIA',
      title: item.title || '',
      place: item.organization || item.place || '',
      description: item.description || '',
      date: dateLabel,
    };
  });

  const nextTrajectory = {
    ...prevTrajectory,
    entries: combinedEntries.length > 0 ? combinedEntries : prevTrajectory.entries,
  };

  return {
    profile: nextProfile,
    about: nextAbout,
    trajectory: nextTrajectory,
    technologies: nextTechnologies,
  };
}

/**
 * Hook que provee todos los datos del portfolio para los componentes públicos.
 * Implementa caché local SWR (Stale-While-Revalidate) para que en recargas o
 * navegaciones los datos se muestren inmediatamente en el primer frame sin parpadeo.
 */
export function usePortfolioData() {
  const initialCache = getCachedPublicData();
  const hasCache = Boolean(initialCache && initialCache.profile);

  const [technologies, setTechnologies] = useState(
    () => initialCache?.technologies || TECHNOLOGIES_COLLECTION
  );
  const [profile, setProfile] = useState(
    () => initialCache?.profile || PROFILE_DATA
  );
  const [about, setAbout] = useState(
    () => initialCache?.about || ABOUT_DATA
  );
  const [trajectory, setTrajectory] = useState(
    () => initialCache?.trajectory || TRAJECTORY_DATA
  );
  const [projectsSection, setProjectsSection] = useState(
    () => initialCache?.projectsSection || PROJECTS_DATA
  );
  const [servicesSection, setServicesSection] = useState(
    () => initialCache?.servicesSection || SERVICES_DATA
  );
  const [isInitialLoading, setIsInitialLoading] = useState(!hasCache);

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
      const cacheUpdates = {};

      if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
        const mapped = mapRemoteProfileToPublic(profileRes.value.data);
        setProfile(mapped.profile);
        setAbout(mapped.about);
        setTrajectory(mapped.trajectory);
        setTechnologies(mapped.technologies);
        cacheUpdates.profile = mapped.profile;
        cacheUpdates.about = mapped.about;
        cacheUpdates.trajectory = mapped.trajectory;
        cacheUpdates.technologies = mapped.technologies;
      }

      if (projectsRes.status === 'fulfilled') {
        const list = Array.isArray(projectsRes.value?.data)
          ? projectsRes.value.data
          : Array.isArray(projectsRes.value)
            ? projectsRes.value
            : null;
        if (list && list.length > 0) {
          const nextProjectsSection = {
            ...PROJECTS_DATA,
            items: list.map((item, idx) => ({
              ...item,
              technologyIds: item.technologies || item.technologyIds || [],
              mockupVariant: item.mockupVariant || ['store', 'cards', 'chart'][idx % 3],
            })),
          };
          setProjectsSection(nextProjectsSection);
          cacheUpdates.projectsSection = nextProjectsSection;
        }
      }

      if (servicesRes.status === 'fulfilled') {
        const list = Array.isArray(servicesRes.value?.data)
          ? servicesRes.value.data
          : Array.isArray(servicesRes.value)
            ? servicesRes.value
            : null;
        if (list && list.length > 0) {
          const nextServicesSection = {
            ...SERVICES_DATA,
            items: list.map((srv) => ({
              ...srv,
              items: Array.isArray(srv.items) ? srv.items : [],
            })),
          };
          setServicesSection(nextServicesSection);
          cacheUpdates.servicesSection = nextServicesSection;
        }
      }

      if (Object.keys(cacheUpdates).length > 0) {
        setCachedPublicData(cacheUpdates);
      }

      setIsInitialLoading(false);
    }

    loadRemoteData();

    return () => {
      isMounted = false;
    };
  }, []);

  const dynamicCopyright = `© ${new Date().getFullYear()} ${profile.fullName || 'Lucas Andrade'}. Hecho con dedicación.`;

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
      serviceOptions: servicesSection.items.map((s) => ({ id: s.id, value: s.title, label: s.title })),
    },
    footer: {
      ...FOOTER_DATA,
      copyright: dynamicCopyright,
    },
    isInitialLoading,
  };
}
