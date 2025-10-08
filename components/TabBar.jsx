import { View, Text, TouchableOpacity } from 'react-native';

const TabBar = ({ state, descriptors, navigation }) => {
    return (
        <View className="flex-row px-4 mb-2 rounded-2xl gap-x-2">
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel || options.title || route.name;
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={onPress}
                        accessibilityRole='button'
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        className={`flex-1 items-center justify-center py-3 rounded-xl relative ${isFocused ? 'bg-[#2D6A4F]' : 'bg-[#40916C]'}`}
                    >
                        <Text className={`text-sm font-medium ${isFocused ? 'text-white' : 'text-[#E8F5E9]'}`}>
                            {label}
                        </Text>
                        {isFocused && <View className="absolute bottom-0 h-3 rounded-sm bg-blue-600" />}
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}

export default TabBar;