import React, { useState, useRef, useEffect, useContext } from 'react';
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

    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            <View className={`mb-4 flex-row ${isUser ? 'justify-end' : 'justify-start'} px-2`}>
                {/* Bot Avatar */}
                {!isUser && (
                    <View className="mr-2 mt-1">
                        <Image
                            source={require('../assets/gemini.png')}
                            className="w-9 h-9 rounded-full border-2 border-blue-200"
                        />
                    </View>
                )}

                {/* Message Bubble */}
                <View className={`max-w-[75%]`}>
                    <View
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                            isUser
                                ? 'bg-green-600 rounded-tr-md'
                                : 'bg-gray-100 rounded-tl-md'
                        }`}
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                        }}
                    >
                        <Text
                            className={`text-base leading-5 ${
                                isUser ? 'text-white' : 'text-gray-800'
                            }`}
                        >
                            {item.text}
                        </Text>
                    </View>
                    
                    {/* Timestamp */}
                    <Text className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'} px-1`}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                {/* User Avatar */}
                {isUser && (
                    <View className="ml-2 mt-1">
                        <Image
                            source={userProfilePic}
                            className="w-9 h-9 rounded-full border-2 border-blue-200"
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
                        className="flex-row items-center justify-between bg-green-600 px-6 py-4"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                            elevation: 4,
                        }}
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                                <MaterialIcons name="chat" size={24} color="white" />
                            </View>
                            <View>
                                <Text className="text-xl font-bold text-white">AI Assistant</Text>
                                <Text className="text-xs text-green-100">Always here to help</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            onPress={onClose}
                            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center active:bg-white/30"
                        >
                            <MaterialIcons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Messages Area */}
                    <View className="flex-1 bg-gray-50">
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ 
                                flexGrow: 1, 
                                paddingTop: 16,
                                paddingBottom: 8,
                            }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        />
                        
                        {/* Typing Indicator */}
                        {loading && (
                            <View className="flex-row items-center px-4 py-2">
                                <View className="mr-2">
                                    <View className="w-9 h-9 rounded-full bg-green-600 items-center justify-center border-2 border-green-200">
                                        <MaterialIcons name="smart-toy" size={20} color="white" />
                                    </View>
                                </View>
                                <View className="bg-gray-100 rounded-2xl px-4 py-3 rounded-tl-md">
                                    <View className="flex-row gap-1">
                                        <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                                        <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                        <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Input Area */}
                    <View className="border-t border-gray-200 px-4 py-3 bg-white">
                        <View className="flex-row items-end gap-2">
                            <View className="flex-1 bg-gray-100 rounded-3xl px-4 py-2 border border-gray-200">
                                <TextInput
                                    className="text-base text-gray-800 max-h-24"
                                    placeholder="Type your message..."
                                    placeholderTextColor="#9CA3AF"
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
                                className={`rounded-full p-3.5 items-center justify-center ${
                                    loading || inputText.trim() === ''
                                        ? 'bg-gray-300'
                                        : 'bg-green-600 active:bg-green-700'
                                }`}
                                style={{
                                    shadowColor: '#16a34a',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: loading || inputText.trim() === '' ? 0 : 0.3,
                                    shadowRadius: 3,
                                    elevation: loading || inputText.trim() === '' ? 0 : 4,
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <MaterialIcons name="send" size={22} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default ChatbotModal;