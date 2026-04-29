import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from '@ronradtke/react-native-markdown-display';
import { BlurView } from 'expo-blur';

const InfoGuideModal = ({ isVisible, info, onClose, title = 'Information', label = 'Guide' }) => {
    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            {/* Backdrop */}
            <TouchableOpacity
                className="flex-1"
                activeOpacity={1}
                onPress={onClose}
            >
                <BlurView
                    intensity={20}
                    tint="dark"
                    className="flex-1 justify-end"
                >
                    {/* Sheet */}
                    <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                        <View
                            className="bg-white rounded-t-[32px] overflow-hidden"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: -4 },
                                shadowOpacity: 0.12,
                                shadowRadius: 20,
                                elevation: 24,
                            }}
                        >
                            {/* Drag handle */}
                            <View className="items-center pt-3 pb-1">
                                <View className="w-10 h-1 bg-gray-200 rounded-full" />
                            </View>

                            {/* Colored header band */}
                            <View className="px-5 pt-3 pb-5">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-9 h-9 rounded-xl bg-blue-500 items-center justify-center">
                                            <Ionicons name="information" size={18} color="white" />
                                        </View>
                                        <View>
                                            <Text className="text-[11px] font-medium text-blue-500 uppercase tracking-widest">
                                                {label}
                                            </Text>
                                            <Text className="text-base font-semibold text-gray-900 leading-5">
                                                {title}
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={onClose}
                                        className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="close" size={16} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Divider */}
                            <View className="h-px bg-gray-100 mx-5" />

                            {/* Scrollable content */}
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                style={{ maxHeight: 420, flexGrow: 0 }}
                                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                            >
                                <Markdown
                                    style={{
                                        body: {
                                            color: '#374151',
                                            fontSize: 14,
                                            lineHeight: 24,
                                        },
                                        heading1: {
                                            fontSize: 16,
                                            fontWeight: '600',
                                            color: '#111827',
                                            marginBottom: 8,
                                        },
                                        heading2: {
                                            fontSize: 15,
                                            fontWeight: '600',
                                            color: '#1F2937',
                                            marginBottom: 6,
                                        },
                                        bullet_list: {
                                            marginLeft: 4,
                                        },
                                        list_item: {
                                            color: '#4B5563',
                                            marginBottom: 6,
                                            paddingLeft: 4,
                                            flexWrap: 'wrap',
                                        },
                                        strong: {
                                            fontWeight: '600',
                                            color: '#111827',
                                        },
                                        em: {
                                            fontStyle: 'italic',
                                            color: '#6B7280',
                                        },
                                        blockquote: {
                                            backgroundColor: '#EFF6FF',
                                            borderLeftColor: '#3B82F6',
                                            borderLeftWidth: 3,
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 6,
                                            marginVertical: 8,
                                        },
                                        code_inline: {
                                            backgroundColor: '#F3F4F6',
                                            color: '#1D4ED8',
                                            fontSize: 13,
                                            borderRadius: 4,
                                            paddingHorizontal: 4,
                                        },
                                        paragraph: {
                                            marginTop: 0,
                                            marginBottom: 8,
                                        },
                                    }}
                                >
                                    {info}
                                </Markdown>
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </BlurView>
            </TouchableOpacity>
        </Modal>
    );
};

export default InfoGuideModal;
