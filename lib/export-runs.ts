import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';

export async function shareJsonExport(filenameBase: string, json: string) {
  if (Platform.OS === 'web') {
    await Share.share({ message: json, title: 'RaceTrckr export' });
    return;
  }

  const base = cacheDirectory;
  if (!base) {
    await Share.share({ message: json, title: 'RaceTrckr export' });
    return;
  }

  const safeName = filenameBase.replace(/[^a-z0-9-_]/gi, '_').slice(0, 40);
  const path = `${base}racetrckr_${safeName}_${Date.now()}.json`;
  await writeAsStringAsync(path, json, { encoding: 'utf8' });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'Export race data'
    });
  } else {
    await Share.share({ message: json });
  }
}
