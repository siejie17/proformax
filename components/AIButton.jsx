import { TouchableOpacity, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const AIButton = ({ onPress }) => {
    return (
        <TouchableOpacity onPress={onPress}>
            {/* Main Container */}
            <View className="bg-green-600 rounded-3xl px-4 py-2.5 flex-row items-center gap-2.5">
                {/* Animated Sparkle Icon */}
                <View className="relative">
                    <MaterialIcons name="auto-awesome" size={18} color="white" />
                </View>
                
                {/* AI Label */}
                <Text className="text-white font-bold text-sm tracking-wide">Ask AI</Text>
            </View>
        </TouchableOpacity>
    );
};

export default AIButton;