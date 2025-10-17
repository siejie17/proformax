import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const NotificationScreen = () => {
    const navigation = useNavigation();
    
    const notifications = [
        { 
            id: 1, 
            title: 'Assessment Complete', 
            message: 'Your green building score is ready for review. Score: 78/100', 
            time: '2 hours ago', 
            read: false,
            type: 'success'
        },
        { 
            id: 2, 
            title: 'New Feature Available', 
            message: 'Cost breakdown analysis is now available in your results dashboard', 
            time: '1 day ago', 
            read: false,
            type: 'info'
        },
        { 
            id: 3, 
            title: 'Assessment Reminder', 
            message: 'You have a pending building assessment. Complete it to get your score.', 
            time: '3 days ago', 
            read: true,
            type: 'reminder'
        },
        { 
            id: 4, 
            title: 'Weekly Report', 
            message: 'Your weekly sustainability report is ready. View your progress and insights.', 
            time: '1 week ago', 
            read: true,
            type: 'report'
        }
    ];

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'info': return 'information-circle';
            case 'reminder': return 'alarm';
            case 'report': return 'document-text';
            default: return 'notifications';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'success': return '#10B981';
            case 'info': return '#3B82F6';
            case 'reminder': return '#F59E0B';
            case 'report': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    const NotificationItem = ({ notification }) => (
        <TouchableOpacity 
            className={`bg-white rounded-2xl p-4 mb-3 border ${
                notification.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'
            }`}
            activeOpacity={0.8}
        >
            <View className="flex-row items-start">
                <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${getNotificationColor(notification.type)}20` }}
                >
                    <Ionicons 
                        name={getNotificationIcon(notification.type)} 
                        size={20} 
                        color={getNotificationColor(notification.type)} 
                    />
                </View>
                <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                        <Text className={`font-semibold ${
                            notification.read ? 'text-gray-900' : 'text-gray-900'
                        }`}>
                            {notification.title}
                        </Text>
                        {!notification.read && (
                            <View className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                    </View>
                    <Text className={`text-sm leading-5 mb-2 ${
                        notification.read ? 'text-gray-600' : 'text-gray-700'
                    }`}>
                        {notification.message}
                    </Text>
                    <Text className="text-xs text-gray-500">
                        {notification.time}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            
            {/* Header */}
            <View className="w-full border-b border-gray-200 bg-white">
                <View className="flex-row items-center px-4 py-3">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 mr-3 rounded-2xl items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-semibold">Notifications</Text>
                    <View className="flex-1" />
                    <TouchableOpacity className="px-3 py-1 bg-blue-50 rounded-full">
                        <Text className="text-blue-600 text-sm font-medium">Mark all read</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <ScrollView 
                className="flex-1 px-4 pt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {notifications.length > 0 ? (
                    <>
                        <Text className="text-gray-900 font-semibold mb-4">
                            Recent ({notifications.filter(n => !n.read).length} unread)
                        </Text>
                        {notifications.map((notification) => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))}
                    </>
                ) : (
                    <View className="flex-1 justify-center items-center py-20">
                        <View className="w-20 h-20 bg-gray-200 rounded-full items-center justify-center mb-4">
                            <Ionicons name="notifications-off" size={32} color="#9CA3AF" />
                        </View>
                        <Text className="text-gray-600 text-lg font-semibold mb-2">No Notifications</Text>
                        <Text className="text-gray-500 text-center">
                            You're all caught up! New notifications will appear here.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default NotificationScreen;