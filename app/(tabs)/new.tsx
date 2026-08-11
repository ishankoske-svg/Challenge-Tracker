import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useChallengeStore } from '../../stores/challengeStore';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { TemplateCard } from '../../components/TemplateCard';
import { TEMPLATES, ChallengeTemplate, TaskTemplate } from '../../constants/templates';
import { ChallengeCategory, DifficultyMode, DIFFICULTY_CONFIG, calculateMaxPenalties } from '../../lib/challenges';
import {
  PlusCircle,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Hash,
  Camera,
  AlignLeft,
  ArrowRight,
  Shield,
} from 'lucide-react-native';

type ScreenStep = 'pick_template' | 'edit_form';

const TASK_TYPE_OPTIONS: { value: TaskTemplate['type']; label: string; icon: React.ElementType }[] = [
  { value: 'checkbox', label: 'Checkbox', icon: CheckCircle2 },
  { value: 'numeric', label: 'Numeric', icon: Hash },
  { value: 'photo', label: 'Photo', icon: Camera },
  { value: 'text_note', label: 'Note', icon: AlignLeft },
];

const CATEGORY_OPTIONS: { value: ChallengeCategory; label: string }[] = [
  { value: 'fitness', label: 'Fitness' },
  { value: 'coding', label: 'Coding' },
  { value: 'academics', label: 'Academics' },
  { value: 'language', label: 'Language' },
  { value: 'mindset', label: 'Mindset' },
  { value: 'custom', label: 'Custom' },
];

