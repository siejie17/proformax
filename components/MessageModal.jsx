import { View, Text, Modal, Image, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MessageModal = ({ isVisible, imgSource, title, description, onClose, buttonText }) => {
    return (
        <Modal 
            visible={isVisible} 
            transparent 
            animationType="slide"
            statusBarTranslucent  // 👈 makes modal go under status bar
        >
            <View className="flex-1 bg-black bg-opacity-50 justify-center items-center px-6">
                <SafeAreaView>
                    <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" /> 
                </SafeAreaView>

                <View className="bg-white w-[90%] max-w-[340px] rounded-2xl p-6 items-center">
                    <Image 
                        source={imgSource} 
                        className="h-[150px] w-[150px] mb-4" 
                    />
                    <Text className="text-xl font-bold mb-3 text-center">{title}</Text>
                    <Text className="text-gray-600 text-[16px] mb-7 text-center">{description}</Text>
                    <TouchableOpacity 
                        onPress={onClose} 
                        className="bg-green-500 rounded-lg py-4 px-6 w-full items-center"
                    >
                        <Text className="text-white text-center font-semibold">{buttonText}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

export default MessageModal;