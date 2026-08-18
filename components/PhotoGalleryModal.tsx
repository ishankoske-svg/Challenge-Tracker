import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { ChallengePhotoItem } from '../lib/storage';
import {
  X,
  Layers,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  Calendar,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PhotoGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  challengeTitle: string;
  photos: ChallengePhotoItem[];
}

export function PhotoGalleryModal({
  visible,
  onClose,
  challengeTitle,
  photos,
}: PhotoGalleryModalProps) {
  const { theme } = useThemeStore();

  const [activeTab, setActiveTab] = useState<'compare' | 'scrubber' | 'timelapse'>('compare');

  // Compare state
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(Math.max(0, photos.length - 1));

  // Scrubber state
  const [scrubberIndex, setScrubberIndex] = useState(0);

  // Timelapse state
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelapseSpeed, setTimelapseSpeed] = useState<number>(600); // ms per frame
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (photos.length > 0) {
      setBeforeIndex(0);
      setAfterIndex(photos.length - 1);
      setScrubberIndex(photos.length - 1);
    }
  }, [photos]);

  // Timelapse animation loop
  useEffect(() => {
    if (isPlaying && photos.length > 1) {
      timerRef.current = setInterval(() => {
        setScrubberIndex((prev) => (prev + 1) % photos.length);
      }, timelapseSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timelapseSpeed, photos.length]);

  const hasPhotos = photos.length > 0;
  const beforePhoto = photos[beforeIndex];
  const afterPhoto = photos[afterIndex];
  const currentScrubberPhoto = photos[scrubberIndex];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleContainer}>
              <ImageIcon color={theme.accent} size={20} />
              <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                {challengeTitle} · Gallery
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
              <X color={theme.text} size={18} />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('compare');
                setIsPlaying(false);
              }}
              style={[
                styles.tabBtn,
                activeTab === 'compare' && { backgroundColor: theme.primary },
              ]}
            >
              <Layers color={activeTab === 'compare' ? '#FFFFFF' : theme.textSecondary} size={14} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'compare' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Side-by-Side
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('scrubber');
                setIsPlaying(false);
              }}
              style={[
                styles.tabBtn,
                activeTab === 'scrubber' && { backgroundColor: theme.primary },
              ]}
            >
              <Calendar color={activeTab === 'scrubber' ? '#FFFFFF' : theme.textSecondary} size={14} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'scrubber' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Day Scrubber
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('timelapse')}
              style={[
                styles.tabBtn,
                activeTab === 'timelapse' && { backgroundColor: theme.primary },
              ]}
            >
              <Sparkles color={activeTab === 'timelapse' ? '#FFFFFF' : theme.textSecondary} size={14} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'timelapse' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Timelapse
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          {!hasPhotos ? (
            <View style={styles.emptyContainer}>
              <ImageIcon color={theme.textMuted} size={48} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Progress Photos Yet</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Add photo tasks in your daily log to track your visual transformation day by day.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
              {/* TAB 1: SIDE BY SIDE COMPARISON */}
              {activeTab === 'compare' && (
                <View style={styles.compareContainer}>
                  <View style={styles.compareImagesRow}>
                    {/* Before Photo */}
                    <View style={styles.compareColumn}>
                      <View style={[styles.photoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <View style={[styles.dayBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                          <Text style={styles.dayBadgeText}>
                            Day {beforePhoto?.dayNumber ?? 1}
                          </Text>
                        </View>
                        {beforePhoto?.uri ? (
                          <Image source={{ uri: beforePhoto.uri }} style={styles.compareImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.placeholderImg}>
                            <Text style={{ color: theme.textMuted }}>No Image</Text>
                          </View>
                        )}
                        <Text style={[styles.photoDate, { color: theme.textSecondary }]}>
                          {beforePhoto?.logDate}
                        </Text>
                      </View>
                      {/* Before Selector */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerStrip}>
                        {photos.map((p, idx) => (
                          <TouchableOpacity
                            key={p.id}
                            onPress={() => setBeforeIndex(idx)}
                            style={[
                              styles.miniThumbnail,
                              { borderColor: beforeIndex === idx ? theme.primary : 'transparent' },
                            ]}
                          >
                            <Image source={{ uri: p.uri }} style={styles.miniImg} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* After Photo */}
                    <View style={styles.compareColumn}>
                      <View style={[styles.photoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <View style={[styles.dayBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                          <Text style={styles.dayBadgeText}>
                            Day {afterPhoto?.dayNumber ?? photos.length}
                          </Text>
                        </View>
                        {afterPhoto?.uri ? (
                          <Image source={{ uri: afterPhoto.uri }} style={styles.compareImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.placeholderImg}>
                            <Text style={{ color: theme.textMuted }}>No Image</Text>
                          </View>
                        )}
                        <Text style={[styles.photoDate, { color: theme.textSecondary }]}>
                          {afterPhoto?.logDate}
                        </Text>
                      </View>
                      {/* After Selector */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerStrip}>
                        {photos.map((p, idx) => (
                          <TouchableOpacity
                            key={p.id}
                            onPress={() => setAfterIndex(idx)}
                            style={[
                              styles.miniThumbnail,
                              { borderColor: afterIndex === idx ? theme.accent : 'transparent' },
                            ]}
                          >
                            <Image source={{ uri: p.uri }} style={styles.miniImg} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={[styles.comparisonInsights, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Sparkles color={theme.accent} size={16} />
                    <Text style={[styles.insightText, { color: theme.text }]}>
                      Comparing Day {beforePhoto?.dayNumber ?? 1} to Day {afterPhoto?.dayNumber ?? photos.length} ({Math.abs((afterPhoto?.dayNumber ?? 1) - (beforePhoto?.dayNumber ?? 1))} days apart)
                    </Text>
                  </View>
                </View>
              )}

              {/* TAB 2 & 3: SCRUBBER & TIMELAPSE */}
              {(activeTab === 'scrubber' || activeTab === 'timelapse') && (
                <View style={styles.scrubberContainer}>
                  <View style={[styles.largePhotoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={[styles.largeDayBadge, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                      <Text style={styles.largeDayText}>
                        Day {currentScrubberPhoto?.dayNumber ?? scrubberIndex + 1}
                      </Text>
                      <Text style={styles.largeDateText}>
                        {currentScrubberPhoto?.logDate}
                      </Text>
                    </View>
                    {currentScrubberPhoto?.uri ? (
                      <Image source={{ uri: currentScrubberPhoto.uri }} style={styles.largeImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.placeholderImg}>
                        <Text style={{ color: theme.textMuted }}>No Image</Text>
                      </View>
                    )}
                  </View>

                  {/* Scrubber Controls */}
                  <View style={styles.scrubberControls}>
                    <TouchableOpacity
                      onPress={() => setScrubberIndex((prev) => Math.max(0, prev - 1))}
                      disabled={scrubberIndex === 0}
                      style={[styles.stepBtn, { backgroundColor: theme.surface }]}
                    >
                      <ChevronLeft color={scrubberIndex === 0 ? theme.textMuted : theme.text} size={20} />
                    </TouchableOpacity>

                    <Text style={[styles.scrubberCounter, { color: theme.text }]}>
                      {scrubberIndex + 1} / {photos.length}
                    </Text>

                    <TouchableOpacity
                      onPress={() => setScrubberIndex((prev) => Math.min(photos.length - 1, prev + 1))}
                      disabled={scrubberIndex === photos.length - 1}
                      style={[styles.stepBtn, { backgroundColor: theme.surface }]}
                    >
                      <ChevronRight color={scrubberIndex === photos.length - 1 ? theme.textMuted : theme.text} size={20} />
                    </TouchableOpacity>
                  </View>

                  {/* Thumbnail Strip */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailStrip}>
                    {photos.map((p, idx) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setScrubberIndex(idx)}
                        style={[
                          styles.scrubberThumb,
                          { borderColor: scrubberIndex === idx ? theme.primary : 'transparent' },
                        ]}
                      >
                        <Image source={{ uri: p.uri }} style={styles.scrubberThumbImg} />
                        <Text style={[styles.thumbDayText, { color: scrubberIndex === idx ? theme.primary : theme.textMuted }]}>
                          D{p.dayNumber ?? idx + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Timelapse Playback Bar */}
                  {activeTab === 'timelapse' && (
                    <View style={[styles.timelapsePanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <TouchableOpacity
                        onPress={() => setIsPlaying(!isPlaying)}
                        style={[styles.playBtn, { backgroundColor: theme.primary }]}
                      >
                        {isPlaying ? <Pause color="#FFFFFF" size={18} /> : <Play color="#FFFFFF" size={18} />}
                        <Text style={styles.playBtnText}>{isPlaying ? 'Pause' : 'Play Timelapse'}</Text>
                      </TouchableOpacity>

                      <View style={styles.speedOptions}>
                        {[1000, 500, 250].map((speed, i) => (
                          <TouchableOpacity
                            key={speed}
                            onPress={() => setTimelapseSpeed(speed)}
                            style={[
                              styles.speedBtn,
                              { backgroundColor: timelapseSpeed === speed ? theme.accent : theme.card },
                            ]}
                          >
                            <Text style={[styles.speedText, { color: timelapseSpeed === speed ? '#000000' : theme.textSecondary }]}>
                              {i === 0 ? '1x' : i === 1 ? '2x' : '4x'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contentScroll: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  compareContainer: {
    gap: 14,
  },
  compareImagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compareColumn: {
    flex: 1,
  },
  photoCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 8,
  },
  dayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  compareImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  placeholderImg: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDate: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  pickerStrip: {
    marginTop: 8,
    flexDirection: 'row',
  },
  miniThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    marginRight: 6,
    overflow: 'hidden',
  },
  miniImg: {
    width: '100%',
    height: '100%',
  },
  comparisonInsights: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  scrubberContainer: {
    gap: 14,
    alignItems: 'center',
  },
  largePhotoCard: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeDayBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  largeDayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  largeDateText: {
    color: '#CCCCCC',
    fontSize: 10,
  },
  largeImage: {
    width: '100%',
    height: '100%',
  },
  scrubberControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrubberCounter: {
    fontSize: 14,
    fontWeight: '700',
  },
  thumbnailStrip: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 6,
  },
  scrubberThumb: {
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderRadius: 8,
    padding: 2,
  },
  scrubberThumbImg: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  thumbDayText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  timelapsePanel: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  speedOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  speedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  speedText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
