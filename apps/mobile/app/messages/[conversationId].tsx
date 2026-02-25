import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useAuthStore } from '../../lib/store';

interface Message {
  id: string;
  text: string | null;
  senderId: string;
  createdAt: string;
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const utils = trpc.useUtils();
  const [text, setText] = useState('');
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const listRef = useRef<FlatList>(null);

  const { data, isLoading } = trpc.messages.history.useQuery({ conversationId, limit: 50 });

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      setText('');
      utils.messages.history.invalidate({ conversationId });
    },
  });

  // WS subscription for live messages
  trpc.messages.subscribe.useSubscription(
    { conversationId },
    {
      onData: (msg: Message) => {
        setLiveMessages((prev: Message[]) => [...prev, msg]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      },
    },
  );

  const historicalMessages: Message[] = data?.items as Message[] ?? [];
  const allMessages = [...historicalMessages, ...liveMessages.filter((m) => !historicalMessages.find((h) => h.id === m.id))];

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
            <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}>
              <Text style={[s.bubbleText, isMine && s.bubbleTextMine]}>{msg.text ?? ''}</Text>
            </View>
          );
        }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Message…"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={s.sendBtn}
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
  bubbleText: { fontSize: 15, color: '#000' },
  bubbleTextMine: { color: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  input: { flex: 1, borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendBtn: { marginLeft: 8, backgroundColor: '#0095f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtnText: { color: '#fff', fontWeight: '600' },
});
