import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

const ITEMS = [
  { label: 'Edit profile', route: '/settings/profile', danger: false },
  { label: 'Change username', route: '/settings/username', danger: false },
  { label: 'Change password', route: '/settings/password', danger: false },
  { label: 'Delete account', route: '/settings/delete-account', danger: true },
] as const;

export default function SettingsMenuScreen() {
  const router = useRouter();
  return (
    <View style={s.root}>
      {ITEMS.map(({ label, route, danger }) => (
        <TouchableOpacity key={route} style={s.row} onPress={() => router.push(route)}>
          <Text style={[s.label, danger && s.danger]}>{label}</Text>
          <Text style={s.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  label: { flex: 1, fontSize: 16 },
  danger: { color: '#e44' },
  arrow: { fontSize: 20, color: '#bbb' },
});
