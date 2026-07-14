import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Animated, StyleSheet, Easing } from 'react-native';

const AnimatedDropdown = ({
    data = [],
    onChange,
    labelField = 'description',
    valueField = 'marks',
    placeholder = 'Select an option',
}) => {
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const openMenu = () => {
        setVisible(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 180,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 180,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeMenu = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 140,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -8,
                duration: 140,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => setVisible(false));
    };

    const handleSelect = (item) => {
        setSelected(item);
        onChange?.(item);
        closeMenu();
    };

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <View className="my-1.5">
            {/* Trigger */}
            <TouchableOpacity
                onPress={visible ? closeMenu : openMenu}
                activeOpacity={0.75}
                className="flex-row items-center justify-between py-3.5 px-0.5"
            >
                <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    className={`flex-1 text-base tracking-[0.1px] mr-3 ${selected ? 'text-[#111111] font-normal' : 'text-[#C2C2C2] font-light'}`}
                >
                    {selected ? selected[labelField] : placeholder}
                </Text>

                <Animated.View style={{ transform: [{ rotate }] }}>
                    {/* Chevron — pure shapes, no icon library */}
                    <View className="w-4 h-2.5 relative justify-center items-center">
                        <View className="absolute left-0 w-2.5 h-6 bg-[#999] rounded-sm" style={{ transform: [{ rotate: '45deg' }, { translateX: 2 }] }} />
                        <View className="absolute right-0 w-2.5 h-6 bg-[#999] rounded-sm" style={{ transform: [{ rotate: '-45deg' }, { translateX: -2 }] }} />
                    </View>
                </Animated.View>
            </TouchableOpacity>

            {/* Bottom hairline */}
            <View style={styles.hairline} />

            {/* Dropdown panel */}
            <Modal visible={visible} transparent animationType="none" onRequestClose={closeMenu}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeMenu} />

                <Animated.View
                    style={[
                        styles.panel,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <FlatList
                        data={data}
                        keyExtractor={(_, i) => String(i)}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        renderItem={({ item, index }) => {
                            const isSelected = selected?.[valueField] === item[valueField];
                            return (
                                <TouchableOpacity
                                    onPress={() => handleSelect(item)}
                                    activeOpacity={0.6}
                                    style={styles.option}
                                >
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.optionText, isSelected && styles.optionTextSelected]}
                                        numberOfLines={2}
                                    >
                                        {item[labelField]}
                                    </Text>
                                    {isSelected && <View style={styles.dot} />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </Animated.View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    /* ── Bottom line ── */
    hairline: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E5E5',
    },

    /* ── Backdrop ── */
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },

    /* ── Floating panel ── */
    panel: {
        position: 'absolute',
        left: 16,
        right: 16,
        top: '35%', // adjust to match your trigger position
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 8,
        maxHeight: 260,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 12,
    },

    /* ── Options ── */
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    optionText: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '300',
        letterSpacing: 0.1,
        flex: 1,
    },
    optionTextSelected: {
        color: '#111111',
        fontWeight: '500',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#111111',
        marginLeft: 12,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#F3F3F3',
        marginHorizontal: 20,
    },
});

export default AnimatedDropdown;