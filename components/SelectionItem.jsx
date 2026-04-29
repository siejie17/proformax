import React from 'react';
import { Text, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SelectionItem = React.memo(({ item, selectedValue, onSelect }) => {
    const label = typeof item === 'string' ? item : item?.name || '';
    const description = typeof item === 'string' ? '' : item?.description || '';
    const isSelected = selectedValue === label;

    return (
        <Pressable
            onPress={() => onSelect(item)}
            className={`px-6 py-4 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
            android_ripple={{ color: '#EFF6FF' }}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                    <Text className={`text-base ${isSelected ? 'text-blue-600 font-semibold' : 'text-gray-800'}`}>
                        {label}
                    </Text>
                    {!!description && (
                        <Text className="text-xs text-gray-500 mt-1">
                            {description}
                        </Text>
                    )}
                </View>
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
