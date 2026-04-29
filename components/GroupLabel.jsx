import { View, Text } from 'react-native';

const GroupLabel = ({ label, accentColor = '#D1D5DB' }) => (
    <View className="flex-row items-center mb-2.5">
        <View style={{ width: 3, height: 12, backgroundColor: accentColor, borderRadius: 99, marginRight: 8 }} />
        <Text className="text-[10.5px] font-semibold text-gray-400 tracking-widest uppercase">{label}</Text>
    </View>
);

export default GroupLabel;