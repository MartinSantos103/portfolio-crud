import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import IconPicker from '../../../components/ui/IconPicker.jsx';
import LivePreviewLayout from '../components/LivePreviewLayout.jsx';
import {
  useUnsavedChanges,
  UnsavedChangesModal,
} from '../hooks/useUnsavedChanges.jsx';
import { ServiceCardView } from '../../../components/ui/ServiceCard.jsx';

const serviceFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título del servicio es obligatorio')
    .max(120),
  description: z
    .string()
    .trim()
    .min(1, 'La descripción es obligatoria')
    .max(600),
  icon: z.string().trim().min(1, 'Seleccioná un ícono del catálogo curado'),
  items: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

const DEFAULT_SERVICE_VALUES = {
  title: '',
  description: '',
  icon: 'sitios-landing',
  items: ['Diseño responsive', 'Optimización de carga', 'Soporte continuo'],
  active: true,
};

export default function ServiceFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState(isEditing ? 'cargando' : 'con_datos');
  const [errorMsg, setErrorMsg] = useState('');
  const [newItemText, setNewItemText] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: DEFAULT_SERVICE_VALUES,
  });

  const { blocker, bypassBlocker } = useUnsavedChanges(isDirty);

  const loadService = useCallback(async () => {
    if (!isEditing) return;
    setStatus('cargando');
    setErrorMsg('');
    try {
      const res = await apiFetch(`/services/${id}`);
      if (res?.data) {
        const s = res.data;
        reset({
          title: s.title || '',
          description: s.description || '',
          icon: s.icon || 'sitios-landing',
          items: Array.isArray(s.items) ? s.items : [],
          active: Boolean(s.active),
        });
      }
      setStatus('con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cargar el servicio.');
      setStatus('error');
    }
  }, [id, isEditing, reset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadService();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadService]);

  const watchedValues = useWatch({ control });

  const onSubmit = async (formValues) => {
    try {
      const endpoint = isEditing ? `/services/${id}` : '/services';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          ...formValues,
          items: (formValues.items || []).map((i) => i.trim()).filter(Boolean),
        }),
      });

      bypassBlocker();
      reset(DEFAULT_SERVICE_VALUES);
      toast.success(
        isEditing
          ? res?.message || 'Servicio actualizado con éxito'
          : 'Servicio agregado con éxito'
      );
      navigate('/admin/servicios');
    } catch (err) {
      toast.error(err.message || 'Error al guardar el servicio');
    }
  };

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        toast.error('Completá los campos obligatorios del servicio.');
      })}
      noValidate
      className="adm-card flex flex-col gap-5"
    >
      <div>
        <label className="adm-label">Título del servicio *</label>
        <input
          type="text"
          maxLength={120}
          {...register('title')}
          placeholder="Ej. Aplicaciones web a medida"
          className="adm-input"
        />
        {errors.title && (
          <p className="mt-1 text-[12px] text-[var(--bad)]">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label className="adm-label">Descripción concisa *</label>
        <textarea
          rows={3}
          maxLength={600}
          {...register('description')}
          placeholder="Explicá en una o dos oraciones qué resuelve este servicio..."
          className="adm-textarea"
        />
        {errors.description && (
          <p className="mt-1 text-[12px] text-[var(--bad)]">
            {errors.description.message}
          </p>
        )}
      </div>

      <IconPicker
        mode="service"
        label="Selector visual de ícono curado *"
        value={watchedValues.icon}
        onChange={(iconKey) => setValue('icon', iconKey, { shouldDirty: true })}
      />

      {/* Puntos clave de la tarjeta */}
      <div className="flex flex-col gap-2.5">
        <label className="adm-label !m-0">
          Entregables o características incluidas (opcional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={120}
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Ej. Panel autogestionable"
            className="adm-input flex-1"
          />
          <button
            type="button"
            onClick={() => {
              if (!newItemText.trim()) return;
              const current = Array.isArray(watchedValues.items)
                ? watchedValues.items
                : [];
              setValue('items', [...current, newItemText.trim()], {
                shouldDirty: true,
              });
              setNewItemText('');
            }}
            className="adm-btn secondary sm shrink-0"
          >
            <Plus size={14} />
            <span>Añadir</span>
          </button>
        </div>

        {(watchedValues.items || []).length > 0 && (
          <div className="divide-y divide-[var(--adm-borde)] rounded-[12px] border border-[var(--adm-borde)] bg-[#090b20]">
            {(watchedValues.items || []).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3.5 py-2 text-[13px]"
              >
                <span className="text-[var(--adm-texto)]">{item}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = (watchedValues.items || []).filter(
                      (_, i) => i !== idx
                    );
                    setValue('items', next, { shouldDirty: true });
                  }}
                  aria-label="Eliminar entregable"
                  className="adm-iconbtn danger !h-6 !w-6"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interruptor Publicado */}
      <div>
        <label className="adm-check cursor-pointer">
          <div>
            <b className="block font-semibold text-[var(--adm-texto)]">
              Publicado
            </b>
            <small className="adm-sub-line">
              Si se desactiva, queda guardado como Borrador.
            </small>
          </div>
          <input
            type="checkbox"
            {...register('active')}
            className="adm-switch"
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--adm-borde)] pt-4">
        <button
          type="button"
          onClick={() => navigate('/admin/servicios')}
          className="adm-btn secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="adm-btn primary"
        >
          <Save size={16} />
          <span>
            {isSubmitting
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear servicio'}
          </span>
        </button>
      </div>
    </form>
  );

  const previewContent = (
    <div className="mx-auto max-w-[380px]">
      <ServiceCardView service={watchedValues} />
    </div>
  );

  return (
    <div id="v-servicios" className="adm-view is-on flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/servicios')}
          aria-label="Volver al listado de servicios"
          className="adm-iconbtn !h-9 !w-9"
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="adm-h1 !text-[24px]">
            {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h1>
          <p className="adm-sub">
            Configurá el servicio y verificá en vivo su tarjeta pública.
          </p>
        </div>
      </div>
      </div>

      <DataState
        status={status}
        skeletonType="form"
        errorMessage={errorMsg}
        onRetry={loadService}
      >
        <LivePreviewLayout
          formContent={formContent}
          previewContent={previewContent}
          previewTitle="Vista previa de tarjeta de servicio"
        />
      </DataState>

      <UnsavedChangesModal blocker={blocker} />
    </div>
  );
}
