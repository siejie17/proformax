import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const FormInputField = React.memo(({ label, value, placeholder, onChangeText, showChevron = false, onPress, disabled = false, required = true, onFocus, error = null, onDisabledPress, ...props }) => {
    return (
        <View className="mb-4">
            <View className="flex-row items-center px-4 mb-2">
                <Text className="text-gray-700 text-sm font-medium">
                    {label}
                </Text>
                {required && (
                    <Text className="text-red-500 text-sm ml-1">*</Text>
                )}
            </View>
            <View className="bg-white mx-3 rounded-lg shadow-sm">
                {showChevron ? (
                    <TouchableOpacity
                        onPress={disabled ? onDisabledPress : onPress}
                        className={`flex-row items-center justify-between p-4 min-h-[52px] ${disabled ? 'opacity-50' : ''}`}
                        activeOpacity={disabled ? 1 : 0.7}
                    >
                        <Text
                            className={`text-base ${value ? "text-gray-900" : "text-gray-400"
                                }`}
                        >
                            {value || placeholder}
                        </Text>
                        <Feather name="chevron-right" size={20} color={disabled ? "#D1D5DB" : "#9CA3AF"} />
                    </TouchableOpacity>
                ) : (
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        onFocus={onFocus}
                        placeholder={placeholder}
                        className="p-4 text-gray-900 text-base min-h-[52px]"
                        placeholderTextColor="#9CA3AF"
                        {...props}
                    />
                )}
            </View>
            {error && <Text className="text-red-500 text-sm mt-1 px-4">{error}</Text>}
        </View>
    )
});

export default FormInputField;