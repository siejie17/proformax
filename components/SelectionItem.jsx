import React from 'react';
import { Text, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SelectionItem = React.memo(({ item, selectedValue, onSelect }) => {
    const isSelected = selectedValue === item;

    return (
        <Pressable
            onPress={() => onSelect(item)}
            className={`px-6 py-4 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
            android_ripple={{ color: '#EFF6FF' }}
        >
            <View className="flex-row items-center justify-between">
                <Text className={`text-base ${isSelected ? 'text-blue-600 font-semibold' : 'text-gray-800'}`}>
                    {item}
                </Text>
                {isSelected && (
                    <View className="w-5 h-5 rounded-full items-center justify-center">
                        <MaterialCommunityIcons name="check-circle-outline" size={14} color="#3B82F6" />
                    </View>
                )}
            </View>
        </Pressable>
    )
});

export default SelectionItem;