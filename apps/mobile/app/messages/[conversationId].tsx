import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '../../lib/trpc';
import { useAuthStore } from '../../lib/store';
import { uploadAsset } from '../../lib/upload';

interface Message {
  id: string;
  text: string | null;
  mediaUrl: string | null;
  senderId: string;
  senderUsername: string;
  type: string;
  isTyping?: boolean;
  createdAt: string;
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const utils = trpc.useUtils();
  const [text, setText] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList>(null);

  const { data, isLoading } = trpc.messages.history.useQuery({ conversationId, limit: 50 });
  const { data: seenData } = trpc.messages.lastSeen.useQuery({ conversationId });

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      setText('');
      utils.messages.history.invalidate({ conversationId });
    },
  });

  const sendTyping = trpc.messages.typing.useMutation();

  // WS subscription for live messages + typing events
  trpc.messages.subscribe.useSubscription(
    { conversationId },
    {
      onData: (msg: Message) => {
        if (msg.isTyping) {
          if (msg.senderId !== currentUser?.id) {
            setTypingUser(msg.senderUsername);
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => setTypingUser(null), 3000);
          }
        } else {
          setLiveMessages((prev: Message[]) => [...prev, msg]);
          setTypingUser(null);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
        }
      },
    },
  );

  const handleTextChange = useCallback(
    (val: string) => {
      setText(val);
      if (val) sendTyping.mutate({ conversationId });
    },
    [conversationId],
  );

  async function handlePickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    setImageUploading(true);
    try {
      const { mediumUrl } = await uploadAsset(result.assets[0]);
      sendMessage.mutate({ conversationId, type: 'photo', mediaUrl: mediumUrl });
    } finally {
      setImageUploading(false);
    }
  }

  const historicalMessages: Message[] = (data?.items as Message[]) ?? [];
  const liveIds = new Set(historicalMessages.map((m) => m.id));
  const allMessages = [...historicalMessages, ...liveMessages.filter((m) => !liveIds.has(m.id))];

  const lastReadMessageId = seenData?.lastReadMessageId ?? null;
  const outgoing = allMessages.filter((m) => m.senderId === currentUser?.id);
  const lastOutgoingId = outgoing.length > 0 ? outgoing[outgoing.length - 1].id : null;
  const seenMessageId = lastOutgoingId && lastOutgoingId === lastReadMessageId ? lastOutgoingId : null;

  if (isLoading) return <View style={s.center}><ActivityIndicator /></View>;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={allMessages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={s.list}
        renderItem={({ item: msg }) => {
          const isMine = msg.senderId === currentUser?.id;
          return (
            <View>
              <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs, msg.type === 'photo' && s.bubblePhoto]}>
                {msg.type === 'photo' && msg.mediaUrl ? (
                  <Image source={{ uri: msg.mediaUrl }} style={s.photoImage} resizeMode="cover" />
                ) : msg.type === 'post_share' ? (
                  <Text style={[s.bubbleText, isMine && s.bubbleTextMine, s.italic]}>📷 Shared a post</Text>
                ) : (
                  <Text style={[s.bubbleText, isMine && s.bubbleTextMine]}>{msg.text ?? ''}</Text>
                )}
              </View>
              {seenMessageId === msg.id && (
                <Text style={s.seenLabel}>Seen ✓✓</Text>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          typingUser ? (
            <View style={[s.bubble, s.bubbleTheirs, { marginTop: 4 }]}>
              <Text style={[s.bubbleText, s.italic]}>{typingUser} is typing…</Text>
            </View>
          ) : null
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={s.inputRow}>
        <TouchableOpacity
          style={[s.iconBtn, imageUploading && s.sendBtnDisabled]}
          onPress={handlePickImage}
          disabled={imageUploading}
        >
          <Text style={s.iconBtnText}>{imageUploading ? '⏳' : '🖼'}</Text>
        </TouchableOpacity>
        <TextInput
          style={s.input}
          placeholder="Message…"
          value={text}
          onChangeText={handleTextChange}
          multiline
        />
        <TouchableOpacity
          style={[s.sendBtn, (!text.trim() || sendMessage.isPending) && s.sendBtnDisabled]}
          onPress={() => {
            if (text.trim()) sendMessage.mutate({ conversationId, text: text.trim() });
          }}
          disabled={!text.trim() || sendMessage.isPending}
        >
          <Text style={s.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12, paddingBottom: 8 },
  bubble: { maxWidth: '75%', borderRadius: 18, padding: 10, marginVertical: 3 },
  bubbleMine: { backgroundColor: '#0095f6', alignSelf: 'flex-end' },
  bubbleTheirs: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start' },
  bubblePhoto: { padding: 0, overflow: 'hidden' },
  photoImage: { width: 200, height: 200, borderRadius: 18 },
  bubbleText: { fontSize: 15, color: '#000' },
  bubbleTextMine: { color: '#fff' },
  italic: { fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 10 },
  iconBtnText: { fontSize: 22 },
  input: { flex: 1, borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendBtn: { marginLeft: 8, backgroundColor: '#0095f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontWeight: '600' },
  seenLabel: { textAlign: 'right', fontSize: 11, color: '#aaa', marginTop: 2, marginBottom: 2, paddingHorizontal: 4 },
});
