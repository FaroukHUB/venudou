import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Palette, Plus, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/lib/org-context';
import { iconFor, OPTION_ICONS } from '@/lib/icons';
import { brandIconFor } from '@/lib/brand-icons';
import type { KioskTheme, Question, QuestionOption, Questionnaire } from '@/lib/types';
import { PageHeader, Spinner, Badge, Toggle, ErrorState } from '@/components/ui/misc';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SelectField, InputField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { formatDateTime, slugify } from '@/lib/format';

interface FullQuestion extends Question {
  options: QuestionOption[];
}

export default function QuestionnairePage() {
  const { locations, current } = useOrg();
  const [locationId, setLocationId] = useState('');
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [theme, setTheme] = useState<KioskTheme>({});
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMessage, setThemeMessage] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [questions, setQuestions] = useState<FullQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [iconPicker, setIconPicker] = useState<QuestionOption | null>(null);
  const [newOptionFor, setNewOptionFor] = useState<FullQuestion | null>(null);
  const [newOptionLabel, setNewOptionLabel] = useState('');

  useEffect(() => {
    if (!locationId && locations.length > 0) setLocationId(locations[0].id);
  }, [locations, locationId]);

  const load = useCallback(async () => {
    if (!locationId) return;
    setQuestions(null);
    setError(null);
    const { data: qn, error: e1 } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('location_id', locationId)
      .maybeSingle();
    if (e1 || !qn) {
      setError(e1?.message ?? 'Questionnaire introuvable pour cet établissement.');
      return;
    }
    setQuestionnaire(qn as Questionnaire);
    setTheme(((qn as Questionnaire).theme ?? {}) as KioskTheme);
    const { data: qs, error: e2 } = await supabase
      .from('questions')
      .select('*, options:question_options(*)')
      .eq('questionnaire_id', qn.id)
      .order('position');
    if (e2) {
      setError(e2.message);
      return;
    }
    setQuestions(
      ((qs ?? []) as FullQuestion[]).map((q) => ({
        ...q,
        options: [...q.options].sort((a, b) => a.position - b.position),
      })),
    );
  }, [locationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateQuestion(id: string, patch: Partial<Question>) {
    const { error: err } = await supabase.from('questions').update(patch).eq('id', id);
    if (err) setError(err.message);
    else await load();
  }

  async function updateOption(id: string, patch: Partial<QuestionOption>) {
    const { error: err } = await supabase.from('question_options').update(patch).eq('id', id);
    if (err) setError(err.message);
    else await load();
  }

  async function moveQuestion(q: FullQuestion, dir: -1 | 1) {
    if (!questions) return;
    const idx = questions.findIndex((x) => x.id === q.id);
    const other = questions[idx + dir];
    if (!other) return;
    await supabase.from('questions').update({ position: other.position }).eq('id', q.id);
    await supabase.from('questions').update({ position: q.position }).eq('id', other.id);
    await load();
  }

  async function moveOption(q: FullQuestion, o: QuestionOption, dir: -1 | 1) {
    const idx = q.options.findIndex((x) => x.id === o.id);
    const other = q.options[idx + dir];
    if (!other) return;
    await supabase.from('question_options').update({ position: other.position }).eq('id', o.id);
    await supabase.from('question_options').update({ position: o.position }).eq('id', other.id);
    await load();
  }

  async function addOption() {
    if (!newOptionFor || !newOptionLabel.trim()) return;
    const value = slugify(newOptionLabel).replace(/-/g, '_').slice(0, 40);
    const { error: err } = await supabase.from('question_options').insert({
      question_id: newOptionFor.id,
      organization_id: newOptionFor.organization_id,
      label: newOptionLabel.trim(),
      value: `${value}_${Math.random().toString(36).slice(2, 5)}`,
      position: Math.max(0, ...newOptionFor.options.map((o) => o.position)) + 1,
    });
    if (err) setError(err.message);
    setNewOptionFor(null);
    setNewOptionLabel('');
    await load();
  }

  async function deleteOption(o: QuestionOption) {
    const { error: err } = await supabase.from('question_options').delete().eq('id', o.id);
    if (err)
      setError(
        err.message.includes('GENDER_OPTOUT_PROTECTED')
          ? "L'option « Je préfère ne pas répondre » ne peut pas être supprimée tant que la question est active."
          : err.message,
      );
    else await load();
  }

  async function saveTheme(next: KioskTheme) {
    if (!questionnaire) return;
    setThemeSaving(true);
    setThemeMessage(null);
    const { error: err } = await supabase
      .from('questionnaires')
      .update({ theme: next })
      .eq('id', questionnaire.id);
    setThemeSaving(false);
    setThemeMessage(err ? err.message : 'Apparence enregistrée — pensez à publier.');
    if (!err) setTheme(next);
  }

  async function uploadLogo(file: File) {
    if (!questionnaire || !current) return;
    if (file.size > 1024 * 1024) {
      setThemeMessage('Le logo doit faire moins de 1 Mo.');
      return;
    }
    setLogoUploading(true);
    setThemeMessage(null);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const path = `${current.organization.id}/${questionnaire.location_id}-${Date.now()}.${ext}`;
    const { error: err } = await supabase.storage
      .from('brand-logos')
      .upload(path, file, { upsert: true, cacheControl: '3600' });
    if (err) {
      setThemeMessage(`Envoi du logo impossible : ${err.message}`);
      setLogoUploading(false);
      return;
    }
    const { data } = supabase.storage.from('brand-logos').getPublicUrl(path);
    setLogoUploading(false);
    await saveTheme({ ...theme, logoUrl: data.publicUrl });
  }

  async function publish() {
    if (!questionnaire) return;
    setPublishing(true);
    const { error: err } = await supabase
      .from('questionnaires')
      .update({ published_at: new Date().toISOString() })
      .eq('id', questionnaire.id);
    setPublishing(false);
    if (err) setError(err.message);
    else await load();
  }

  const kindLabels: Record<string, string> = {
    source: 'Étape — Provenance',
    gender: 'Étape — Genre',
    age_range: "Étape — Tranche d'âge",
    custom: 'Question personnalisée',
  };

  return (
    <div>
      <PageHeader
        title="Questionnaire"
        description="Paramétrez le questionnaire affiché sur les tablettes de chaque établissement, puis publiez les changements."
        actions={
          <>
            <Button variant="ghost" onClick={() => setPreviewOpen(true)} disabled={!questions}>
              <Eye className="size-4" aria-hidden /> Prévisualiser
            </Button>
            <Button
              variant="secondary"
              onClick={publish}
              loading={publishing}
              disabled={!questionnaire}
            >
              <Send className="size-4" aria-hidden /> Publier sur les tablettes
            </Button>
          </>
        }
      />
      <div className="mb-4 max-w-sm">
        <SelectField
          label="Établissement"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </SelectField>
      </div>
      {questionnaire?.published_at && (
        <p className="mb-4 text-xs text-navy-400">
          Dernière publication : {formatDateTime(questionnaire.published_at)} — les tablettes
          récupèrent la nouvelle version automatiquement.
        </p>
      )}
      {questionnaire && (
        <Card className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <Palette className="size-5 text-turquoise-600" aria-hidden />
            <h2 className="text-lg font-bold text-navy-900">Apparence de la tablette</h2>
          </div>
          <div className="flex flex-wrap items-end gap-5">
            <label className="text-sm font-semibold text-navy-800">
              Couleur de fond
              <span className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={theme.backgroundColor ?? '#142c52'}
                  onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                  aria-label="Couleur de fond du questionnaire"
                  className="h-10 w-16 cursor-pointer rounded-lg border border-navy-200 bg-white"
                />
                <button
                  type="button"
                  className="text-xs font-medium text-navy-400 hover:underline"
                  onClick={() => setTheme({ ...theme, backgroundColor: undefined })}
                >
                  Réinitialiser
                </button>
              </span>
            </label>
            <label className="text-sm font-semibold text-navy-800">
              Forme des boutons
              <select
                className="mt-1.5 block rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm font-normal"
                value={theme.buttonShape ?? 'rounded'}
                onChange={(e) =>
                  setTheme({ ...theme, buttonShape: e.target.value as 'rounded' | 'round' })
                }
              >
                <option value="rounded">Coins arrondis</option>
                <option value="round">Complètement ronds</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-navy-800">
              Logo de l'établissement
              <span className="mt-1.5 flex items-center gap-3">
                {theme.logoUrl && (
                  <img
                    src={theme.logoUrl}
                    alt="Logo actuel"
                    className="h-10 w-auto max-w-28 rounded-lg border border-navy-100 bg-white object-contain p-1"
                  />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  aria-label="Importer le logo"
                  className="text-xs font-normal text-navy-500 file:mr-2 file:rounded-lg file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-navy-700"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadLogo(file);
                  }}
                />
                {theme.logoUrl && (
                  <button
                    type="button"
                    className="text-xs font-medium text-red-500 hover:underline"
                    onClick={() => void saveTheme({ ...theme, logoUrl: null })}
                  >
                    Retirer
                  </button>
                )}
              </span>
            </label>
            <Button
              size="sm"
              loading={themeSaving || logoUploading}
              onClick={() => void saveTheme(theme)}
            >
              Enregistrer l'apparence
            </Button>
          </div>
          <p className="mt-2 text-xs text-navy-400">
            Les icônes des réseaux (Facebook, Instagram, TikTok, Snapchat, Google…) s'affichent
            automatiquement dans leur style officiel, en pastilles rondes. PNG/JPG/SVG, 1 Mo max
            pour le logo.
          </p>
          {themeMessage && (
            <p className="mt-2 text-sm font-medium text-navy-600" role="status">
              {themeMessage}
            </p>
          )}
        </Card>
      )}
      {error && <ErrorState message={error} onRetry={() => void load()} />}
      {!questions && !error && <Spinner />}
      {questions && (
        <div className="space-y-5">
          {questions.map((q, qi) => (
            <Card key={q.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Badge
                    tone={
                      q.kind === 'source' ? 'turquoise' : q.kind === 'custom' ? 'violet' : 'navy'
                    }
                  >
                    {kindLabels[q.kind]}
                  </Badge>
                  {!q.enabled && <Badge tone="gray">Désactivée</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-navy-500">
                    Obligatoire
                    <Toggle
                      checked={q.required}
                      onChange={(v) => void updateQuestion(q.id, { required: v })}
                      label={`Question obligatoire : ${q.label}`}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-navy-500">
                    Active
                    <Toggle
                      checked={q.enabled}
                      onChange={(v) => void updateQuestion(q.id, { enabled: v })}
                      label={`Question active : ${q.label}`}
                    />
                  </label>
                  <div className="flex gap-1">
                    <button
                      aria-label="Monter la question"
                      className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 disabled:opacity-30"
                      disabled={qi === 0}
                      onClick={() => void moveQuestion(q, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      aria-label="Descendre la question"
                      className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 disabled:opacity-30"
                      disabled={qi === questions.length - 1}
                      onClick={() => void moveQuestion(q, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
              <input
                className="mt-3 w-full rounded-xl border border-transparent px-2 py-1.5 text-lg font-bold text-navy-900 hover:border-navy-200 focus:border-turquoise-500"
                defaultValue={q.label}
                aria-label="Intitulé de la question"
                onBlur={(e) => {
                  if (e.target.value !== q.label)
                    void updateQuestion(q.id, { label: e.target.value });
                }}
              />
              <ul className="mt-3 space-y-1.5">
                {q.options.map((o, oi) => {
                  const Brand = brandIconFor(o.value, o.icon);
                  const Icon = Brand ? null : iconFor(o.icon);
                  return (
                    <li
                      key={o.id}
                      className="flex items-center gap-2 rounded-xl border border-navy-100 bg-surface-muted px-3 py-2"
                    >
                      <button
                        aria-label={`Changer l'icône de ${o.label}`}
                        className="rounded-lg border border-navy-200 bg-white p-1.5 text-navy-600 hover:bg-navy-50"
                        onClick={() => setIconPicker(o)}
                        title="Choisir une icône"
                      >
                        {Brand ? (
                          <Brand className="size-4 rounded-full" />
                        ) : Icon ? (
                          <Icon className="size-4" />
                        ) : (
                          <span className="block size-4" />
                        )}
                      </button>
                      <input
                        className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-navy-800 hover:border-navy-200 focus:border-turquoise-500"
                        defaultValue={o.label}
                        aria-label={`Libellé de l'option ${o.label}`}
                        onBlur={(e) => {
                          if (e.target.value !== o.label)
                            void updateOption(o.id, { label: e.target.value });
                        }}
                      />
                      {o.is_optout && <Badge tone="gray">Refus</Badge>}
                      {o.is_other && <Badge tone="gray">Autre</Badge>}
                      <Toggle
                        checked={o.enabled}
                        onChange={(v) => void updateOption(o.id, { enabled: v })}
                        label={`Option affichée : ${o.label}`}
                      />
                      <button
                        aria-label="Monter l'option"
                        className="rounded p-1 text-navy-300 hover:text-navy-600 disabled:opacity-30"
                        disabled={oi === 0}
                        onClick={() => void moveOption(q, o, -1)}
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        aria-label="Descendre l'option"
                        className="rounded p-1 text-navy-300 hover:text-navy-600 disabled:opacity-30"
                        disabled={oi === q.options.length - 1}
                        onClick={() => void moveOption(q, o, 1)}
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      {!o.is_optout && (
                        <button
                          aria-label={`Supprimer l'option ${o.label}`}
                          className="rounded p-1 text-navy-300 hover:text-red-600"
                          onClick={() => void deleteOption(o)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {(q.kind === 'source' || q.kind === 'age_range' || q.kind === 'custom') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => setNewOptionFor(q)}
                >
                  <Plus className="size-4" aria-hidden /> Ajouter une option
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Prévisualisation */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Prévisualisation tablette"
      >
        <div className="space-y-6">
          {questions
            ?.filter((q) => q.enabled)
            .map((q, i, arr) => (
              <div
                key={q.id}
                className="rounded-2xl bg-navy-800 p-4 text-white"
                style={
                  theme.backgroundColor ? { backgroundColor: theme.backgroundColor } : undefined
                }
              >
                <p className="text-xs text-navy-200">
                  {i + 1}/{arr.length}
                </p>
                <p className="mt-1 text-lg font-bold">{q.label}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {q.options
                    .filter((o) => o.enabled)
                    .map((o) => {
                      const Brand = brandIconFor(o.value, o.icon);
                      const Icon = Brand ? null : iconFor(o.icon);
                      return (
                        <span
                          key={o.id}
                          className={`flex items-center gap-2 bg-white/10 px-3 py-2.5 text-sm font-semibold ${theme.buttonShape === 'round' ? 'rounded-full' : 'rounded-xl'}`}
                        >
                          {Brand && (
                            <span className="flex size-6 items-center justify-center overflow-hidden rounded-full bg-white">
                              <Brand className="size-4" />
                            </span>
                          )}
                          {Icon && <Icon className="size-4" aria-hidden />}
                          {o.label}
                        </span>
                      );
                    })}
                </div>
                {!q.required && <p className="mt-2 text-xs text-navy-200">Passer →</p>}
              </div>
            ))}
        </div>
      </Modal>

      {/* Choix d'icône */}
      <Modal
        open={Boolean(iconPicker)}
        onClose={() => setIconPicker(null)}
        title="Choisir une icône"
      >
        <div className="grid grid-cols-7 gap-2">
          <button
            className="flex aspect-square items-center justify-center rounded-xl border border-navy-100 text-xs text-navy-400 hover:bg-navy-50"
            onClick={() => {
              if (iconPicker) void updateOption(iconPicker.id, { icon: '' });
              setIconPicker(null);
            }}
          >
            Aucune
          </button>
          {Object.entries(OPTION_ICONS).map(([name, Icon]) => (
            <button
              key={name}
              aria-label={name}
              className="flex aspect-square items-center justify-center rounded-xl border border-navy-100 text-navy-700 hover:bg-turquoise-50"
              onClick={() => {
                if (iconPicker) void updateOption(iconPicker.id, { icon: name });
                setIconPicker(null);
              }}
            >
              <Icon className="size-5" />
            </button>
          ))}
        </div>
      </Modal>

      {/* Nouvelle option */}
      <Modal
        open={Boolean(newOptionFor)}
        onClose={() => setNewOptionFor(null)}
        title="Ajouter une option"
      >
        <div className="space-y-4">
          <InputField
            label="Libellé"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            placeholder="Ex. : Radio locale"
          />
          <Button className="w-full" onClick={() => void addOption()}>
            Ajouter
          </Button>
        </div>
      </Modal>
    </div>
  );
}
