import { View, Text } from 'react-native'
import Checkbox from 'expo-checkbox';

import IconButton from './IconButton';

const CustomItemRow = ({ customItem, onDelete }) => (
    <View className="flex-row items-center py-2.5 px-3 bg-blue-50 border border-blue-200 rounded-lg mb-1">
        <Checkbox
            value={true}
            onValueChange={() => { }}
            color="#10B981"
            disabled
            style={{ transform: [{ scale: 0.82 }], marginRight: 10 }}
        />
        <Text className="flex-1 text-[13px] leading-5 text-gray-600 font-medium">{customItem.description}</Text>
        <IconButton onPress={onDelete} icon="trash-outline" color="#F87171" bg="bg-red-50" activeBg="active:bg-red-100" />
    </View>
);

export default CustomItemRow;
