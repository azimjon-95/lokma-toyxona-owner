import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, HIT_SLOP } from '../../theme';

/** Sarlavhaning o'ng tomonidagi ikonka tugmasi */
export function PageHeaderAction({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={28} color={Colors.primaryDark} />
    </Pressable>
  );
}
