import { Text, TouchableOpacity } from 'react-native'
import Checkbox from 'expo-checkbox';

const SubitemRow = ({ subitem, isChecked, onToggle }) => (
    <TouchableOpacity
        className={`flex-row items-center py-2.5 px-3 rounded-lg mb-1 border ${isChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
            }`}
        onPress={onToggle}
        activeOpacity={0.6}
    >
        <Checkbox
            value={isChecked}
            onValueChange={onToggle}
            color={isChecked ? '#10B981' : undefined}
            style={{ transform: [{ scale: 0.82 }], marginRight: 10 }}
        />
        <Text
            className={`flex-1 text-[13px] leading-5 ${isChecked ? 'text-emerald-700' : 'text-gray-600'}`}
            style={{ fontWeight: isChecked ? '500' : '400' }}
        >
            {subitem.description}
        </Text>
    </TouchableOpacity>
);

export default SubitemRow;
