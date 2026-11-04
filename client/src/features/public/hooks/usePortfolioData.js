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

function parseShortBioToTypewriter(rawShortBio, prevProfile = PROFILE_DATA) {
  const defaultPrefix = prevProfile.typewriterPrefix || 'Construyo aplicaciones web';
  const defaultWords =
    Array.isArray(prevProfile.typewriterWords) && prevProfile.typewriterWords.length > 0
      ? prevProfile.typewriterWords
      : ['rápidas', 'escalables', 'intuitivas', 'modernas'];

  if (!rawShortBio || typeof rawShortBio !== 'string' || !rawShortBio.trim()) {
    return {
      typewriterPrefix: defaultPrefix,
      typewriterWords: defaultWords,
    };
  }

  const withoutTrailingDots = rawShortBio.trim().replace(/\.+$/, '').trim();
  const normalizedLower = withoutTrailingDots.toLowerCase();

  // Caso canónico de Lucas Andrade: preserva exactamente el prefijo y las 4 palabras animadas
  if (
    normalizedLower === 'construyo aplicaciones web rápidas, escalables, intuitivas y modernas' ||
    normalizedLower === 'construyo aplicaciones web rapidas, escalables, intuitivas y modernas'
  ) {
    return {
      typewriterPrefix: 'Construyo aplicaciones web',
      typewriterWords: ['rápidas', 'escalables', 'intuitivas', 'modernas'],
    };
  }

  // Si comienza con el prefijo base seguido de palabras separadas por comas o "y"
  if (normalizedLower.startsWith(defaultPrefix.toLowerCase() + ' ')) {
    const remainder = withoutTrailingDots.slice(defaultPrefix.length).trim();
    const parts = remainder
      .split(/\s*(?:,|\by\b|\be\b)\s*/i)
      .map((w) => w.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return {
        typewriterPrefix: defaultPrefix,
        typewriterWords: parts,
      };
    }
  }

  // Si el usuario escribió en /admin/perfil una frase con enumeración por comas (ej. "Creo plataformas veloces, seguras y modernas")
  if (withoutTrailingDots.includes(',')) {
    const commaSegments = withoutTrailingDots
      .split(/\s*(?:,|\by\b|\be\b)\s*/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (commaSegments.length >= 2) {
      const firstSegmentTokens = commaSegments[0].split(/\s+/);
      if (firstSegmentTokens.length >= 2) {
        const firstWord = firstSegmentTokens.pop();
        const prefix = firstSegmentTokens.join(' ');
        return {
          typewriterPrefix: prefix,
          typewriterWords: [firstWord, ...commaSegments.slice(1)],
        };
      }
    }
  }

  // Frase libre sin comas: resaltar la última palabra en color acento sin romper el bucle
  const tokens = withoutTrailingDots.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    const lastWord = tokens.pop();
    return {
      typewriterPrefix: tokens.join(' '),
      typewriterWords: [lastWord],
    };
  }

  return {
    typewriterPrefix: withoutTrailingDots,
    typewriterWords: defaultWords,
  };
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
    cvUrl: remoteProfile.cv_url || prevProfile.cvUrl,
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
        const mapped = mapRemoteProfileToPublic(profileRes.value.data);
        setProfile(mapped.profile);
        setAbout(mapped.about);
        setTrajectory(mapped.trajectory);
        setTechnologies(mapped.technologies);
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
