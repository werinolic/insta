import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  text: string;
  style?: object;
}

export function MentionText({ text, style }: Props) {
  const router = useRouter();
  const parts = text.split(/(@[\w.]+)/g);

  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (/^@[\w.]+$/.test(part)) {
          const username = part.slice(1);
          return (
            <Text
              key={i}
              style={s.mention}
              onPress={() => router.push(`/${username}`)}
            >
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

const s = StyleSheet.create({
  mention: { fontWeight: '700', color: '#0095f6' },
});
