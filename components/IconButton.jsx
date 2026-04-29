import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons';

const IconButton = ({ onPress, icon, color = '#9CA3AF', bg = 'bg-gray-100', activeBg = 'active:bg-gray-200', size = 14 }) => (
    <TouchableOpacity
        onPress={onPress}
        className={`${bg} ${activeBg} p-1 ml-2 rounded-md`}
        activeOpacity={0.65}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
        <Ionicons name={icon} size={size} color={color} />
    </TouchableOpacity>
);

export default IconButton;