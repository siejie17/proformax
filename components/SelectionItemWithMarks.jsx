import { memo } from 'react';
import { Text, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SelectionItemWithMarks = memo(({ item, selectedValue, onSelect }) => {
    // Handle both string items and object items with marks
    const isSelected = selectedValue === item.marks || selectedValue === item;
    const description = item.description || item;
    const marks = item.marks;

    return (
        <Pressable
            onPress={() => onSelect(item)}
            className={`px-6 py-4 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
            android_ripple={{ color: '#EFF6FF' }}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className={`text-base leading-5 ${isSelected ? 'text-blue-600 font-semibold' : 'text-gray-800'}`}>
                        {description}
                    </Text>
                    {marks !== undefined && (
                        <Text className={`text-xs mt-1 ${isSelected ? 'text-blue-500' : 'text-gray-500'}`}>
                            {marks} points
                        </Text>
                    )}
                </View>
                {marks !== undefined && (
                    <View className={`ml-3 px-2.5 py-1.5 rounded-lg ${isSelected ? 'bg-blue-500' : 'bg-gray-100'}`}>
                        <Text className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                            {marks}
                        </Text>
                    </View>
                )}
                {isSelected && (
                    <View className="w-5 h-5 rounded-full items-center justify-center ml-3">
                        <MaterialCommunityIcons name="check-circle-outline" size={14} color="#3B82F6" />
                    </View>
                )}
            </View>
        </Pressable>
    );
});

export default SelectionItemWithMarks;
