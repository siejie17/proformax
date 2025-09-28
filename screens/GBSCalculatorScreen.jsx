import { View, Text, TouchableWithoutFeedback, Keyboard, TouchableOpacity, StatusBar } from 'react-native';
import React from 'react';
import BackButton from '../components/BackButton';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const GBSCalculatorScreen = ({ navigation }) => {
    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View className="flex-1">
                    <View className="px-4 py-3 w-full">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="size-10 mr-4 rounded-2xl items-center justify-center"
                        >
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-6 pt-2 pb-6">
                        <Text className="text-gray-900 text-2xl font-bold mb-2">Green Building Scores Calculator</Text>
                        <Text className="text-gray-600 text-sm leading-5">
                            Estimate your project's performance against the standards for its green building and cost optimisation compliance now.
                        </Text>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}

export default GBSCalculatorScreen;