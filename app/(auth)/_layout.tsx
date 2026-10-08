import { Stack } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/src/theme';

export default function AuthLayout() {
  const { status } = useAuth();
  const choosingRole = status === 'choosingRole';
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Protected guard={!choosingRole}>
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      <Stack.Protected guard={choosingRole}>
        <Stack.Screen name="role" options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}
