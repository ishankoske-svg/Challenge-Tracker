import { supabase, isSupabaseConfigured } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_MEDIA_KEY = '@challengr_demo_media';

export interface MediaUpload {
  id: string;
  daily_log_id: string;
  user_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
  created_at: string;
  local_uri?: string;
}

function generateId(): string {
  return 'med-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// ---------- DEMO STORAGE ----------

async function getDemoMedia(): Promise<MediaUpload[]> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_MEDIA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveDemoMedia(media: MediaUpload[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DEMO_MEDIA_KEY, JSON.stringify(media));
  } catch (err: any) {
    console.warn('AsyncStorage quota exceeded, pruning old demo media...');
    if (media.length > 1) {
      const pruned = media.slice(Math.floor(media.length / 2));
      try {
        await AsyncStorage.setItem(DEMO_MEDIA_KEY, JSON.stringify(pruned));
      } catch {
        await AsyncStorage.removeItem(DEMO_MEDIA_KEY).catch(() => {});
      }
    } else {
      await AsyncStorage.removeItem(DEMO_MEDIA_KEY).catch(() => {});
    }
  }
}

// ---------- PUBLIC API ----------

export async function uploadProgressMedia(
  userId: string,
  dailyLogId: string,
  localUri: string,
  mediaType: 'image' | 'video' = 'image',
): Promise<{ media: MediaUpload | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const newMedia: MediaUpload = {
      id: generateId(),
      daily_log_id: dailyLogId,
      user_id: userId,
      storage_path: localUri,
      media_type: mediaType,
      created_at: new Date().toISOString(),
      local_uri: localUri,
    };

    const existing = await getDemoMedia();
    existing.push(newMedia);
    await saveDemoMedia(existing);

    return { media: newMedia, error: null };
  }

  try {
    const filename = `${userId}/${dailyLogId}_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;

    // Fetch local URI as blob
    const response = await fetch(localUri);
    const blob = await response.blob();

    const { error: uploadErr } = await supabase.storage
      .from('progress-media')
      .upload(filename, blob, {
        contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        upsert: true,
      });

    if (uploadErr) return { media: null, error: uploadErr.message };

    const { data: dbData, error: dbErr } = await supabase
      .from('media_uploads')
      .insert({
        daily_log_id: dailyLogId,
        user_id: userId,
        storage_path: filename,
        media_type: mediaType,
      })
      .select()
      .single();

    if (dbErr) return { media: null, error: dbErr.message };

    return { media: dbData as MediaUpload, error: null };
  } catch (e: any) {
    return { media: null, error: e.message || 'Upload failed' };
  }
}

export async function fetchMediaForLog(
  dailyLogId: string,
  userId: string,
): Promise<{ media: MediaUpload[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const all = await getDemoMedia();
    const filtered = all.filter((m) => m.daily_log_id === dailyLogId && m.user_id === userId);
    return { media: filtered, error: null };
  }

  const { data, error } = await supabase
    .from('media_uploads')
    .select('*')
    .eq('daily_log_id', dailyLogId)
    .eq('user_id', userId);

  if (error) return { media: [], error: error.message };
  return { media: (data as MediaUpload[]) || [], error: null };
}

export async function getMediaUrl(storagePath: string): Promise<string> {
  if (!isSupabaseConfigured() || storagePath.startsWith('file://') || storagePath.startsWith('data:') || storagePath.startsWith('blob:')) {
    return storagePath;
  }

  const { data } = supabase.storage.from('progress-media').getPublicUrl(storagePath);
  return data.publicUrl;
}

export interface ChallengePhotoItem {
  id: string;
  logId: string;
  logDate: string;
  dayNumber?: number;
  uri: string;
}

export async function fetchChallengePhotos(
  challengeId: string,
  userId: string,
  logs: { id: string; log_date: string; day_number?: number }[],
): Promise<ChallengePhotoItem[]> {
  const photoItems: ChallengePhotoItem[] = [];
  const logMap = new Map(logs.map((l) => [l.id, l]));

  if (!isSupabaseConfigured()) {
    const all = await getDemoMedia();
    for (const m of all) {
      if (m.user_id === userId && logMap.has(m.daily_log_id)) {
        const log = logMap.get(m.daily_log_id)!;
        photoItems.push({
          id: m.id,
          logId: m.daily_log_id,
          logDate: log.log_date,
          dayNumber: log.day_number,
          uri: m.storage_path || m.local_uri || '',
        });
      }
    }
  } else {
    const logIds = logs.map((l) => l.id);
    if (logIds.length === 0) return [];
    const { data } = await supabase
      .from('media_uploads')
      .select('*')
      .in('daily_log_id', logIds);

    if (data) {
      for (const m of data) {
        const log = logMap.get(m.daily_log_id);
        const url = await getMediaUrl(m.storage_path);
        photoItems.push({
          id: m.id,
          logId: m.daily_log_id,
          logDate: log?.log_date || '',
          dayNumber: log?.day_number,
          uri: url,
        });
      }
    }
  }

  return photoItems.sort((a, b) => new Date(a.logDate).getTime() - new Date(b.logDate).getTime());
}
