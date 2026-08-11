import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { ChallengeTask } from '../lib/challenges';
import * as ImagePicker from 'expo-image-picker';
import {
  CheckCircle2,
  Circle,
  Hash,
  Camera,
  Upload,
  Trash2,
  Maximize2,
  X,
  Crop,
} from 'lucide-react-native';

interface TaskRowProps {
  task: ChallengeTask;
  value: any;
  onChangeValue: (taskId: string, val: any) => void;
  mediaUri?: string | null;
  onPickMedia?: (taskId: string, uri: string) => void;
  onRemoveMedia?: (taskId: string) => void;
}

type FrameFitMode = 'contain' | 'cover' | 'auto';

export function TaskRow({
  task,
  value,
  onChangeValue,
  mediaUri,
  onPickMedia,
  onRemoveMedia,
}: TaskRowProps) {
  const { theme } = useThemeStore();
  
  // Normalize legacy primitive values to the new object schema
  const normalizedValue = typeof value === 'object' && value !== null 
    ? value 
    : { 
        completed: !!value, 
        note: task.type === 'text_note' ? (value || '') : '', 
        value: task.type !== 'checkbox' && task.type !== 'text_note' ? (value || null) : null 
      };

  const currentUri = mediaUri || (typeof normalizedValue.value === 'string' && normalizedValue.value.startsWith('data:') ? normalizedValue.value : null);

  const [fitMode, setFitMode] = useState<FrameFitMode>('contain');
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [fullScreenVisible, setFullScreenVisible] = useState<boolean>(false);

  useEffect(() => {
    if (currentUri && typeof currentUri === 'string') {
      Image.getSize(
        currentUri,
        (width, height) => {
          if (width > 0 && height > 0) {
            setAspectRatio(width / height);
          }
        },
        () => {
          setAspectRatio(1.33); // fallback 4:3
        },
      );
    }
  }, [currentUri]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      onPickMedia?.(task.id, uri);
      onChangeValue(task.id, { ...normalizedValue, value: 'uploaded_media' });
    }
  };

  const cycleFitMode = () => {
    if (fitMode === 'contain') setFitMode('cover');
    else if (fitMode === 'cover') setFitMode('auto');
    else setFitMode('contain');
  };

  const getFrameStyle = () => {
    if (fitMode === 'auto' && aspectRatio) {
      const calculatedHeight = Math.min(Math.max(200, 320 / aspectRatio), 420);
      return { height: calculatedHeight };
    }
    if (fitMode === 'cover') {
      return { height: 260 };
    }
    return { height: 240 };
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {/* Universal Task Header (Checkbox + Label) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.headerCheckbox,
            { 
              backgroundColor: normalizedValue.completed ? theme.accent : theme.inputBg,
              borderColor: normalizedValue.completed ? theme.accent : theme.inputBorder 
            }
          ]}
          activeOpacity={0.8}
          onPress={() => onChangeValue(task.id, { ...normalizedValue, completed: !normalizedValue.completed })}
        >
          {normalizedValue.completed ? (
            <CheckCircle2 color="#FFF" size={18} />
          ) : (
            <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: theme.textMuted }} />
          )}
        </TouchableOpacity>

        <Text style={[styles.label, { color: theme.textPrimary }]} numberOfLines={2}>
          {task.label}
        </Text>
      </View>

      {/* Task Specific Inputs */}
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
            value={normalizedValue.value ? String(normalizedValue.value) : ''}
            onChangeText={(val) => onChangeValue(task.id, { ...normalizedValue, value: val })}
          />
          {task.unit ? (
            <View style={[styles.unitBadge, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <Text style={[styles.unitText, { color: theme.textSecondary }]}>{task.unit}</Text>
            </View>
          ) : null}
        </View>
      )}

      {task.type === 'photo' && (
        <View style={styles.photoContainer}>
          {currentUri ? (
            <View style={styles.mediaWrapper}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setFullScreenVisible(true)}
                style={[
                  styles.previewBox,
                  getFrameStyle(),
                  { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                ]}
              >
                <Image
                  source={{ uri: currentUri }}
                  style={styles.previewImage}
                  resizeMode={fitMode === 'auto' ? 'contain' : fitMode}
                />

                <View style={styles.controlOverlay}>
                  <TouchableOpacity style={[styles.overlayBtn, { backgroundColor: 'rgba(0,0,0,0.65)' }]} onPress={cycleFitMode}>
                    <Crop color="#FFF" size={14} />
                    <Text style={styles.overlayBtnText}>{fitMode === 'contain' ? 'Fit' : fitMode === 'cover' ? 'Fill' : 'Auto'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.overlayBtn, { backgroundColor: 'rgba(0,0,0,0.65)' }]} onPress={() => setFullScreenVisible(true)}>
                    <Maximize2 color="#FFF" size={14} />
                    <Text style={styles.overlayBtnText}>Expand</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.overlayBtn, { backgroundColor: 'rgba(255,107,107,0.85)' }]}
                    onPress={() => {
                      onRemoveMedia?.(task.id);
                      onChangeValue(task.id, { ...normalizedValue, value: null });
                    }}
                  >
                    <Trash2 color="#FFF" size={14} />
                  </TouchableOpacity>
                </View>
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

          {currentUri && (
            <Modal visible={fullScreenVisible} transparent animationType="fade">
              <View style={styles.modalBg}>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setFullScreenVisible(false)}>
                  <X color="#FFF" size={24} />
                </TouchableOpacity>
                <Image source={{ uri: currentUri }} style={styles.modalImage} resizeMode="contain" />
              </View>
            </Modal>
          )}
        </View>
      )}

      {/* Universal Notes Field */}
      <TextInput
        style={[
          styles.globalNoteInput,
          { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
          (task.type === 'numeric' || task.type === 'photo') && { marginTop: 12 }
        ]}
        placeholder="Add a note (optional)..."
        placeholderTextColor={theme.textMuted}
        multiline
        numberOfLines={2}
        value={normalizedValue.note || ''}
        onChangeText={(val) => onChangeValue(task.id, { ...normalizedValue, note: val })}
      />
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
    gap: 12,
    marginBottom: 12,
  },
  headerCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
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
  globalNoteInput: {
    minHeight: 54,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  photoContainer: {
    marginTop: 4,
  },
  uploadBox: {
    height: 68,
    borderRadius: 14,
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
  mediaWrapper: {
    marginTop: 4,
  },
  previewBox: {
    position: 'relative',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  controlOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  overlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  overlayBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  modalImage: {
    width: '100%',
    height: '80%',
    borderRadius: 16,
  },
});
