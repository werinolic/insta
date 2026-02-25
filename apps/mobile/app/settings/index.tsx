import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

const ITEMS = [
  { label: 'Edit profile', route: '/settings/profile' },
  { label: 'Change username', route: '/settings/username' },
  { label: 'Change password', route: '/settings/password' },
] as const;

export default function SettingsMenuScreen() {
  const router = useRouter();
  return (
    <View style={s.root}>
      {ITEMS.map(({ label, route }) => (
        <TouchableOpacity key={route} style={s.row} onPress={() => router.push(route)}>
          <Text style={s.label}>{label}</Text>
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
  arrow: { fontSize: 20, color: '#bbb' },
});
