import { View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingIndicator from '../components/LoadingIndicator';

const HistoryScreen = ({ navigation }) => {
    const [histories, setHistories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const { user } = useContext(AuthContext);

    const certifiedScaleRange = {
        'Platinum': [85, 100],
        'Gold': [75, 84],
        'Silver': [65, 74],
        'Certified': [55, 64],
        'Not Certified': [0, 54]
    };

    useEffect(() => {
        const fetchHistories = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/users/${user.id}/projects`);
                setHistories(response.data.apiData);
            } catch (error) {
                console.error('Error fetching histories:', error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        }

        if (user?.id) {
            fetchHistories();
        }
    }, [user?.id]);

    // Filter histories based on search query
    const filteredHistories = histories.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate pagination
    const totalPages = Math.ceil(filteredHistories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredHistories.slice(startIndex, endIndex);

    // Reset to page 1 when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const getAchievedCertification = (rating) => {
        for (const [level, range] of Object.entries(certifiedScaleRange)) {
            if (rating >= range[0] && rating <= range[1]) {
                return level;
            }
        }
        return 'Not Certified';
    };

    // Get certification colors
    const getCertificationColors = (certification) => {
        const colors = {
            'Platinum': { bg: 'bg-gray-800', text: 'text-white', badge: 'bg-gray-100', badgeText: 'text-gray-800' },
            'Gold': { bg: 'bg-yellow-500', text: 'text-white', badge: 'bg-yellow-100', badgeText: 'text-yellow-700' },
            'Silver': { bg: 'bg-gray-400', text: 'text-white', badge: 'bg-gray-100', badgeText: 'text-gray-600' },
            'Certified': { bg: 'bg-emerald-500', text: 'text-white', badge: 'bg-emerald-100', badgeText: 'text-emerald-700' },
            'Not Certified': { bg: 'bg-red-500', text: 'text-white', badge: 'bg-red-100', badgeText: 'text-red-700' }
        };
        return colors[certification] || colors['Not Certified'];
    };

    const handleCardPress = (item) => {
        navigation.navigate('HistoryDetail', { projectId: item.id, displayOnly: true });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
                <LoadingIndicator />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

            {/* Header */}
            <View className="px-4 py-2 w-full">
                <View className="flex-row mb-3">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="size-10 rounded-2xl items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <View className="px-5 pt-1.5">
                        <Text className="text-gray-800 font-bold text-xl mb-1">Project History</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-white rounded-2xl border border-gray-200 flex-row items-center px-4 shadow-sm mx-1">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-800 text-sm"
                        placeholder="Search projects by name..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* History Cards */}
            <ScrollView
                className="flex-1"
                contentContainerClassName="p-4 pt-2"
                showsVerticalScrollIndicator={false}
            >
                {currentItems.map((item, index) => {
                    const achievedCert = getAchievedCertification(item.rating);
                    const targetCert = item.target_certification;
                    const achievedColors = getCertificationColors(achievedCert);

                    return (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => handleCardPress(item)}
                            activeOpacity={0.7}
                            className="bg-white rounded-2xl mb-3 overflow-hidden shadow-md border border-gray-200"
                        >
                            {/* Card Header */}
                            <View className="bg-gray-800 px-4 py-3.5 flex-row justify-between">
                                <View className="flex-1 mr-3 justify-between">
                                    <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                                        <Text className="text-gray-400 text-[10px] ml-1" numberOfLines={1}>
                                            {new Date(item.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </Text>
                                    </View>
                                </View>
                                <View className="justify-between items-end">
                                    <View className={`px-2.5 py-1 rounded-lg bg-blue-500`}>
                                        <Text className={`text-[10px] font-bold text-white`}>
                                            {item.building_type}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Ionicons name="albums-outline" size={11} color="#9CA3AF" />
                                        <Text className="text-gray-400 text-[10px] ml-1" numberOfLines={1}>
                                            {item.category}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Card Content */}
                            <View className="p-4">
                                {/* Structure Info */}
                                <View className="mb-3">
                                    <Text className="text-gray-500 text-[10px] uppercase tracking-wide font-semibold mb-1">
                                        Structure
                                    </Text>
                                    <Text className="text-gray-700 text-xs" numberOfLines={2}>
                                        {item.structure}
                                    </Text>
                                </View>

                                {/* Info Grid */}
                                <View className="flex-row flex-wrap gap-2 mb-3">
                                    <View className="bg-blue-50 rounded-lg px-3 py-2 flex-1 min-w-[45%]">
                                        <Text className="text-blue-600 text-[9px] uppercase tracking-wide font-semibold mb-0.5">
                                            Location
                                        </Text>
                                        <Text className="text-gray-800 text-xs font-bold">
                                            {item.location}
                                        </Text>
                                    </View>

                                    <View className="bg-emerald-50 rounded-lg px-3 py-2 flex-1 min-w-[45%]">
                                        <Text className="text-emerald-600 text-[9px] uppercase tracking-wide font-semibold mb-0.5">
                                            Size (m²)
                                        </Text>
                                        <Text className="text-gray-800 text-xs font-bold">
                                            {parseFloat(item.size).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                        </Text>
                                    </View>

                                    <View className="bg-purple-50 rounded-lg px-3 py-2 flex-1 min-w-[45%]">
                                        <Text className="text-purple-600 text-[9px] uppercase tracking-wide font-semibold mb-0.5">
                                            Year
                                        </Text>
                                        <Text className="text-gray-800 text-xs font-bold">
                                            {item.year}
                                        </Text>
                                    </View>

                                    <View className="bg-orange-50 rounded-lg px-3 py-2 flex-1 min-w-[45%]">
                                        <Text className="text-orange-600 text-[9px] uppercase tracking-wide font-semibold mb-0.5">
                                            GBI Score
                                        </Text>
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-gray-800 text-xs font-bold">
                                                {item.rating} pts
                                            </Text>
                                            <View className={`px-2 py-0.5 rounded ${achievedColors.badge}`}>
                                                <Text className={`text-[9px] font-bold ${achievedColors.badgeText}`}>
                                                    {achievedCert}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Budget Info */}
                                <View className="flex-row gap-2 pt-3 border-t border-gray-100">
                                    <View className="flex-1">
                                        <Text className="text-gray-500 text-[9px] uppercase tracking-wide font-semibold mb-1">
                                            Budget
                                        </Text>
                                        <Text className="text-gray-800 text-xs font-bold">
                                            RM {parseFloat(item.budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-500 text-[9px] uppercase tracking-wide font-semibold mb-1">
                                            Estimated Cost
                                        </Text>
                                        <Text className="text-gray-800 text-xs font-bold">
                                            RM {parseFloat(item.adjusted_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Card Footer */}
                            <View className="bg-gray-50 px-4 py-2.5 flex-row items-center justify-between border-t border-gray-100">
                                <Text className="text-gray-500 text-[10px]">
                                    Tap to view details
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {/* Empty State - No Search Results */}
                {filteredHistories.length === 0 && histories.length > 0 && (
                    <View className="flex-1 items-center justify-center py-20">
                        <View className="bg-gray-100 rounded-full p-6 mb-4">
                            <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                        </View>
                        <Text className="text-gray-600 font-semibold text-base mb-1">No Results Found</Text>
                        <Text className="text-gray-400 text-sm text-center">
                            Try searching with different keywords
                        </Text>
                    </View>
                )}

                {/* Empty State - No Projects */}
                {histories.length === 0 && (
                    <View className="flex-1 items-center justify-center py-20">
                        <View className="bg-gray-100 rounded-full p-6 mb-4">
                            <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
                        </View>
                        <Text className="text-gray-600 font-semibold text-base mb-1">No Projects Yet</Text>
                        <Text className="text-gray-400 text-sm text-center">
                            Your project history will appear here
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Pagination */}
            {totalPages > 1 && (
                <View className="bg-white border-t border-gray-200 px-4 py-3">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`flex-row items-center px-4 py-2.5 rounded-xl ${currentPage === 1
                                ? 'bg-gray-100'
                                : 'bg-blue-500 active:bg-blue-600'
                                }`}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={16}
                                color={currentPage === 1 ? '#9CA3AF' : '#FFFFFF'}
                            />
                            <Text className={`font-semibold text-xs ml-1 ${currentPage === 1 ? 'text-gray-400' : 'text-white'
                                }`}>
                                Previous
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <TouchableOpacity
                                    key={page}
                                    onPress={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg items-center justify-center ${currentPage === page
                                        ? 'bg-gray-800'
                                        : 'bg-gray-100'
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`font-bold text-xs ${currentPage === page ? 'text-white' : 'text-gray-600'
                                        }`}>
                                        {page}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`flex-row items-center px-4 py-2.5 rounded-xl ${currentPage === totalPages
                                ? 'bg-gray-100'
                                : 'bg-blue-500 active:bg-blue-600'
                                }`}
                            activeOpacity={0.8}
                        >
                            <Text className={`font-semibold text-xs mr-1 ${currentPage === totalPages ? 'text-gray-400' : 'text-white'
                                }`}>
                                Next
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={currentPage === totalPages ? '#9CA3AF' : '#FFFFFF'}
                            />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-center text-gray-500 text-[10px] mt-2">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredHistories.length)} of {filteredHistories.length}
                        {searchQuery && ` (filtered from ${histories.length} total)`}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
};

export default HistoryScreen;