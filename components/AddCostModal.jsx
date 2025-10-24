import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const AddCostModal = ({ visible, onClose, onAdd, parentPath, parentDescription }) => {
    const [description, setDescription] = useState('');
    const [cost, setCost] = useState('');
    const [errors, setErrors] = useState({ description: '', cost: '' });

    const formatCost = (value) => {
        // Remove non-numeric characters except decimal point
        const cleaned = value.replace(/[^0-9.]/g, '');

        // Prevent multiple decimal points
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            return parts[0] + '.' + parts.slice(1).join('');
        }

        return cleaned;
    };

    const handleCostChange = (value) => {
        const formatted = formatCost(value);
        setCost(formatted);
        if (errors.cost) {
            setErrors(prev => ({ ...prev, cost: '' }));
        }
    };

    const validate = () => {
        let isValid = true;
        const newErrors = { description: '', cost: '' };

        if (!description.trim()) {
            newErrors.description = 'Description is required';
            isValid = false;
        }

        if (!cost.trim()) {
            newErrors.cost = 'Cost is required';
            isValid = false;
        } else if (isNaN(parseFloat(cost)) || parseFloat(cost) <= 0) {
            newErrors.cost = 'Please enter a valid cost amount';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleAdd = () => {
        if (validate()) {
            onAdd({
                description: description.trim(),
                cost: parseFloat(cost)
            });
            // Reset fields
            setDescription('');
            setCost('');
            setErrors({ description: '', cost: '' });
        }
    };

    const handleCancel = () => {
        setDescription('');
        setCost('');
        setErrors({ description: '', cost: '' });
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        {/* Header */}
                        <View className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <Text className="text-gray-800 font-bold text-lg">
                                {parentPath ? 'Add Inner Cost' : 'Adding Cost'}
                            </Text>
                            <Text className="text-gray-500 text-xs mt-1">
                                {parentPath ? 'Add a new cost item to this section' : 'Add a new construction cost item'}
                            </Text>
                        </View>

                        <ScrollView className="px-6 py-5" showsVerticalScrollIndicator={false}>
                            {/* Section Indicator */}
                            <View className="mb-5">
                                <Text className="text-slate-600 font-semibold text-xs mb-2 uppercase tracking-wide">
                                    {parentPath ? 'Parent Section' : 'Section'}
                                </Text>
                                <View className="bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 flex-row items-center">
                                    <View className="bg-blue-500 w-8 h-8 rounded-lg items-center justify-center mr-3">
                                        <Ionicons name="folder-open" size={16} color="#FFFFFF" />
                                    </View>
                                    <Text className="text-blue-700 font-bold text-sm">
                                        {parentDescription || (parentPath ? parentPath.split('.')[0] : 'OTHERS')}
                                    </Text>
                                </View>
                            </View>

                            {/* Description Input */}
                            <View className="mb-4">
                                <Text className="text-slate-700 font-semibold text-xs mb-2 uppercase tracking-wide">
                                    Description
                                </Text>
                                <TextInput
                                    className={`bg-slate-50 border-2 rounded-xl px-4 py-3 text-sm text-slate-800 ${errors.description ? 'border-red-300' : 'border-slate-200'
                                        }`}
                                    placeholder="Enter cost description..."
                                    placeholderTextColor="#94A3B8"
                                    value={description}
                                    onChangeText={(text) => {
                                        setDescription(text);
                                        if (errors.description) {
                                            setErrors(prev => ({ ...prev, description: '' }));
                                        }
                                    }}
                                    multiline
                                    numberOfLines={2}
                                    textAlignVertical="top"
                                />
                                {errors.description ? (
                                    <View className="flex-row items-center mt-1.5 px-1">
                                        <Ionicons name="alert-circle" size={12} color="#EF4444" />
                                        <Text className="text-red-500 text-[10px] ml-1 font-medium">
                                            {errors.description}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>

                            {/* Cost Input */}
                            <View className="mb-2">
                                <Text className="text-slate-700 font-semibold text-xs mb-2 uppercase tracking-wide">
                                    Cost Amount
                                </Text>
                                <View className={`flex-row items-center bg-slate-50 border-2 rounded-xl px-4 py-3 ${errors.cost ? 'border-red-300' : 'border-slate-200'
                                    }`}>
                                    <Text className="text-slate-500 font-bold text-sm mr-2">RM</Text>
                                    <TextInput
                                        className="flex-1 text-sm text-slate-800 font-semibold"
                                        placeholder="0.00"
                                        placeholderTextColor="#94A3B8"
                                        value={cost}
                                        onChangeText={handleCostChange}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                {errors.cost ? (
                                    <View className="flex-row items-center mt-1.5 px-1">
                                        <Ionicons name="alert-circle" size={12} color="#EF4444" />
                                        <Text className="text-red-500 text-[10px] ml-1 font-medium">
                                            {errors.cost}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        </ScrollView>

                        {/* Action Buttons */}
                        <View className="px-6 pb-5 gap-3">
                            <TouchableOpacity
                                onPress={handleAdd}
                                className="bg-blue-500 rounded-xl py-3.5 flex-row items-center justify-center shadow-md active:bg-blue-600"
                                activeOpacity={0.8}
                            >
                                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                <Text className="text-white font-bold text-sm ml-2">Add Cost Item</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleCancel}
                                className="bg-slate-100 rounded-xl py-3.5 items-center active:bg-slate-200"
                                activeOpacity={0.8}
                            >
                                <Text className="text-slate-700 font-semibold text-sm">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default AddCostModal;