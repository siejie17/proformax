import { useState, useRef, useEffect, useContext } from 'react';
import {
    View,
    Modal,
    TouchableOpacity,
    Text,
    TextInput,
    FlatList,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { sendMessageToGemini } from '../services/geminiApi';
import Markdown from '@ronradtke/react-native-markdown-display';

const ChatbotModal = ({ isVisible, onClose }) => {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([
        {
            id: '1',
            text: 'Hello! I\'m your AI assistant. How can I help you today?',
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    // Get user profile picture or use default
    const getProfilePicSource = (profilePic = null) => {
        if (profilePic) {
            return { uri: `data:image/jpeg;base64,${profilePic}` };
        }
        return require('../assets/defaultProfilePic.png');
    };

    const userProfilePic = getProfilePicSource(user?.profile_pic);

    const scrollToBottom = () => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        setMessages([
            {
                id: '1',
                text: 'Hello! I\'m your AI assistant. How can I help you today?',
                sender: 'bot',
                timestamp: new Date(),
            },
        ])
    }, [isVisible]);

    const handleSendMessage = async () => {
        if (inputText.trim() === '') return;

        const userMessage = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            const response = await sendMessageToGemini(inputText);

            const botMessage = {
                id: (Date.now() + 1).toString(),
                text: response,
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);

            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: 'Sorry, I encountered an error. Please try again.',
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'user';

        return (
            <View className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'} px-4`}>
                {/* Bot Avatar */}
                {!isUser && (
                    <View className="mr-3">
                        <View className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 items-center justify-center shadow-sm overflow-hidden">
                            <Image
                                source={require('../assets/gemini.png')}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </View>
                    </View>
                )}

                {/* Message Bubble */}
                <View className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <View
                        className={`rounded-2xl px-4 py-2.5 ${isUser
                            ? 'bg-emerald-500 rounded-tr-sm'
                            : 'bg-white border border-gray-100 rounded-tl-sm'
                            }`}
                        style={{
                            shadowColor: isUser ? '#10b981' : '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: isUser ? 0.15 : 0.05,
                            shadowRadius: 3,
                            elevation: 1,
                        }}
                    >
                        {isUser ? (
                            <Text
                                className="text-[15px] leading-5 text-white"
                            >
                                {item.text}
                            </Text>
                        ) : (
                            <Markdown
                                style={{
                                    body: { color: '#1F2937', fontSize: 15, lineHeight: 20 },
                                }}
                            >
                                {item.text}
                            </Markdown>
                        )}
                    </View>

                    {/* Timestamp */}
                    <Text className={`text-[11px] text-gray-400 mt-1 px-1`}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                {/* User Avatar */}
                {isUser && (
                    <View className="ml-3">
                        <Image
                            source={userProfilePic}
                            className="w-8 h-8 rounded-full border border-emerald-200"
                            style={{
                                shadowColor: '#10b981',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                            }}
                        />
                    </View>
                )}
            </View>
        );
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={false}
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
                    {/* Header */}
                    <View
                        className="flex-row items-center justify-between bg-white px-5 py-4 border-b border-gray-100"
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center">
                                <MaterialIcons name="chat-bubble-outline" size={20} color="#10b981" />
                            </View>
                            <View>
                                <Text className="text-lg font-semibold text-gray-900">AI Assistant</Text>
                                <Text className="text-xs text-gray-500">Online</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-9 h-9 rounded-full bg-gray-50 items-center justify-center active:bg-gray-100"
                        >
                            <MaterialIcons name="close" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Messages Area */}
                    <View className="flex-1">
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{
                                flexGrow: 1,
                                paddingTop: 20,
                                // paddingBottom: 16,
                            }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                loading ? (
                                    <View className="flex-row items-center px-4 pb-3">
                                        <View className="mr-3">
                                            <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center">
                                                <MaterialIcons name="more-horiz" size={18} color="#10b981" />
                                            </View>
                                        </View>
                                        <View className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                            <View className="flex-row gap-1.5">
                                                <View className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                                <View className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                                <View className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                            </View>
                                        </View>
                                    </View>
                                ) : null
                            }
                        />
                    </View>

                    {/* Input Area */}
                    <View className="bg-white px-4 pt-3 border-t border-gray-100">
                        <View className="flex-row items-end gap-2.5">
                            <View className="flex-1 bg-gray-50 rounded-3xl px-4 py-2 border border-gray-200">
                                <TextInput
                                    className="text-[12px] text-gray-800 max-h-20"
                                    placeholder="Message..."
                                    placeholderTextColor="#9ca3af"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    editable={!loading}
                                    multiline
                                    onSubmitEditing={handleSendMessage}
                                />
                            </View>
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                disabled={loading || inputText.trim() === ''}
                                className={`rounded-full w-14 h-14 items-center justify-center ${loading || inputText.trim() === ''
                                    ? 'bg-gray-200'
                                    : 'bg-emerald-500 active:bg-emerald-600'
                                    }`}
                                style={{
                                    shadowColor: '#10b981',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: loading || inputText.trim() === '' ? 0 : 0.2,
                                    shadowRadius: 4,
                                    elevation: loading || inputText.trim() === '' ? 0 : 3,
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#9ca3af" />
                                ) : (
                                    <MaterialIcons
                                        name="arrow-upward"
                                        size={24}
                                        color={inputText.trim() === '' ? '#9ca3af' : 'white'}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>

                        <View className="py-4">
                            <Text className="text-xs text-gray-400 text-center">
                                Powered by Google Gemini AI
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default ChatbotModal;