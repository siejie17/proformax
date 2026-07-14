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
            pointerEvents="none"
            style={{ opacity }}
            className="absolute bottom-12 self-center mx-8 bg-gray-900/95 px-3 py-3 rounded-2xl z-50 shadow-lg border border-gray-800"
        >
            <Text allowFontScaling={false} className="text-white text-center text-sm font-medium tracking-wide">
                {toastMessage}
            </Text>
        </Animated.View>
    );
}

export default UpdatedToastMessage;