export default function NewChallengeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { addChallenge } = useChallengeStore();

  const [step, setStep] = useState<ScreenStep>('pick_template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ChallengeCategory>('custom');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>('medium');
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePickTemplate = (template: ChallengeTemplate) => {
    setTitle(template.title);
    setCategory(template.category);
    setDescription(template.description);
    setDurationDays(String(template.duration_days));
    setDifficultyMode(template.default_difficulty || 'medium');
    setTasks([...template.tasks]);
    setSelectedTemplateId(template.id);
    setStep('edit_form');
  };

  const handleStartCustom = () => {
    setTitle('');
    setCategory('custom');
    setDescription('');
    setDurationDays('30');
    setDifficultyMode('medium');
    setTasks([{ label: '', type: 'checkbox', task_type: 'binary', is_compulsory: true }]);
    setSelectedTemplateId(undefined);
    setStep('edit_form');
  };

  const handleAddTask = () => {
    setTasks((prev) => [...prev, { label: '', type: 'checkbox', task_type: 'binary', is_compulsory: true }]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTaskLabel = (index: number, label: string) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, label } : t)));
  };

  const handleUpdateTaskType = (index: number, type: TaskTemplate['type']) => {
    setTasks((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        const taskType = type === 'numeric' ? 'definite' : 'binary';
        const targetQty = type === 'numeric' ? (t.target_quantity || 5) : null;
        return { ...t, type, task_type: taskType, target_quantity: targetQty };
      }),
    );
  };

  const handleUpdateTaskKind = (index: number, task_type: 'definite' | 'binary') => {
    setTasks((prev) =>
      prev.map((t, i) =>
        i === index
          ? { ...t, task_type, target_quantity: task_type === 'definite' ? (t.target_quantity || 1) : null }
          : t,
      ),
    );
  };

  const handleUpdateTargetQty = (index: number, qtyStr: string) => {
    const qty = parseInt(qtyStr, 10);
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, target_quantity: isNaN(qty) ? null : qty } : t)),
    );
  };

  const handleUpdateTaskUnit = (index: number, unit: string) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, unit } : t)));
  };

  const handleToggleCompulsory = (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, is_compulsory: !t.is_compulsory } : t)),
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a challenge title.');
      return;
    }
    const duration = parseInt(durationDays, 10);
    if (!duration || duration < 1 || duration > 365) {
      setErrorMsg('Duration must be between 1 and 365 days.');
      return;
    }
    const validTasks = tasks.filter((t) => t.label.trim());
    if (validTasks.length === 0) {
      setErrorMsg('Add at least one task with a label.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const userId = user?.id || 'demo-user';
    const { success, error } = await addChallenge(
      userId,
      title.trim(),
      category,
      description.trim(),
      duration,
      new Date(),
      validTasks,
      difficultyMode,
      selectedTemplateId,
    );

    setSaving(false);
    if (success) {
      setStep('pick_template');
      setTitle('');
      setTasks([]);
      router.push('/(tabs)');
    } else {
      setErrorMsg(error || 'Failed to save challenge.');
    }
  };

  const parsedDuration = parseInt(durationDays, 10) || 30;
  const currentAllowedPenalties = calculateMaxPenalties(difficultyMode, parsedDuration);

  // ---------- TEMPLATE PICKER SCREEN ----------
  if (step === 'pick_template') {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.topBar, { borderBottomColor: theme.cardBorder }]}>
          <View style={styles.titleGroup}>
            <PlusCircle color={theme.accent} size={22} />
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>New Challenge</Text>
          </View>
          <ThemeSwitcher />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            PICK A TEMPLATE
          </Text>

          {TEMPLATES.map((t) => (
            <TemplateCard key={t.id} template={t} onPress={handlePickTemplate} />
          ))}

          <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 8 }]}>
            OR START FROM SCRATCH
          </Text>

          <TouchableOpacity
            style={[styles.customBtn, { backgroundColor: theme.card, borderColor: theme.accentBorder }]}
            activeOpacity={0.8}
            onPress={handleStartCustom}
          >
            <Sparkles color={theme.accentText} size={20} />
            <Text style={[styles.customBtnText, { color: theme.accentText }]}>
              Create Custom Challenge
            </Text>
            <ArrowRight color={theme.accentText} size={16} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ---------- EDIT / CREATE FORM ----------
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setStep('pick_template')}
          activeOpacity={0.7}
        >
          <ArrowLeft color={theme.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
          {selectedTemplateId ? 'Customize Challenge' : 'Custom Challenge'}
        </Text>
        <ThemeSwitcher />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {errorMsg ? (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerBg }]}>
            <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Title */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>CHALLENGE TITLE</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
          placeholder="e.g. 75 Hard"
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        {/* Category Picker */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>CATEGORY</Text>
        <View style={styles.chipRow}>
          {CATEGORY_OPTIONS.map((opt) => {
            const isActive = category === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? theme.accent : theme.inputBg,
                    borderColor: isActive ? theme.accent : theme.inputBorder,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => setCategory(opt.value)}
              >
                <Text
                  style={[styles.chipText, { color: isActive ? '#FFF' : theme.textSecondary }]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Difficulty Mode Selector */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>DIFFICULTY MODE & PENALTIES</Text>
        <View style={styles.difficultyGrid}>
          {(['hardcore', 'hard', 'medium', 'easy'] as DifficultyMode[]).map((m) => {
            const conf = DIFFICULTY_CONFIG[m];
            const isSelected = difficultyMode === m;
            const penaltiesAllowed = calculateMaxPenalties(m, parsedDuration);

            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.diffCard,
                  {
                    backgroundColor: isSelected ? `${conf.color}15` : theme.card,
                    borderColor: isSelected ? conf.color : theme.cardBorder,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => setDifficultyMode(m)}
              >
                <View style={styles.diffHeader}>
                  <Text style={styles.diffEmoji}>{conf.emoji}</Text>
                  <Text style={[styles.diffTitle, { color: conf.color }]}>{conf.label}</Text>
                </View>

                <Text style={[styles.diffSub, { color: theme.textSecondary }]}>
                  {m === 'hardcore' ? '0 Penalties' : `${penaltiesAllowed} Penalties buffer`}
                </Text>
                <Text style={[styles.diffXp, { color: theme.accentText }]}>
                  {conf.xpMultiplier}x XP
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Duration */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>DURATION (DAYS)</Text>
        <TextInput
          style={[styles.input, styles.shortInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
          placeholder="30"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          value={durationDays}
          onChangeText={setDurationDays}
        />

        {/* Description */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>DESCRIPTION (OPTIONAL)</Text>
        <TextInput
          style={[
            styles.input,
            styles.multilineInput,
            { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
          ]}
          placeholder="Describe your challenge..."
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />

        {/* Tasks */}
        <View style={styles.taskHeader}>
          <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 0 }]}>
            DAILY TASKS ({tasks.length})
          </Text>
          <TouchableOpacity onPress={handleAddTask} style={[styles.addTaskBtn, { backgroundColor: theme.accentBg }]}>
            <Plus color={theme.accentText} size={14} />
            <Text style={[styles.addTaskText, { color: theme.accentText }]}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {tasks.map((task, index) => {
          const isCompulsory = task.is_compulsory ?? true;
          const isDefinite = task.task_type === 'definite';

          return (
            <View
              key={index}
              style={[styles.taskCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={styles.taskTopRow}>
                <TextInput
                  style={[
                    styles.taskInput,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
                  ]}
                  placeholder={`Task ${index + 1} label`}
                  placeholderTextColor={theme.textMuted}
                  value={task.label}
                  onChangeText={(val) => handleUpdateTaskLabel(index, val)}
                />
                <TouchableOpacity onPress={() => handleRemoveTask(index)} style={styles.removeBtn}>
                  <Trash2 color={theme.danger} size={16} />
                </TouchableOpacity>
              </View>

              {/* Task UI Type */}
              <View style={styles.typeRow}>
                {TASK_TYPE_OPTIONS.map((opt) => {
                  const TypeIcon = opt.icon;
                  const isActive = task.type === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: isActive ? theme.accentBg : theme.inputBg,
                          borderColor: isActive ? theme.accentBorder : theme.inputBorder,
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleUpdateTaskType(index, opt.value)}
                    >
                      <TypeIcon color={isActive ? theme.accentText : theme.textMuted} size={13} />
                      <Text
                        style={[styles.typeChipText, { color: isActive ? theme.accentText : theme.textMuted }]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Definite vs Binary scoring mode toggle */}
              <View style={styles.scoringRow}>
                <Text style={[styles.scoringLabel, { color: theme.textSecondary }]}>Scoring Mode:</Text>
                <TouchableOpacity
                  style={[styles.scoringChip, { backgroundColor: !isDefinite ? theme.accent : theme.inputBg }]}
                  onPress={() => handleUpdateTaskKind(index, 'binary')}
                >
                  <Text style={[styles.scoringChipText, { color: !isDefinite ? '#FFF' : theme.textMuted }]}>Binary (Done/Not Done)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.scoringChip, { backgroundColor: isDefinite ? theme.accent : theme.inputBg }]}
                  onPress={() => handleUpdateTaskKind(index, 'definite')}
                >
                  <Text style={[styles.scoringChipText, { color: isDefinite ? '#FFF' : theme.textMuted }]}>Definite (Target Qty)</Text>
                </TouchableOpacity>
              </View>

              {/* Target quantity & Unit for definite tasks */}
              {isDefinite && (
                <View style={styles.targetRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subInputLabel, { color: theme.textMuted }]}>Target Qty / Day</Text>
                    <TextInput
                      style={[
                        styles.targetInput,
                        { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
                      ]}
                      placeholder="e.g. 5"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={task.target_quantity ? String(task.target_quantity) : ''}
                      onChangeText={(val) => handleUpdateTargetQty(index, val)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subInputLabel, { color: theme.textMuted }]}>Unit (Optional)</Text>
                    <TextInput
                      style={[
                        styles.targetInput,
                        { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
                      ]}
                      placeholder="e.g. problems, pages"
                      placeholderTextColor={theme.textMuted}
                      value={task.unit || ''}
                      onChangeText={(val) => handleUpdateTaskUnit(index, val)}
                    />
                  </View>
                </View>
              )}

              {/* Compulsory vs Optional Toggle */}
              <View style={[styles.compulsoryToggleRow, { borderTopColor: theme.cardBorder }]}>
                <View style={styles.compulsoryLabelGroup}>
                  <Shield color={isCompulsory ? theme.accent : theme.textMuted} size={16} />
                  <View>
                    <Text style={[styles.compulsoryTitle, { color: theme.textPrimary }]}>
                      {isCompulsory ? 'Compulsory (Core Task)' : 'Optional (Bonus Task)'}
                    </Text>
                    <Text style={[styles.compulsorySub, { color: theme.textMuted }]}>
                      {isCompulsory ? 'Missing triggers a penalty.' : 'Never triggers penalty; adds bonus score.'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isCompulsory}
                  onValueChange={() => handleToggleCompulsory(index)}
                  trackColor={{ false: theme.cardBorder, true: theme.accent }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          );
        })}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.accent }]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={styles.saveBtnContent}>
              <CheckCircle2 color="#FFF" size={18} />
              <Text style={styles.saveBtnText}>Create Challenge</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  screenTitle: { fontSize: 20, fontWeight: '800', flex: 1 },
  backBtn: { marginRight: 8, padding: 4 },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  customBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  customBtnText: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, borderWidth: 1 },
  multilineInput: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  shortInput: { width: 120 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  difficultyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  diffCard: { width: '48%', borderRadius: 14, padding: 12, borderWidth: 1 },
  diffHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  diffEmoji: { fontSize: 14 },
  diffTitle: { fontSize: 14, fontWeight: '800' },
  diffSub: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  diffXp: { fontSize: 10, fontWeight: '800' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  addTaskBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addTaskText: { fontSize: 13, fontWeight: '700' },
  taskCard: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 14 },
  taskTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  taskInput: { flex: 1, height: 42, borderRadius: 10, paddingHorizontal: 14, fontSize: 14, borderWidth: 1 },
  removeBtn: { padding: 6 },
  typeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  typeChipText: { fontSize: 11, fontWeight: '600' },
  scoringRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  scoringLabel: { fontSize: 11, fontWeight: '700' },
  scoringChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scoringChipText: { fontSize: 11, fontWeight: '700' },
  targetRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  subInputLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  targetInput: { height: 38, borderRadius: 10, paddingHorizontal: 12, fontSize: 13, borderWidth: 1 },
  compulsoryToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, marginTop: 4 },
  compulsoryLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  compulsoryTitle: { fontSize: 12, fontWeight: '700' },
  compulsorySub: { fontSize: 10 },
  errorBox: { padding: 12, borderRadius: 10, marginBottom: 8 },
  errorText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
