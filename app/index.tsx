import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'sui_onboarding_done';

export default function Index() {
  const [target, setTarget] = useState<'/onboarding' | '/(tabs)' | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY).then((value) => {
      setTarget(value === 'true' ? '/(tabs)' : '/onboarding');
    });
  }, []);

  if (!target) return <View style={{ flex: 1 }} />;
  return <Redirect href={target} />;
}
