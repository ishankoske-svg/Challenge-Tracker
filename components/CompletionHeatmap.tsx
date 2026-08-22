import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { HeatmapCell } from '../lib/analytics';

interface CompletionHeatmapProps {
  cells: HeatmapCell[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CompletionHeatmap({ cells }: CompletionHeatmapProps) {
  const { theme } = useThemeStore();

  // Create a 7x24 grid
  const grid: HeatmapCell[][] = Array.from({ length: 7 }, () => Array(24).fill(null));
  
  cells.forEach(cell => {
    grid[cell.dayOfWeek][cell.hour] = cell;
  });

  const getCellColor = (intensity: number) => {
    if (intensity === 0) return theme?.surface || theme?.inputBg || '#151322';
    const hex = theme?.primary || theme?.accent || '#7C6FCD';
    if (hex && typeof hex === 'string' && hex.startsWith('#') && hex.length === 7) {
      // 0.2 to 1.0 opacity
      const alpha = Math.max(0.2, intensity);
      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
      return `${hex}${alphaHex}`;
    }
    
    return hex; 
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Text style={[styles.title, { color: theme.text }]}>Activity Heatmap</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.gridContainer}>
          {/* Header Row (Hours) */}
          <View style={styles.row}>
            <View style={styles.dayLabelContainer} /> {/* Empty corner */}
            {Array.from({ length: 24 }).map((_, h) => (
              <View key={`header-${h}`} style={styles.hourLabelContainer}>
                <Text style={[styles.hourLabel, { color: theme.textMuted }]}>
                  {h % 4 === 0 ? `${h}` : ''}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Day Rows */}
          {grid.map((row, dayIdx) => (
            <View key={`day-${dayIdx}`} style={styles.row}>
              <View style={styles.dayLabelContainer}>
                <Text style={[styles.dayLabel, { color: theme.textMuted }]}>{DAYS[dayIdx]}</Text>
              </View>
              {row.map((cell, hourIdx) => {
                const cellData = cell || { dayOfWeek: dayIdx, hour: hourIdx, count: 0, intensity: 0 };
                return (
                  <View
                    key={`cell-${dayIdx}-${hourIdx}`}
                    style={[
                      styles.cell,
                      { backgroundColor: getCellColor(cellData.intensity) }
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: theme.textMuted }]}>Less</Text>
        <View style={styles.legendColorSteps}>
          <View style={[styles.legendStep, { backgroundColor: theme.surface }]} />
          <View style={[styles.legendStep, { backgroundColor: getCellColor(0.25) }]} />
          <View style={[styles.legendStep, { backgroundColor: getCellColor(0.5) }]} />
          <View style={[styles.legendStep, { backgroundColor: getCellColor(0.75) }]} />
          <View style={[styles.legendStep, { backgroundColor: getCellColor(1) }]} />
        </View>
        <Text style={[styles.legendText, { color: theme.textMuted }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  gridContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayLabelContainer: {
    width: 30,
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  hourLabelContainer: {
    width: 14,
    alignItems: 'center',
  },
  hourLabel: {
    fontSize: 10,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  legendText: {
    fontSize: 10,
  },
  legendColorSteps: {
    flexDirection: 'row',
    gap: 4,
  },
  legendStep: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
