import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import Button from '../../../components/ui/Button.jsx';
import IconPicker from '../../../components/ui/IconPicker.jsx';
import LivePreviewLayout from '../components/LivePreviewLayout.jsx';
import {
  useUnsavedChanges,
  UnsavedChangesModal,
} from '../hooks/useUnsavedChanges.jsx';
import { ServiceCardView } from '../../../components/ui/ServiceCard.jsx';

const serviceFormSchema = z.object({
  title: z.string().trim().min(1, 'El título del servicio es obligatorio').max(120),
  description: z.string().trim().min(1, 'La descripción es obligatoria').max(600),
  icon: z.string().trim().min(1, 'Seleccioná un ícono del catálogo curado'),
  items: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

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
    defaultValues: {
      title: '',
      description: '',
      icon: 'sitios-landing',
      items: ['Diseño responsive', 'Optimización de carga', 'Soporte continuo'],
      active: true,
    },
  });

  const { blocker } = useUnsavedChanges(isDirty);

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

      reset(formValues);
      toast.success(
        res?.message ||
          (isEditing ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente')
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
      className="flex flex-col gap-5 rounded-[18px] border border-[var(--borde)] bg-[var(--superficie)] p-5 sm:p-6"
    >
      <div>
        <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
          Título del servicio *
        </label>
        <input
          type="text"
          {...register('title')}
          placeholder="Ej. Aplicaciones web a medida"
          className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
        />
        {errors.title && (
          <p className="mt-1 text-[12px] text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
          Descripción concisa *
        </label>
        <textarea
          rows={3}
          {...register('description')}
          placeholder="Explicá en una o dos oraciones qué resuelve este servicio..."
          className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
        />
        {errors.description && (
          <p className="mt-1 text-[12px] text-red-400">{errors.description.message}</p>
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
        <label className="font-sans-ui text-[13px] font-medium text-[var(--texto)]">
          Entregables o características incluidas (opcional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Ej. Panel autogestionable"
            className="font-sans-ui flex-1 rounded-[10px] border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2 text-[13px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          />
          <Button
            type="button"
            variant="secondary"
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
            className="!px-3.5 !py-2 !text-[12px]"
          >
            <Plus size={14} />
            <span>Añadir</span>
          </Button>
        </div>

        {(watchedValues.items || []).length > 0 && (
          <div className="divide-y divide-[var(--borde)] rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)]">
            {(watchedValues.items || []).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3.5 py-2 text-[13px]"
              >
                <span className="font-sans-ui text-[var(--texto)]">{item}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = (watchedValues.items || []).filter(
                      (_, i) => i !== idx
                    );
                    setValue('items', next, { shouldDirty: true });
                  }}
                  className="cursor-pointer rounded p-1 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-4 py-3">
        <div>
          <p className="font-sans-ui text-[14px] font-semibold text-[var(--texto)]">
            Servicio Activo
          </p>
          <p className="font-sans-ui text-[12px] text-[var(--texto-suave)]">
            Visible en la sección pública de Servicios y en el selector de Cotización.
          </p>
        </div>
        <input
          type="checkbox"
          {...register('active')}
          className="h-5 w-5 accent-[var(--acento)]"
        />
      </label>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--borde)] pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/admin/servicios')}
          className="!px-4 !py-2.5 !text-[14px]"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="!px-5 !py-2.5 !text-[14px]"
        >
          <Save size={16} />
          <span>
            {isSubmitting
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear servicio'}
          </span>
        </Button>
      </div>
    </form>
  );

  const previewContent = (
    <div className="mx-auto max-w-[380px]">
      <ServiceCardView service={watchedValues} />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/servicios')}
          aria-label="Volver al listado de servicios"
          className="cursor-pointer rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] p-2 text-[var(--texto-suave)] hover:border-[var(--acento)] hover:text-[var(--texto)]"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-heading text-[24px] font-bold tracking-tight text-[var(--texto)]">
            {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h1>
          <p className="font-sans-ui text-[13px] text-[var(--texto-suave)]">
            Configurá el servicio y verificá en vivo su tarjeta pública.
          </p>
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
