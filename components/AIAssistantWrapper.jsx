import React, { useState } from 'react';
import { View, Animated } from 'react-native';
import { PanResponder } from 'react-native';
import AIButton from './AIButton';
import ChatbotModal from './ChatbotModal';

const AIAssistantWrapper = ({ children }) => {
    const [chatbotVisible, setChatbotVisible] = useState(false);
    const [pan] = useState(new Animated.ValueXY());

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
            useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
            pan.flattenOffset();
        },
    });

    return (
        <View className="flex-1">
            {children}
            <Animated.View
                style={[
                    { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
                    { position: 'absolute', top: 52, right: 20 },
                ]}
                {...panResponder.panHandlers}
            >
                <AIButton onPress={() => setChatbotVisible(true)} />
            </Animated.View>
            <ChatbotModal
                isVisible={chatbotVisible}
                onClose={() => setChatbotVisible(false)}
            />
        </View>
    );
};

export default AIAssistantWrapper;
