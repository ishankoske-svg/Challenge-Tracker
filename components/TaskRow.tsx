import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { ChallengeTask } from '../lib/challenges';
import * as ImagePicker from 'expo-image-picker';
import { CheckCircle2, Circle, Hash, Camera, AlignLeft, Upload, Trash2 } from 'lucide-react-native';

interface TaskRowProps {
  task: ChallengeTask;
  value: any;
  onChangeValue: (taskId: string, val: any) => void;
  mediaUri?: string | null;
  onPickMedia?: (taskId: string, uri: string) => void;
  onRemoveMedia?: (taskId: string) => void;
}

export function TaskRow({
  task,
  value,
  onChangeValue,
  mediaUri,
  onPickMedia,
  onRemoveMedia,
}: TaskRowProps) {
  const { theme } = useThemeStore();

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      onPickMedia?.(task.id, uri);
      onChangeValue(task.id, uri);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {/* Task Header */}
      <View style={styles.header}>
        <View style={[styles.typeIconBadge, { backgroundColor: theme.accentBg }]}>
          {task.type === 'checkbox' && <CheckCircle2 color={theme.accentText} size={16} />}
          {task.type === 'numeric' && <Hash color={theme.accentText} size={16} />}
          {task.type === 'photo' && <Camera color={theme.accentText} size={16} />}
          {task.type === 'text_note' && <AlignLeft color={theme.accentText} size={16} />}
        </View>

        <Text style={[styles.label, { color: theme.textPrimary }]} numberOfLines={2}>
          {task.label}
        </Text>
      </View>

      {/* Task Controls according to Type */}
      {task.type === 'checkbox' && (
        <TouchableOpacity
          style={[
            styles.checkboxBtn,
            {
              backgroundColor: value ? theme.accent : theme.inputBg,
              borderColor: value ? theme.accent : theme.inputBorder,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => onChangeValue(task.id, !value)}
        >
          {value ? (
            <View style={styles.checkContent}>
              <CheckCircle2 color="#FFF" size={18} />
              <Text style={styles.checkTextActive}>Done Today</Text>
            </View>
          ) : (
            <View style={styles.checkContent}>
              <Circle color={theme.textMuted} size={18} />
              <Text style={[styles.checkText, { color: theme.textSecondary }]}>Tap to Mark Done</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {task.type === 'numeric' && (
        <View style={styles.numericRow}>
          <TextInput
            style={[
              styles.numericInput,
              { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
            ]}
            placeholder="0"
            placeholderTextColor={theme.textMuted}
            keyboardType="numeric"
            value={value ? String(value) : ''}
            onChangeText={(val) => onChangeValue(task.id, val)}
          />
          {task.unit ? (
            <View style={[styles.unitBadge, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <Text style={[styles.unitText, { color: theme.textSecondary }]}>{task.unit}</Text>
            </View>
          ) : null}
        </View>
      )}

      {task.type === 'text_note' && (
        <TextInput
          style={[
            styles.noteInput,
            { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
          ]}
          placeholder="Type your notes or key insights here..."
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={3}
          value={value || ''}
          onChangeText={(val) => onChangeValue(task.id, val)}
        />
      )}

      {task.type === 'photo' && (
        <View style={styles.photoContainer}>
          {mediaUri || value ? (
            <View style={styles.previewBox}>
              <Image source={{ uri: mediaUri || value }} style={styles.previewImage} />
              <TouchableOpacity
                style={[styles.removeMediaBtn, { backgroundColor: theme.danger }]}
                onPress={() => {
                  onRemoveMedia?.(task.id);
                  onChangeValue(task.id, null);
                }}
              >
                <Trash2 color="#FFF" size={14} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
              activeOpacity={0.8}
              onPress={handlePickImage}
            >
              <Upload color={theme.accent} size={20} />
              <Text style={[styles.uploadText, { color: theme.accentText }]}>Upload Progress Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  typeIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  checkboxBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  checkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  numericRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numericInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
  },
  unitBadge: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noteInput: {
    height: 76,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    fontSize: 14,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  photoContainer: {
    marginTop: 4,
  },
  uploadBox: {
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewBox: {
    position: 'relative',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
