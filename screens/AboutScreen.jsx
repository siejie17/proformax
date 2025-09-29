import { View, Text, ScrollView } from 'react-native'
import React from 'react'

const AboutScreen = () => {
    return (
        <ScrollView className="flex-1 bg-gray-50">
            {/* Hero Section */}
            <View className="bg-gray-100 px-6 pt-12 pb-16">
                <View className="mb-6">
                    <View className="self-start bg-gray-50/40 px-4 py-2 rounded-full mb-4">
                        <Text className="text-black text-xs font-bold tracking-wide">PROFORMAX</Text>
                    </View>
                    <Text className="text-white text-4xl font-bold leading-tight mb-4">
                        Predictive,{'\n'}Affordable,{'\n'}and Green
                    </Text>
                    <Text className="text-emerald-50 text-base leading-relaxed">
                        Transforming NRNC projects to achieve GBI certification at minimum cost
                    </Text>
                </View>
            </View>
        </ScrollView>
    )
}

export default AboutScreen