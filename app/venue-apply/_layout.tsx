import { Stack } from 'expo-router';
import { VenueApplyProvider } from '@/src/context/VenueApplyContext';
import { Colors } from '@/src/theme';

export default function VenueApplyLayout() {
  return (
    <VenueApplyProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="details" />
        <Stack.Screen name="halls" />
        <Stack.Screen name="extra" />
        <Stack.Screen name="done" options={{ gestureEnabled: false }} />
      </Stack>
    </VenueApplyProvider>
  );
}
