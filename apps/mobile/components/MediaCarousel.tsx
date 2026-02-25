import { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

interface MediaItem {
  id: string;
  url: string;
  mediumUrl: string | null;
}

interface Props {
  media: MediaItem[];
  height?: number;
}

export function MediaCarousel({ media, height = width }: Props) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  if (media.length === 0) return null;

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  }

  return (
    <View>
      <FlatList
        ref={listRef}
        data={media}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.mediumUrl ?? item.url }}
            style={{ width, height }}
            resizeMode="cover"
          />
        )}
      />
      {media.length > 1 && (
        <View style={s.dots}>
          {media.map((_, i) => (
            <View key={i} style={[s.dot, i === index && s.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 6, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccc' },
  dotActive: { backgroundColor: '#0095f6' },
});
