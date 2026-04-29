import { View, Text, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import TabBar from './TabBar';
import AIButton from './AIButton';
import MessageModal from './MessageModal';
import UpdatedToastMessage from './UpdatedToastMessage';
import ChatbotModal from './ChatbotModal';

const TopBar = createMaterialTopTabNavigator();

const HistoryTabsWrapper = ({ title, tabs, params, navigation, showCostUpdatedToast, ...props }) => {
    const [aiModalVisible, setAIModalVisible] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [showBackConfirmModal, setShowBackConfirmModal] = useState(false);
    const [pendingTabName, setPendingTabName] = useState(null);
    const [pendingTabNavigation, setPendingTabNavigation] = useState(null);

    const { top, bottom } = useSafeAreaInsets();

    const handleTabPress = ({ route, isFocused, navigation: tabNavigation, currentRoute }) => {
        if (isFocused) return;

        const isLeavingCostsTab = currentRoute?.name === 'Costs' && route.name !== 'Costs';

        tabNavigation.navigate(route.name);
    };

    const confirmTabNavigation = () => {
        setShowUnsavedModal(false);
        const nextTab = pendingTabName;
        const nextNavigation = pendingTabNavigation;
        setPendingTabName(null);
        setPendingTabNavigation(null);

        // Reset unsaved changes by calling the callback with false
        if (props.onDisplayOnlyUnsavedChange) {
            props.onDisplayOnlyUnsavedChange(false);
        }

        if (props.onAuditUnsavedChange) {
            props.onAuditUnsavedChange(false);
        }

        // Trigger cost changes reset
        if (props.triggerResetCostChanges) {
            props.triggerResetCostChanges();
        }

        if (nextTab && nextNavigation) {
            nextNavigation.navigate(nextTab);
        }
    };

    const cancelTabNavigation = () => {
        setShowUnsavedModal(false);
        setPendingTabName(null);
        setPendingTabNavigation(null);
    };

    const handleBackPress = () => {
        if (props.hasUnsavedChanges) {
            setShowBackConfirmModal(true);
            return;
        }

        navigation.goBack();
    };

    const confirmBackNavigation = () => {
        setShowBackConfirmModal(false);
        navigation.goBack();
    };

    const cancelBackNavigation = () => {
        setShowBackConfirmModal(false);
    };

    return (
        <View className={`${top > 0 ? `pt-10` : ''} flex-1 bg-gray-100`}>
            {/* <StatusBar barStyle="light-content" backgroundColor="Black" /> */}

            {/* Header */}
            <View className="px-4 py-2 mb-2 w-full flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                    <TouchableOpacity
                        onPress={handleBackPress}
                        className="size-10 rounded-2xl items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>

                    <View className="flex-1 px-5 pt-1.5">
                        <Text
                            className="text-gray-900 text-xl font-bold mb-2"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {title}
                        </Text>
                    </View>
                </View>

                <View className="ml-2">
                    <AIButton onPress={() => setAIModalVisible(true)} />
                </View>
            </View>


            <View className="flex-1">
                <TopBar.Navigator
                    tabBar={tabBarProps => <TabBar {...tabBarProps} onTabPress={handleTabPress} />}
                    screenOptions={{
                        tabBarActiveTintColor: '#1E40AF',
                        tabBarInactiveTintColor: '#6B7280',
                        tabBarStyle: {
                            elevation: 0,
                            shadowOpacity: 0,
                        },
                        swipeEnabled: false,
                        lazy: true,
                        lazyPreloadDistance: 1,
                    }}
                >
                    {tabs.map((tab, index) => (
                        <TopBar.Screen key={index} name={tab.name} options={tab.options}>
                            {(screenProps) => {
                                // Pass refs and hideSubmitButton flag based on screen type
                                const screenProps_ = { ...screenProps, ...params, ...props, showCostUpdatedToast };

                                if (tab.name === 'Costs' && props.displayOnly) {
                                    screenProps_.onCostSubmitRef = props.costSubmitRef;
                                    screenProps_.hideSubmitButton = true;
                                }

                                if (tab.name === 'GBI Assessment' && props.displayOnly) {
                                    screenProps_.onAuditSubmitRef = props.auditSubmitRef;
                                    screenProps_.hideSubmitButton = true;
                                }

                                return <tab.component {...screenProps_} />;
                            }}
                        </TopBar.Screen>
                    ))}
                </TopBar.Navigator>
            </View>

            {/* Unified Submit Button when displayOnly = true */}
            {props.displayOnly && (
                <View
                    className="px-5 py-4 pb-7 bg-white"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.04,
                        shadowRadius: 6,
                        elevation: 6,
                    }}
                >
                    <TouchableOpacity
                        onPress={props.onCombinedSubmit}
                        disabled={!props.hasUnsavedChanges || props.isSubmitting}
                        activeOpacity={props.isSubmitting ? 1 : 0.8}
                        className={`rounded-2xl p-4 flex-row items-center justify-center shadow-md ${props.hasUnsavedChanges && !props.isSubmitting ? 'bg-blue-600 active:bg-blue-700' : props.isSubmitting ? 'bg-blue-500' : 'bg-slate-300'}`}
                    >
                        {props.isSubmitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        )}
                        <Text className="text-white font-bold text-sm ml-2">
                            {props.isSubmitting ? 'Submitting...' : props.hasUnsavedChanges ? 'Submit All Changes' : 'No Changes'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <ChatbotModal isVisible={aiModalVisible} onClose={() => setAIModalVisible(false)} />
            <MessageModal
                isVisible={showUnsavedModal}
                imgSource={require('../assets/components/warning.png')}
                title="Unsaved Changes"
                subtitle="There are unsaved changes in Cost Breakdown. Do you wish to continue navigating to another tab without saving?"
                buttonText="Yes"
                onClose={confirmTabNavigation}
                goBack={true}
                setModalVisible={cancelTabNavigation}
                cancelButtonText="No"
            />
            <MessageModal
                isVisible={showBackConfirmModal}
                imgSource={require('../assets/components/warning.png')}
                title="Discard Unsaved Changes?"
                subtitle="There are unsaved changes in Cost Breakdown or GBI Assessment. Confirm to go back without saving, or cancel to stay on this page."
                buttonText="Confirm"
                onClose={confirmBackNavigation}
                goBack={true}
                setModalVisible={cancelBackNavigation}
                cancelButtonText="Cancel"
            />

            <UpdatedToastMessage visible={showCostUpdatedToast} toastMessage={"Certification cost (actual) is updated. \n (Note: It is an unsaved change until submitted)"} />
        </View>
    )
}

export default HistoryTabsWrapper;
