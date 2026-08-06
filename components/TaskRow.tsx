import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Modal, Dimensions } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { ChallengeTask } from '../lib/challenges';
import * as ImagePicker from 'expo-image-picker';
import {
  CheckCircle2,
  Circle,
  Hash,
  Camera,
  AlignLeft,
  Upload,
  Trash2,
  Maximize2,
  X,
  Crop,
  Minimize2,
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
  const currentUri = mediaUri || value;

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
      onChangeValue(task.id, uri);
    }
  };

  const cycleFitMode = () => {
    if (fitMode === 'contain') setFitMode('cover');
    else if (fitMode === 'cover') setFitMode('auto');
    else setFitMode('contain');
  };

  // Determine height based on fitMode and aspect ratio
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
          {currentUri ? (
            <View style={styles.mediaWrapper}>
              {/* Image Preview Container */}
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

                {/* Overlaid Controls */}
                <View style={styles.controlOverlay}>
                  <TouchableOpacity
                    style={[styles.overlayBtn, { backgroundColor: 'rgba(0,0,0,0.65)' }]}
                    onPress={cycleFitMode}
                  >
                    <Crop color="#FFF" size={14} />
                    <Text style={styles.overlayBtnText}>
                      {fitMode === 'contain' ? 'Fit' : fitMode === 'cover' ? 'Fill' : 'Auto'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.overlayBtn, { backgroundColor: 'rgba(0,0,0,0.65)' }]}
                    onPress={() => setFullScreenVisible(true)}
                  >
                    <Maximize2 color="#FFF" size={14} />
                    <Text style={styles.overlayBtnText}>Expand</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.overlayBtn, { backgroundColor: 'rgba(255,107,107,0.85)' }]}
                    onPress={() => {
                      onRemoveMedia?.(task.id);
                      onChangeValue(task.id, null);
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

          {/* Full Screen Lightbox Modal */}
          {currentUri && (
            <Modal visible={fullScreenVisible} transparent animationType="fade">
              <View style={styles.modalBg}>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setFullScreenVisible(false)}
                >
                  <X color="#FFF" size={24} />
                </TouchableOpacity>

                <Image
                  source={{ uri: currentUri }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </View>
            </Modal>
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
