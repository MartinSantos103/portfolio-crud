import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  User,
  Cpu,
  GraduationCap,
  Share2,
} from "lucide-react";
import { apiFetch } from "../../../services/api.js";
import { useToast } from "../../../components/ui/Toast.jsx";
import DataState from "../../../components/ui/DataState.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import IconPicker from "../../../components/ui/IconPicker.jsx";
import ImageUploader from "../../../components/uploader/ImageUploader.jsx";
import DevIcon from "../../../components/ui/DevIcon.jsx";
import LivePreviewLayout from "../components/LivePreviewLayout.jsx";
import {
  useUnsavedChanges,
  UnsavedChangesModal,
} from "../hooks/useUnsavedChanges.jsx";
import HeroSection from "../../public/components/HeroSection.jsx";
import AboutSection from "../../public/components/AboutSection.jsx";
import TrajectorySection from "../../public/components/TrajectorySection.jsx";
import { mapRemoteProfileToPublic } from "../../public/hooks/usePortfolioData.js";
import { STACK_CATEGORIES } from "../../public/data/portfolioData.js";

const stackItemSchema = z.object({
  id: z.string().trim().min(1, "ID requerido"),
  name: z
    .string()
    .trim()
    .min(1, "El nombre de la tecnología es obligatorio")
    .max(80),
  category: z.enum(["frontend", "backend", "database", "tools"]),
  icon_key: z.string().trim().min(1, "Seleccioná un ícono del catálogo"),
});

const milestoneSchema = z.object({
  id: z.string().trim().min(1),
  type: z.enum(["experiencia", "educacion"]),
  title: z.string().trim().min(1, "El rol o título es obligatorio").max(140),
  organization: z
    .string()
    .trim()
    .min(1, "La organización o institución es obligatoria")
    .max(140),
  start_date: z
    .string()
    .trim()
    .min(1, "El año/fecha de inicio es obligatorio")
    .max(40),
  end_date: z.string().trim().max(40).optional().default(""),
  current: z.boolean().optional().default(false),
  description: z.string().trim().max(600).optional().default(""),
});

const socialLinkSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "El nombre de la red es obligatorio").max(50),
  url: z.string().trim().url("Debe ser una URL válida (https://...)"),
});

const profileFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "El nombre completo es obligatorio")
    .max(120),
  headline: z
    .string()
    .trim()
    .min(1, "El titular profesional es obligatorio")
    .max(160),
  short_bio: z
    .string()
    .trim()
    .max(300, "Máximo 300 caracteres")
    .optional()
    .default(""),
  bio: z
    .string()
    .trim()
    .max(5000, "Máximo 5000 caracteres")
    .optional()
    .default(""),
  photo_url: z.string().trim().nullable().optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  contact_email: z
    .string()
    .trim()
    .email("Ingresá un correo de contacto válido"),
  cv_url: z.string().trim().max(500).optional().default(""),
  available: z.boolean().default(true),
  stack: z.array(stackItemSchema).default([]),
  milestones: z.array(milestoneSchema).default([]),
  social_links_list: z.array(socialLinkSchema).default([]),
});

const TABS = [
  { id: "identidad", label: "1. Identidad y Presentación", icon: User },
  { id: "stack", label: "2. Stack Tecnológico", icon: Cpu },
  { id: "trayectoria", label: "3. Trayectoria", icon: GraduationCap },
  { id: "redes", label: "4. Redes Sociales", icon: Share2 },
];

const CATEGORY_LABELS = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Base de Datos",
  tools: "Herramientas",
};

