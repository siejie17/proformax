import { View, Text } from 'react-native';

const PointsBadge = ({ points, active }) => (
    <View
        className={`px-2 py-1 rounded-md min-w-[40px] items-center justify-center ${active ? 'bg-emerald-500' : 'bg-gray-100'
            }`}
    >
        <Text className={`text-[10px] font-semibold tracking-wide ${active ? 'text-white' : 'text-gray-400'}`}>
            {points} pts
        </Text>
    </View>
);

export default PointsBadge;