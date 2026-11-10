import QRCode from 'qrcode';
import { forwardRef, useMemo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { encodeBarcode, type BarFormat } from '@/lib/generate';

type QrProps = { value: string; size?: number; fg?: string; bg?: string; ecc?: 'L' | 'M' | 'Q' | 'H' };

/** Renders a QR code as one SVG path. Wrapped in a plain View so it can be captured to an image. */
export const QrView = forwardRef<any, QrProps>(function QrView(
  { value, size = 260, fg = '#000000', bg = '#FFFFFF', ecc = 'M' },
  ref,
) {
  const { d, n } = useMemo(() => {
    try {
      const qr = QRCode.create(value || ' ', { errorCorrectionLevel: ecc });
      const count = qr.modules.size;
      const data = qr.modules.data;
      let path = '';
      const quiet = 4;
      for (let y = 0; y < count; y++) {
        let x = 0;
        while (x < count) {
          if (data[y * count + x]) {
            let run = 1;
            while (x + run < count && data[y * count + x + run]) run++;
            path += `M${x + quiet} ${y + quiet}h${run}v1h-${run}z`;
            x += run;
          } else x++;
        }
      }
      return { d: path, n: count + quiet * 2 };
    } catch {
      return { d: '', n: 29 };
    }
  }, [value, ecc]);

  return (
    <View ref={ref} collapsable={false} style={{ width: size, height: size, backgroundColor: bg }}>
      <Svg width={size} height={size} viewBox={`0 0 ${n} ${n}`}>
        <Rect x={0} y={0} width={n} height={n} fill={bg} />
        <Path d={d} fill={fg} />
      </Svg>
    </View>
  );
});

type BarProps = { value: string; format: BarFormat; width?: number; height?: number };

export const BarcodeView = forwardRef<any, BarProps>(function BarcodeView(
  { value, format, width = 300, height = 120 },
  ref,
) {
  const enc = useMemo(() => encodeBarcode(value, format), [value, format]);
  if (!enc.ok) return null;
  const quiet = 10;
  const total = enc.bits.length + quiet * 2;
  let d = '';
  let i = 0;
  while (i < enc.bits.length) {
    if (enc.bits[i] === '1') {
      let run = 1;
      while (i + run < enc.bits.length && enc.bits[i + run] === '1') run++;
      d += `M${i + quiet} 0h${run}v${height - 22}h-${run}z`;
      i += run;
    } else i++;
  }
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width, backgroundColor: '#fff', alignItems: 'center', paddingBottom: 6 }}>
      <Svg width={width} height={height - 22} viewBox={`0 0 ${total} ${height - 22}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={total} height={height - 22} fill="#fff" />
        <Path d={d} fill="#000" />
      </Svg>
      <Text style={{ color: '#000', fontSize: 14, letterSpacing: 2, marginTop: 4 }}>{enc.label}</Text>
    </View>
  );
});
