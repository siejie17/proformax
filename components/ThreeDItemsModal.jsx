import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';

const ThreeDItemsModal = ({ user3DVisibility, isOpen, onClose }) => {
    return (
        <Modal visible={isOpen} transparent animationType="fade">
            <View className="flex-1 bg-black/60 justify-center items-center px-4">
                <View className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" style={{ maxHeight: '85%' }}>
                    {/* Header */}
                    <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-100">
                        <Text className="text-xl font-semibold text-gray-900 tracking-tight">
                            3D Items
                        </Text>
                        <TouchableOpacity 
                            onPress={onClose} 
                            className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center active:bg-gray-200"
                        >
                            <Text className="text-lg text-gray-600 font-light">✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Body - Scrollable List */}
                    <ScrollView 
                        className="px-6 py-6"
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="gap-3">
                            {Object.entries(user3DVisibility).map(([name, mapped], index) => (
                                <View key={index} className="bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100">
                                    <View className="flex-row items-center gap-3">
                                        {/* Status Indicator */}
                                        <View
                                            className={`w-6 h-6 rounded-full justify-center items-center ${
                                                mapped ? 'bg-emerald-500' : 'bg-gray-300'
                                            }`}
                                        >
                                            <Text className="text-white text-xs font-bold">
                                                {mapped ? '✓' : '✕'}
                                            </Text>
                                        </View>
                                        {/* Item Name */}
                                        <Text className="text-sm font-medium text-gray-800 flex-1">
                                            {name}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}

export default ThreeDItemsModal;