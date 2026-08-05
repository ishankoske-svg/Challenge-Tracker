import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useChallengeStore } from '../../stores/challengeStore';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { TemplateCard } from '../../components/TemplateCard';
import { TEMPLATES, ChallengeTemplate, TaskTemplate } from '../../constants/templates';
import { ChallengeCategory } from '../../lib/challenges';
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
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePickTemplate = (template: ChallengeTemplate) => {
    setTitle(template.title);
    setCategory(template.category);
    setDescription(template.description);
    setDurationDays(String(template.duration_days));
    setTasks([...template.tasks]);
    setSelectedTemplateId(template.id);
    setStep('edit_form');
  };

  const handleStartCustom = () => {
    setTitle('');
    setCategory('custom');
    setDescription('');
    setDurationDays('30');
    setTasks([{ label: '', type: 'checkbox' }]);
    setSelectedTemplateId(undefined);
    setStep('edit_form');
  };

  const handleAddTask = () => {
    setTasks((prev) => [...prev, { label: '', type: 'checkbox' }]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTaskLabel = (index: number, label: string) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, label } : t)));
  };

  const handleUpdateTaskType = (index: number, type: TaskTemplate['type']) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, type } : t)));
  };

  const handleUpdateTaskUnit = (index: number, unit: string) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, unit } : t)));
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
      selectedTemplateId,
    );

    setSaving(false);
    if (success) {
      // Reset and navigate to Home
      setStep('pick_template');
      setTitle('');
      setTasks([]);
      router.push('/(tabs)');
    } else {
      setErrorMsg(error || 'Failed to save challenge.');
    }
  };

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

        {/* Tasks */}
        <View style={styles.taskHeader}>
          <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 0 }]}>
            DAILY TASKS ({tasks.length})
          </Text>
          <TouchableOpacity onPress={handleAddTask} style={[styles.addTaskBtn, { backgroundColor: theme.accentBg }]}>
            <Plus color={theme.accentText} size={14} />
            <Text style={[styles.addTaskText, { color: theme.accentText }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {tasks.map((task, index) => (
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

            {/* Task type selector */}
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

            {/* Unit input for numeric type */}
            {task.type === 'numeric' && (
              <TextInput
                style={[
                  styles.unitInput,
                  { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
                ]}
                placeholder="Unit (e.g. kg, pages, words)"
                placeholderTextColor={theme.textMuted}
                value={task.unit || ''}
                onChangeText={(val) => handleUpdateTaskUnit(index, val)}
              />
            )}
          </View>
        ))}

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
  container: {
    flex: 1,
  },
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  customBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  multilineInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  shortInput: {
    width: 120,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addTaskText: {
    fontSize: 13,
    fontWeight: '700',
  },
  taskCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  taskInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },
  removeBtn: {
    padding: 6,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  unitInput: {
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    borderWidth: 1,
    marginTop: 8,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
