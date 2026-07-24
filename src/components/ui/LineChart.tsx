import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { Colors, FontSize } from '../../constants/tokens';
import type { ProgressDataPoint } from '../../types';

interface Props {
  data: ProgressDataPoint[];
  width: number;
  height?: number;
}

export function LineChart({ data, width, height = 140 }: Props) {
  if (data.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const padLeft = 36;
  const padRight = 12;
  const padTop = 10;
  const padBottom = 28;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const volumes = data.map((d) => d.volume);
  const maxV = Math.max(...volumes, 1);
  const minV = 0;

  const toX = (i: number) => padLeft + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padTop + chartH - ((v - minV) / (maxV - minV)) * chartH;

  // Build SVG path
  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.volume).toFixed(1)}`)
    .join(' ');

  // Y-axis grid labels
  const ySteps = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV].reverse();

  // Show every nth label on X axis to avoid crowding
  const xStep = data.length > 10 ? Math.ceil(data.length / 7) : 1;

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      {ySteps.map((v, i) => {
        const y = toY(v);
        return (
          <React.Fragment key={i}>
            <Line
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke={Colors.chartGrid}
              strokeWidth={1}
            />
            <SvgText
              x={padLeft - 4}
              y={y + 4}
              fontSize={9}
              fill={Colors.textMuted}
              textAnchor="end"
            >
              {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v).toString()}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Chart line */}
      <Path d={pathD} stroke={Colors.chartLine} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* X axis labels */}
      {data.map((d, i) => {
        if (i % xStep !== 0) return null;
        return (
          <SvgText
            key={i}
            x={toX(i)}
            y={height - 4}
            fontSize={9}
            fill={Colors.textMuted}
            textAnchor="middle"
          >
            {d.date}
          </SvgText>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});
