import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';

const UpdatedToastMessage = ({ visible, toastMessage }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible) return;

        Animated.sequence([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible]);

    return (
        <Animated.View
            style={{ opacity }}
            className="absolute bottom-10 self-center bg-gray-900/95 px-5 py-3.5 rounded-2xl z-50 shadow-lg border border-gray-800"
        >
            <Text className="text-white text-sm font-medium tracking-wide">
                {toastMessage}
            </Text>
        </Animated.View>
    );
}

export default UpdatedToastMessage;