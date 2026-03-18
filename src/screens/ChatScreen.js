import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Bubble, GiftedChat, InputToolbar, Send } from 'react-native-gifted-chat';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
import EventSource from 'react-native-sse';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import apiClient from '../api/axiosConfig';
import AnimatedBackground from '../components/AnimatedBackground';
import COLORS from '../constants/colors';

const BOT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/6134/6134346.png';

// --- STABLE UI COMPONENTS ---

const renderBubble = (props) => (
  <Bubble
    {...props}
    wrapperStyle={{
      right: { 
        backgroundColor: COLORS.primaryGreen, 
        elevation: 2,
        borderRadius: 18,
        borderBottomRightRadius: 4, 
      },
      left: { 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        elevation: 1,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
      },
    }}
    renderMessageText={(messageProps) => {
      const { currentMessage } = messageProps;
      if (!currentMessage.text || currentMessage.text.trim() === "") {
        return null;
      }
      return (
        <View style={{ paddingHorizontal: 8, paddingVertical: 2 }}>
          <Markdown
            style={{
              body: {
                color: currentMessage.user._id === 2 ? '#333' : '#fff',
                fontSize: 16,
                marginTop: 0,
                marginBottom: 0,
              },
            }}
          >
            {currentMessage.text}
          </Markdown>
        </View>
      );
    }}
  />
);

const renderCustomView = (props) => {
  const { currentMessage } = props;
  if (currentMessage.user._id === 2 && (!currentMessage.text || currentMessage.text.trim() === "")) {
    return (
      <View style={styles.inlineLoadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primaryGreen} />
        <Text style={styles.inlineLoadingText}>MedMate is thinking...</Text>
      </View>
    );
  }
  return null;
};

const renderSend = (props) => {
  const isTextEmpty = !props.text || props.text.trim().length === 0;
  return (
    <Send {...props} alwaysShowSend={true} disabled={isTextEmpty} containerStyle={styles.sendContainer}>
      <View style={[styles.sendButtonContainer, { backgroundColor: isTextEmpty ? '#E0E0E0' : COLORS.primaryGreen }]}>
        <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
      </View>
    </Send>
  );
};

const renderInputToolbar = (props) => (
  <InputToolbar
    {...props}
    containerStyle={styles.inputToolbar}
    primaryStyle={{ alignItems: 'flex-end', paddingHorizontal: 6 }}
  />
);

// --- MAIN COMPONENT ---

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const headerHeight = useHeaderHeight();
  
  const esRef = useRef(null);
  const timeoutRef = useRef(null);
  const messagesRef = useRef([]);

  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    return () => {
      if (esRef.current) esRef.current.close();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Hello! I am **MedMate AI**. Ask me anything about medicines, symptoms, or general health.',
        createdAt: new Date(),
        user: { _id: 2, name: 'MedMate AI', avatar: BOT_AVATAR },
      },
    ]);
  }, []);

  const getGeminiHistory = () => {
    let historyMessages = [...messagesRef.current].reverse();
    historyMessages = historyMessages.filter((msg) => msg._id !== 1);
    return historyMessages.slice(-10).map((msg) => ({
      role: msg.user._id === 1 ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));
  };

  const onSend = useCallback(
    async (newMessages = []) => {
      const userMessage = newMessages[0];
      setMessages((prev) => GiftedChat.append(prev, newMessages));
      setIsTyping(true);

      const botMsgId = Date.now();
      
      // FIXED: The variable that got cut off is fully restored here
      const initialBotMessage = {
        _id: botMsgId,
        text: '', 
        createdAt: new Date(),
        user: { _id: 2, name: 'MedMate AI', avatar: BOT_AVATAR },
      };

      setMessages((prev) => GiftedChat.append(prev, [initialBotMessage]));

      timeoutRef.current = setTimeout(() => {
        setMessages((prev) => {
          const updated = [...prev];
          const index = updated.findIndex((m) => m._id === botMsgId);
          if (index > -1 && updated[index].text === '') {
            updated[index] = { 
              ...updated[index], 
              text: "I'm having trouble connecting to the medical server. Please try again." 
            };
            if (esRef.current) esRef.current.close();
            setIsTyping(false);
          }
          return updated;
        });
      }, 45000);

      try {
        const baseURL = apiClient.defaults.baseURL.replace(/\/$/, '');
        if (esRef.current) esRef.current.close();

        esRef.current = new EventSource(`${baseURL}/chat`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          method: 'POST',
          body: JSON.stringify({
            message: userMessage.text,
            history: getGeminiHistory(),
          }),
        });

        esRef.current.addEventListener('message', (event) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          if (event.data === '[DONE]') {
            esRef.current?.close();
            setIsTyping(false);
            return;
          }

          try {
            const parsed = JSON.parse(event.data);
            const newChunk = parsed.text;
            if (!newChunk) return;

            setMessages((prev) => {
              const updated = [...prev];
              const index = updated.findIndex((m) => m._id === botMsgId);
              if (index > -1) {
                updated[index] = { ...updated[index], text: updated[index].text + newChunk };
              }
              return updated;
            });
          } catch (e) {}
        });

        esRef.current.addEventListener('error', () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setIsTyping(false);
        });
      } catch (error) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsTyping(false);
      }
    },
    [token]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[COLORS.lightGreen || '#E8F5E9', COLORS.white]} style={{ flex: 1 }}>
          <AnimatedBackground />
        </LinearGradient>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={headerHeight}
      >
        <View style={styles.chatWrapper}>
          <GiftedChat
            messages={messages}
            onSend={(msgs) => onSend(msgs)}
            user={{ _id: 1 }}
            renderBubble={renderBubble}
            renderSend={renderSend}
            renderInputToolbar={renderInputToolbar}
            renderCustomView={renderCustomView}
            isCustomViewBottom={false}
            placeholder="Type your health question..."
            alwaysShowSend={true}
            scrollToBottom
            minInputToolbarHeight={60}
            messagesContainerStyle={{ backgroundColor: 'transparent' }}
            listViewProps={{ style: { backgroundColor: 'transparent' } }}
            textInputProps={{ multiline: true, style: styles.textInput }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  chatWrapper: { flex: 1 },
  inputToolbar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 6,
  },
  textInput: {
    color: '#000000',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 8,
    marginLeft: 4,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    minHeight: 45,
    maxHeight: 150,
  },
  sendContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    alignSelf: 'flex-end', 
    marginBottom: 2 
  },
  sendButtonContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  inlineLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    minWidth: 150,
  },
  inlineLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});