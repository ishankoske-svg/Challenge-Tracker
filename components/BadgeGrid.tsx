import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ALL_BADGES } from '../lib/badges';
import { useThemeStore } from '../stores/themeStore';
import { Award, Flame, Zap, Star, Activity, Code, Globe } from 'lucide-react-native';

const ICON_MAP: Record<string, any> = {
  award: Award,
  flame: Flame,
  zap: Zap,
  star: Star,
  activity: Activity,
  code: Code,
  globe: Globe,
};

interface BadgeGridProps {
  earnedKeys: string[];
}

export function BadgeGrid({ earnedKeys }: BadgeGridProps) {
  const { theme } = useThemeStore();

  return (
    <View style={styles.grid}>
      {ALL_BADGES.map((badge) => {
        const isEarned = earnedKeys.includes(badge.key);
        const IconComponent = ICON_MAP[badge.icon] || Award;
        
        return (
          <View 
            key={badge.id} 
            style={[
              styles.badgeItem, 
              { backgroundColor: theme.card, borderColor: theme.cardBorder }
            ]}
          >
            <View 
              style={[
                styles.iconContainer, 
                { 
                  backgroundColor: isEarned ? theme.accentBg : theme.inputBg,
                  borderColor: isEarned ? theme.accentBorder : 'transparent',
                  borderWidth: isEarned ? 2 : 0,
                }
              ]}
            >
              <IconComponent 
                color={isEarned ? theme.accent : theme.textMuted} 
                size={28} 
              />
            </View>
            <Text style={[styles.badgeName, { color: isEarned ? theme.textPrimary : theme.textMuted }]}>
              {badge.name}
            </Text>
            <Text style={[styles.badgeDesc, { color: theme.textSecondary }]} numberOfLines={2}>
              {badge.description}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  badgeItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
});
