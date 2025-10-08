import { View, Text, StatusBar } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResultsScreen = () => {
    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        </SafeAreaView>
    )
}

export default ResultsScreen;