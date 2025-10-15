import { View, Text, TouchableOpacity } from 'react-native';

const TabBar = ({ state, descriptors, navigation }) => {
    return (
        <View className="bg-white mx-4 mb-4 rounded-2xl p-1.5 flex-row gap-x-1.5 shadow-lg border border-slate-200">
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
                        className={`flex-1 items-center justify-center py-3 rounded-xl relative ${isFocused ? 'bg-black' : 'bg-white'}`}
                    >
                        <Text className={`text-xs font-bold ${isFocused ? 'text-white' : 'text-slate-500'}`}>
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