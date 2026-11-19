import QRCode from 'qrcode';
import { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

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

