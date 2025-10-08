import { View, Text, Modal, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Markdown from '@ronradtke/react-native-markdown-display';

const InfoGuideModal = ({ isVisible, info, onClose }) => {
    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            statusBarTranslucent
        >
            <View className="flex-1 bg-black/40 justify-center items-center px-6">
                <SafeAreaView>
                    <StatusBar backgroundColor="rgba(0,0,0,0.4)" barStyle="light-content" />
                </SafeAreaView>

                <View className="bg-white w-[90%] max-w-[340px] max-h-[80%] rounded-3xl shadow-2xl">
                    {/* Header with close button */}
                    <View className="flex-row justify-between items-center px-5 pt-5 pb-3 bg-gray-50/50 border-b border-gray-100">
                        <Text className="text-lg font-semibold text-gray-900">Information</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-9 h-9 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close" size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView
                        className="px-6 pt-2 pb-5"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingTop: 8 }}
                    >
                        <View className="w-full">
                            <Markdown
                                style={{
                                    body: { flexWrap: 'wrap', color: '#1F2937', fontSize: 14, lineHeight: 24 },
                                    bullet_list: { flexWrap: 'wrap' },
                                    list_item: { flexWrap: 'wrap', color: '#374151' },
                                    strong: { fontWeight: '600', color: '#111827' },
                                }}
                            >
                                {info}
                            </Markdown>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}

export default InfoGuideModal;