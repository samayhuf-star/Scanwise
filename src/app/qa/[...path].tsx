import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { QA_MODE } from '@/lib/pro';
import { parseQaUrl } from '@/lib/qa';
import { analyze } from '@/lib/shield';
import { addHistory, setPro } from '@/lib/store';
import { colors } from '@/lib/theme';

/** QA-only deep links for the simulator run. Store builds (QA_MODE off) just go home. */
export default function QaRoute() {
  const { path, raw } = useLocalSearchParams<{ path?: string[] | string; raw?: string }>();
  const parts = Array.isArray(path) ? path : path ? [path] : [];
  const cmd = QA_MODE ? parseQaUrl(`scanwise://qa/${parts.join('/')}${raw ? `?raw=${encodeURIComponent(raw)}` : ''}`) : null;

  useEffect(() => {
    if (!cmd) return;
    console.log('[scanwise-qa]', JSON.stringify(cmd));
    if (cmd.kind === 'pro') {
      setPro(cmd.on);
      router.replace('/');
      return;
    }
    const a = analyze(cmd.raw);
    addHistory({ raw: cmd.raw, format: 'qr', source: 'scan', kind: a.kind, verdict: a.verdict, title: a.title });
    router.replace({ pathname: '/result', params: { raw: cmd.raw, format: 'qr', src: 'scan' } });
  }, [cmd?.kind, raw]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cmd) return <Redirect href="/" />;
  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}
