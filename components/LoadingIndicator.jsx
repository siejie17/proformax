import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoadingIndicator = () => {
    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

            <View className="flex-1 items-center justify-center px-6">
                {/* Loading Spinner */}
                <View className="mb-6">
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>

                {/* Loading Text */}
                <Text className="text-gray-600 text-base font-medium">
                    Loading...
                </Text>
            </View>
        </SafeAreaView>
    )
}

export default LoadingIndicator;