export default function ProfileEditPage() {
  const toast = useToast();
  const [status, setStatus] = useState("cargando");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("identidad");

  // Estado temporal para agregar un nuevo ítem al Stack desde el catálogo curado
  const [newTechName, setNewTechName] = useState("");
  const [newTechCategory, setNewTechCategory] = useState("frontend");
  const [newTechIcon, setNewTechIcon] = useState("react");

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
      headline: "",
      short_bio: "",
      bio: "",
      photo_url: "",
      location: "",
      contact_email: "",
      cv_url: "",
      available: true,
      stack: [],
      milestones: [],
      social_links_list: [
        { id: "github", name: "GitHub", url: "https://github.com" },
        { id: "linkedin", name: "LinkedIn", url: "https://linkedin.com" },
      ],
    },
  });

  const {
    fields: stackFields,
    append: appendStack,
    remove: removeStack,
    swap: swapStack,
  } = useFieldArray({ control, name: "stack" });

  const {
    fields: milestoneFields,
    append: appendMilestone,
    remove: removeMilestone,
    swap: swapMilestone,
  } = useFieldArray({ control, name: "milestones" });

  const {
    fields: socialFields,
    append: appendSocial,
    remove: removeSocial,
  } = useFieldArray({ control, name: "social_links_list" });

  const { blocker } = useUnsavedChanges(isDirty);

  const loadProfile = useCallback(async () => {
    setStatus("cargando");
    setErrorMsg("");
    try {
      const res = await apiFetch("/profile");
      const data = res?.data || {};

      const expItems = (
        Array.isArray(data.experience) ? data.experience : []
      ).map((m, i) => ({
        id: m.id || `exp-${i}`,
        type: "experiencia",
        title: m.title || "",
        organization: m.organization || m.place || "",
        start_date:
          m.start_date || (m.date ? m.date.split("—")[0].trim() : "2024"),
        end_date: m.end_date || "",
        current: Boolean(
          m.current ?? m.date?.toLowerCase().includes("actualidad"),
        ),
        description: m.description || "",
      }));

      const eduItems = (
        Array.isArray(data.education) ? data.education : []
      ).map((m, i) => ({
        id: m.id || `edu-${i}`,
        type: "educacion",
        title: m.title || "",
        organization: m.organization || m.place || "",
        start_date:
          m.start_date || (m.date ? m.date.split("—")[0].trim() : "2023"),
        end_date: m.end_date || "",
        current: Boolean(
          m.current ?? m.date?.toLowerCase().includes("actualidad"),
        ),
        description: m.description || "",
      }));

      let socialList = [];
      if (Array.isArray(data.social_links)) {
        socialList = data.social_links;
      } else if (data.social_links && typeof data.social_links === "object") {
        socialList = Object.entries(data.social_links)
          .filter(([, url]) => typeof url === "string" && url.trim())
          .map(([key, url]) => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            url,
          }));
      }
      if (socialList.length === 0) {
        socialList = [
          { id: "github", name: "GitHub", url: "https://github.com" },
          { id: "linkedin", name: "LinkedIn", url: "https://linkedin.com" },
        ];
      }

      reset({
        full_name: data.full_name || "",
        headline: data.headline || "",
        short_bio: data.short_bio || "",
        bio: data.bio || "",
        photo_url: data.photo_url || "",
        location: data.location || "",
        contact_email: data.contact_email || "",
        cv_url: data.cv_url || "",
        available: data.available ?? true,
        stack: Array.isArray(data.stack) ? data.stack : [],
        milestones: [...expItems, ...eduItems],
        social_links_list: socialList,
      });
      setStatus("con_datos");
    } catch (err) {
      setErrorMsg(err.message || "No se pudo cargar el perfil.");
      setStatus("error");
    }
  }, [reset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProfile]);

  const watchedValues = useWatch({ control });

  const onSubmit = async (formValues) => {
    try {
      const experience = formValues.milestones.filter(
        (m) => m.type === "experiencia",
      );
      const education = formValues.milestones.filter(
        (m) => m.type === "educacion",
      );

      const social_links = {};
      formValues.social_links_list.forEach((item) => {
        const key =
          item.id || item.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        social_links[key] = item.url;
      });

      const payload = {
        full_name: formValues.full_name,
        headline: formValues.headline,
        short_bio: formValues.short_bio,
        bio: formValues.bio,
        photo_url: formValues.photo_url || null,
        location: formValues.location,
        contact_email: formValues.contact_email,
        cv_url: formValues.cv_url,
        available: formValues.available,
        stack: formValues.stack,
        experience,
        education,
        social_links,
      };

      const res = await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      reset(formValues);
      toast.success(res?.message || "Perfil guardado correctamente");
    } catch (err) {
      toast.error(err.message || "Error al guardar el perfil");
    }
  };

  const handleAddTech = () => {
    const cleanName = newTechName.trim();
    if (!cleanName) {
      toast.error(
        "Ingresá el nombre de la tecnología o seleccioná un ícono del catálogo",
      );
      return;
    }
    const id = newTechIcon || cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");
    appendStack({
      id: `${id}-${Date.now().toString(36).slice(-3)}`,
      name: cleanName,
      category: newTechCategory,
      icon_key: newTechIcon,
    });
    setNewTechName("");
  };

  // Construcción de datos reactivos para la Vista Previa en Vivo
  const previewMapped = mapRemoteProfileToPublic({
    full_name: watchedValues.full_name,
    headline: watchedValues.headline,
    short_bio: watchedValues.short_bio,
    bio: watchedValues.bio,
    photo_url: watchedValues.photo_url,
    location: watchedValues.location,
    contact_email: watchedValues.contact_email,
    cv_url: watchedValues.cv_url,
    available: watchedValues.available,
    stack: watchedValues.stack,
    experience: (watchedValues.milestones || []).filter(
      (m) => m.type === "experiencia",
    ),
    education: (watchedValues.milestones || []).filter(
      (m) => m.type === "educacion",
    ),
    social_links: watchedValues.social_links_list,
  });

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        toast.error(
          "Revisá los campos con errores antes de guardar el perfil.",
        );
      })}
      noValidate
      className="flex flex-col gap-5 rounded-[18px] border border-[var(--borde)] bg-[var(--superficie)] p-5 sm:p-6"
    >
      {/* Navegación de las 4 pestañas */}
      <div
        role="tablist"
        aria-label="Secciones del perfil"
        className="flex flex-wrap gap-1.5 border-b border-[var(--borde)] pb-4"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`font-sans-ui inline-flex cursor-pointer items-center gap-2 rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-[var(--acento)] font-semibold text-[var(--sobre-acento)]"
                  : "bg-[var(--fondo)] text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)]"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* PESTAÑA 1: Identidad y Presentación */}
      {activeTab === "identidad" && (
        <div className="flex flex-col gap-4">
          <ImageUploader
            label="Avatar / Foto profesional (Cloudinary)"
            value={watchedValues.photo_url || ""}
            onChange={(url) =>
              setValue("photo_url", url, { shouldDirty: true })
            }
            folder="portfolio/profile"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
                Nombre completo *
              </label>
              <input
                type="text"
                {...register("full_name")}
                placeholder="Ej. Lucas Andrade"
                className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
              />
              {errors.full_name && (
                <p className="mt-1 text-[12px] text-red-400">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
                Titular profesional *
              </label>
              <input
                type="text"
                {...register("headline")}
                placeholder="Ej. Desarrollador Web Full Stack"
                className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
              />
              {errors.headline && (
                <p className="mt-1 text-[12px] text-red-400">
                  {errors.headline.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
              Resumen corto para el inicio (Hero)
            </label>
            <input
              type="text"
              {...register("short_bio")}
              placeholder="Construyo aplicaciones web rápidas, escalables, intuitivas y modernas."
              className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
            />
            {errors.short_bio && (
              <p className="mt-1 text-[12px] text-red-400">
                {errors.short_bio.message}
              </p>
            )}
          </div>

          <div>
            <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
              Texto extendido «Sobre mí» (Markdown simple — separar párrafos con
              línea en blanco)
            </label>
            <textarea
              rows={6}
              {...register("bio")}
              placeholder="Escribí tu presentación profesional..."
              className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] leading-relaxed text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
            />
            {errors.bio && (
              <p className="mt-1 text-[12px] text-red-400">
                {errors.bio.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
                Ubicación
              </label>
              <input
                type="text"
                {...register("location")}
                placeholder="Salta, Argentina"
                className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
                Correo de contacto público *
              </label>
              <input
                type="email"
                {...register("contact_email")}
                placeholder="contacto@ejemplo.com"
                className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
              />
              {errors.contact_email && (
                <p className="mt-1 text-[12px] text-red-400">
                  {errors.contact_email.message}
                </p>
              )}
            </div>

            <div>
              <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
                URL al CV en PDF
              </label>
              <input
                type="text"
                {...register("cv_url")}
                placeholder="https://.../cv.pdf"
                className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: Stack Tecnológico */}
      {activeTab === "stack" && (
        <div className="flex flex-col gap-5">
          <div className="rounded-[14px] border border-[var(--borde)] bg-[var(--fondo)] p-4">
            <h3 className="font-heading text-[15px] font-bold text-[var(--texto)]">
              Agregar tecnología al Stack (Catálogo curado)
            </h3>
            <p className="font-sans-ui mt-0.5 text-[12px] text-[var(--texto-suave)]">
              Sin barras ni porcentajes de dominio. Este stack también alimenta
              las sugerencias en Proyectos.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-sans-ui mb-1 block text-[12px] font-medium text-[var(--texto)]">
                  Nombre visible
                </label>
                <input
                  type="text"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="Ej. React, PostgreSQL..."
                  className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-sans-ui mb-1 block text-[12px] font-medium text-[var(--texto)]">
                  Categoría
                </label>
                <select
                  value={newTechCategory}
                  onChange={(e) => setNewTechCategory(e.target.value)}
                  className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
                >
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="database">Base de Datos</option>
                  <option value="tools">Herramientas</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <IconPicker
                mode="tech"
                label="Seleccionar ícono del catálogo curado (Devicon)"
                value={newTechIcon}
                onChange={(key, item) => {
                  setNewTechIcon(key);
                  if (!newTechName.trim() && item?.label) {
                    setNewTechName(item.label);
                  }
                  if (item?.category) {
                    setNewTechCategory(item.category);
                  }
                }}
              />
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddTech}
                className="!px-4 !py-2 !text-[13px]"
              >
                <Plus size={15} />
                <span>Añadir al Stack</span>
              </Button>
            </div>
          </div>

          {/* Lista reordenable del Stack actual */}
          <div className="flex flex-col gap-2">
            <h4 className="font-sans-ui text-[13px] font-semibold text-[var(--texto)]">
              Tecnologías cargadas ({stackFields.length})
            </h4>

            {stackFields.length === 0 ? (
              <p className="rounded-[12px] border border-dashed border-[var(--borde)] p-6 text-center text-[13px] text-[var(--texto-suave)]">
                No hay tecnologías cargadas. Usá el selector superior para
                agregar la primera.
              </p>
            ) : (
              <div className="divide-y divide-[var(--borde)] overflow-hidden rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)]">
                {stackFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <DevIcon name={field.icon_key || field.name} size={20} />
                      <span className="font-sans-ui text-[14px] font-medium text-[var(--texto)]">
                        {field.name}
                      </span>
                      <Badge variant="neutral">
                        {CATEGORY_LABELS[field.category] || field.category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => swapStack(index, index - 1)}
                        aria-label="Subir tecnología"
                        className="cursor-pointer rounded-md p-1.5 text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)] disabled:opacity-30"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={index === stackFields.length - 1}
                        onClick={() => swapStack(index, index + 1)}
                        aria-label="Bajar tecnología"
                        className="cursor-pointer rounded-md p-1.5 text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] hover:text-[var(--texto)] disabled:opacity-30"
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStack(index)}
                        aria-label="Quitar tecnología"
                        className="cursor-pointer rounded-md p-1.5 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: Trayectoria — Experiencia y Educación */}
      {activeTab === "trayectoria" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-[16px] font-bold text-[var(--texto)]">
                Hitos de Experiencia y Educación
              </h3>
              <p className="font-sans-ui text-[12px] text-[var(--texto-suave)]">
                Reordená los hitos con los botones ↑ y ↓.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                appendMilestone({
                  id: `hito-${Date.now()}`,
                  type: "experiencia",
                  title: "",
                  organization: "",
                  start_date: "2025",
                  end_date: "",
                  current: true,
                  description: "",
                })
              }
              className="!px-3.5 !py-2 !text-[13px]"
            >
              <Plus size={15} />
              <span>Nuevo hito</span>
            </Button>
          </div>

          {milestoneFields.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-[var(--borde)] p-6 text-center text-[13px] text-[var(--texto-suave)]">
              No hay hitos cargados en tu trayectoria.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {milestoneFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 rounded-[14px] border border-[var(--borde)] bg-[var(--fondo)] p-4"
                >
                  <div className="flex items-center justify-between border-b border-[var(--borde)] pb-2.5">
                    <span className="font-mono-ui text-[11px] font-semibold uppercase text-[var(--acento-texto)]">
                      Hito #{index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => swapMilestone(index, index - 1)}
                        aria-label="Subir hito"
                        className="cursor-pointer rounded-md p-1 text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] disabled:opacity-30"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={index === milestoneFields.length - 1}
                        onClick={() => swapMilestone(index, index + 1)}
                        aria-label="Bajar hito"
                        className="cursor-pointer rounded-md p-1 text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] disabled:opacity-30"
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        aria-label="Eliminar hito"
                        className="cursor-pointer rounded-md p-1 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="font-sans-ui mb-1 block text-[12px] font-medium text-[var(--texto)]">
                        Tipo
                      </label>
                      <select
                        {...register(`milestones.${index}.type`)}
                        className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)]"
                      >
                        <option value="experiencia">Experiencia</option>
                        <option value="educacion">Educación</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-sans-ui mb-1 block text-[12px] font-medium text-[var(--texto)]">
                        Rol o Título *
                      </label>
                      <input
                        type="text"
                        {...register(`milestones.${index}.title`)}
                        placeholder="Ej. Desarrollador Full Stack"
                        className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="font-sans-ui mb-1 block text-[12px] font-medium text-[var(--texto)]">
                        Organización / Institución *
                      </label>
                      <input
                        type="text"
                        {...register(`milestones.${index}.organization`)}
                        placeholder="Empresa o Universidad"
                        className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)]"
                      />
                    </div>

                    <div>
                      <label className="font-sans-ui mb-1 block text-[12px] font-medium text-[var(--texto)]">
                        Inicio *
                      </label>
                      <input
                        type="text"
                        {...register(`milestones.${index}.start_date`)}
                        placeholder="2024"
                        className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)]"
                      />
                    </div>

                    <div>
                      <label className="font-sans-ui mb-1 block text-[12px] font-medium text-[var(--texto)]">
                        Fin
                      </label>
                      <input
                        type="text"
                        {...register(`milestones.${index}.end_date`)}
                        disabled={watchedValues.milestones?.[index]?.current}
                        placeholder="2025"
                        className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)] disabled:opacity-50"
                      />
                      <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-[var(--texto-suave)]">
                        <input
                          type="checkbox"
                          {...register(`milestones.${index}.current`)}
                          className="accent-[var(--acento)]"
                        />
                        <span>En curso (Actualidad)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="font-sans-ui mb-1 block text-[12px] font-medium text-[var(--texto)]">
                      Descripción breve
                    </label>
                    <textarea
                      rows={2}
                      {...register(`milestones.${index}.description`)}
                      placeholder="Principales logros o materias..."
                      className="font-sans-ui w-full rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 4: Redes Sociales */}
      {activeTab === "redes" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-[16px] font-bold text-[var(--texto)]">
                Enlaces Profesionales y Redes Sociales
              </h3>
              <p className="font-sans-ui text-[12px] text-[var(--texto-suave)]">
                URLs validadas con https:// para GitHub, LinkedIn y perfiles
                adicionales.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                appendSocial({
                  id: `link-${Date.now().toString(36)}`,
                  name: "Sitio Web",
                  url: "https://",
                })
              }
              className="!px-3.5 !py-2 !text-[13px]"
            >
              <Plus size={15} />
              <span>Agregar enlace</span>
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {socialFields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 items-start gap-3 rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] p-3.5 sm:grid-cols-12"
              >
                <div className="sm:col-span-4">
                  <label className="font-sans-ui mb-1 block text-[11px] font-medium text-[var(--texto-suave)]">
                    Red / Etiqueta
                  </label>
                  <input
                    type="text"
                    {...register(`social_links_list.${index}.name`)}
                    placeholder="GitHub / LinkedIn"
                    className="font-sans-ui w-full rounded-[9px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)]"
                  />
                </div>

                <div className="sm:col-span-7">
                  <label className="font-sans-ui mb-1 block text-[11px] font-medium text-[var(--texto-suave)]">
                    URL completa (https://...)
                  </label>
                  <input
                    type="url"
                    {...register(`social_links_list.${index}.url`)}
                    placeholder="https://github.com/usuario"
                    className="font-sans-ui w-full rounded-[9px] border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2 text-[13px] text-[var(--texto)]"
                  />
                  {errors.social_links_list?.[index]?.url && (
                    <p className="mt-1 text-[11px] text-red-400">
                      {errors.social_links_list[index].url.message}
                    </p>
                  )}
                </div>

                <div className="flex items-end justify-end pt-5 sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeSocial(index)}
                    aria-label="Eliminar red social"
                    className="cursor-pointer rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra inferior de guardado */}
      <div className="flex items-center justify-end gap-3 border-t border-[var(--borde)] pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          <Save size={16} />
          <span>
            {isSubmitting
              ? "Guardando perfil..."
              : "Guardar cambios del perfil"}
          </span>
        </Button>
      </div>
    </form>
  );

  const previewContent = (
    <div className="flex flex-col gap-6">
      {activeTab === "identidad" || activeTab === "redes" ? (
        <div className="origin-top overflow-hidden rounded-[14px] border border-[var(--borde)] bg-[var(--fondo)]">
          <HeroSection profile={previewMapped.profile} />
        </div>
      ) : activeTab === "stack" ? (
        <div className="origin-top overflow-hidden rounded-[14px] border border-[var(--borde)] bg-[var(--fondo)]">
          <AboutSection
            about={previewMapped.about}
            technologies={previewMapped.technologies}
            stackCategories={STACK_CATEGORIES}
          />
        </div>
      ) : (
        <div className="origin-top overflow-hidden rounded-[14px] border border-[var(--borde)] bg-[var(--fondo)]">
          <TrajectorySection
            trajectory={previewMapped.trajectory}
            disableAnimation={true}
            compact={true}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-[26px] font-bold tracking-tight text-[var(--texto)]">
          Edición del Perfil Profesional
        </h1>
        <p className="font-sans-ui mt-1 text-[14px] text-[var(--texto-suave)]">
          Administrá tu identidad, stack tecnológico curado, trayectoria y redes
          sociales en tiempo real.
        </p>
      </div>

      <DataState
        status={status}
        skeletonType="form"
        errorMessage={errorMsg}
        onRetry={loadProfile}
      >
        <LivePreviewLayout
          formContent={formContent}
          previewContent={previewContent}
          previewTitle={`Vista previa: ${TABS.find((t) => t.id === activeTab)?.label || "Perfil"}`}
        />
      </DataState>

      <UnsavedChangesModal blocker={blocker} />
    </div>
  );
}
