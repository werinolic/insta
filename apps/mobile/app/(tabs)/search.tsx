import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const { data, isLoading } = trpc.users.search.useQuery(
    { query },
    { enabled: query.length > 0 },
  );

  return (
    <View style={styles.root}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search users…"
        autoCapitalize="none"
        value={query}
        onChangeText={setQuery}
        clearButtonMode="while-editing"
      />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => router.push(`/${item.username}`)}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
              <View>
                <Text style={styles.username}>{item.username}</Text>
                {item.fullName ? <Text style={styles.fullName}>{item.fullName}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query.length > 0 ? <Text style={styles.empty}>No users found.</Text> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  searchInput: { margin: 16, borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 8, padding: 10, fontSize: 15 },
  loader: { marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#ddd' },
  username: { fontWeight: '600', fontSize: 14 },
  fullName: { color: '#888', fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 60, color: '#888' },
});
