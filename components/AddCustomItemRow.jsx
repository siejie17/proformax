import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons';

const AddCustomItemRow = ({ itemId, value, onChange, onSubmit }) => (
    <View className="flex-row items-center py-2.5 px-3 mt-1 rounded-lg border border-dashed border-gray-500">
        <Ionicons name="add-outline" size={16} color="#D1D5DB" style={{ marginRight: 10 }} />
        <TextInput
            key={`input-${itemId}`}
            placeholder="Add item..."
            value={value || ''}
            onChangeText={onChange}
            onSubmitEditing={onSubmit}
            className="flex-1 text-[13px] text-black-300"
            placeholderTextColor="#D1D5DB"
            returnKeyType="done"
        />
        {!!value && value?.length > 0 ? (
            <TouchableOpacity onPress={onSubmit} className="bg-emerald-500 active:bg-emerald-600 px-2.5 py-1 rounded-md" activeOpacity={0.75}>
                <Text className="text-white text-[11px] font-semibold">Add</Text>
            </TouchableOpacity>
        ) : null}
    </View>
);

export default AddCustomItemRow;