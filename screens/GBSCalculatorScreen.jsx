import { View, Text, TouchableWithoutFeedback, Keyboard, TouchableOpacity, StatusBar, ScrollView, FlatList } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BackButton from '../components/BackButton';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import FormInputField from '../components/FormInputField';

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import SelectionItem from '../components/SelectionItem';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const GBSCalculatorScreen = ({ navigation }) => {
    const locationMapping = {
        "Pulau Pinang": { code: "A" },
        "Kedah": { code: "A" },
        "Perlis": { code: "A" },
        "Perak": { code: "B" },
        "Selangor": { code: "C" },
        "W.P. Kuala Lumpur": { code: "C" },
        "Melaka": { code: "C" },
        "Negeri Sembilan": { code: "C" },
        "Johor": { code: "D" },
        "Pahang": { code: "E" },
        "Kelantan": { code: "F" },
        "Terengganu": { code: "F" },

        "Sabah": {
            code: "Sabah",
            regions: {
                "Kota Kinabalu": "G",
                "Sandakan": "H",
                "Tawau": "I",
            },
        },
        "Sarawak": {
            code: "Sarawak",
            regions: {
                "Kuching": "J",
                "Sibu": "K",
                "Miri": "L",
            },
        },
    };

    const ratingScaleMapping = {
        "Platinum (86 - 100)": "Platinum",
        "Gold (76 - 85)": "Gold",
        "Silver (66 - 75)": "Silver",
        "Certified (50 - 65)": "Certified"
    };

    const [buildingTypes, setBuildingTypes] = useState([]);
    const [selectedBuildingType, setSelectedBuildingType] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);

    // Generate array of years: current year + next 10 years
    const currentYear = new Date().getFullYear();
    const [yearList] = useState(() => {
        const years = [];
        for (let i = 0; i <= 10; i++) {
            years.push(currentYear + i);
        }
        return years;
    });

    const [selectedYear, setSelectedYear] = useState(null);
    const [buildingSize, setBuildingSize] = useState(0.00);
    const [projectBudget, setProjectBudget] = useState(0.00);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedCertifiedRatingScale, setSelectedCertifiedRatingScale] = useState(null);

    const [buildingSizeDisplay, setBuildingSizeDisplay] = useState('');
    const [projectBudgetDisplay, setProjectBudgetDisplay] = useState("0"); // in cents

    const [activeSheet, setActiveSheet] = useState(null);

    const buildingTypeBottomSheetRef = useRef(null);
    const categoryBottomSheetRef = useRef(null);
    const yearBottomSheetRef = useRef(null);
    const stateBottomSheetRef = useRef(null);
    const regionBottomSheetRef = useRef(null);
    const ratingScaleBottomSheetRef = useRef(null);

    const snapPoints = useMemo(() => ['25%'], []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories');
                setBuildingTypes(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    // Update categories when building type changes
    useEffect(() => {
        if (selectedBuildingType) {
            const bt = buildingTypes.find((b) => b.building_type === selectedBuildingType);
            setCategories(bt ? bt.categories : []);
            setSelectedCategory(null); // reset category when type changes
        } else {
            setCategories([]);
        }
    }, [selectedBuildingType]);

    const handleBuildingTypePress = useCallback(() => {
        setActiveSheet('buildingType');
        buildingTypeBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleBuildingTypeSelect = useCallback((buildingType) => {
        setSelectedBuildingType(buildingType);
        buildingTypeBottomSheetRef.current?.close();
    }, []);

    const handleCategoryPress = useCallback(() => {
        setActiveSheet('category');
        categoryBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleCategorySelect = useCallback((category) => {
        setSelectedCategory(category);
        categoryBottomSheetRef.current?.close();
    }, []);

    const handleYearPress = useCallback(() => {
        setActiveSheet('year');
        yearBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleYearSelect = useCallback((year) => {
        setSelectedYear(year);
        yearBottomSheetRef.current?.close();
    }, []);

    const handleStatePress = useCallback(() => {
        setActiveSheet('state');
        stateBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleStateSelect = useCallback((state) => {
        setSelectedState(state);
        stateBottomSheetRef.current?.close();
    }, []);

    const handleRegionPress = useCallback(() => {
        setActiveSheet('region');
        regionBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleRegionSelect = useCallback((region) => {
        setSelectedRegion(region);
        regionBottomSheetRef.current?.close();
    }, []);

    const handleRatingPress = useCallback(() => {
        setActiveSheet('ratingScale');
        ratingScaleBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleRatingSelect = useCallback((rating) => {
        setSelectedCertifiedRatingScale(rating);
        ratingScaleBottomSheetRef.current?.close();
    }, []);

    const handleSheetChanges = useCallback((index) => {
        if (index === -1) {
            setActiveSheet(null);
        }
    }, []);

    const renderBottomSheet = (ref, data, selectedValue, onSelect, title) => (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            enablePanDownToClose
            enableOverDrag={false}
            // enableContentPanningGesture={false}
            backgroundStyle={{ backgroundColor: '#ffffff' }}
            handleIndicatorStyle={{ backgroundColor: '#D1D5DB' }}
        >
            <BottomSheetView className="flex-1">
                <View className="px-4 py-3 border-b border-gray-200">
                    <Text className="text-lg font-semibold text-gray-900 text-center">
                        Select {title}
                    </Text>
                </View>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <SelectionItem
                            item={item}
                            selectedValue={selectedValue}
                            onSelect={onSelect}
                        />
                    )}
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                />
            </BottomSheetView>
        </BottomSheet>
    );

    // helper function to format numbers with commas
    const formatWithThousandSeparator = (value) => {
        if (!value) return "";

        // split integer & decimal part
        let [integer, decimal] = value.split(".");

        // add commas to integer
        integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        return decimal !== undefined ? `${integer}.${decimal}` : integer;
    };

    const handleNumericInput = (text, setNumeric, setDisplay) => {
        // allow only digits and optionally a single decimal point
        let sanitized = text.replace(/[^0-9.]/g, "");

        // prevent multiple decimals
        const parts = sanitized.split(".");
        if (parts.length > 2) {
            sanitized = parts[0] + "." + parts[1]; // keep only first decimal
        }

        // remove leading zeros from integer part, but keep "0" if user types "0."
        if (parts[0]) {
            parts[0] = parts[0].replace(/^0+(?=\d)/, "");
        }

        // recombine integer and decimal part
        const formatted = parts.join(".");

        setDisplay(formatted);
        // convert to number if possible, else 0
        setNumeric(formatted ? parseFloat(formatted) : 0);
    };

    const formatCurrency = (text) => {
        // keep only digits
        let digits = text.replace(/[^0-9]/g, "");

        // remove leading zeros
        digits = digits.replace(/^0+/, "");

        if (digits.length === 0) return "0.00";
        if (digits.length === 1) return `0.0${digits}`;
        if (digits.length === 2) return `0.${digits}`;

        // insert decimal before last two digits
        const intPart = digits.slice(0, -2);
        const decPart = digits.slice(-2);

        return `${intPart}.${decPart}`;
    };

    const handleCurrencyInput = (text) => {
        // keep only digits
        let digits = text.replace(/[^0-9]/g, "");

        // remove leading zeros
        digits = digits.replace(/^0+/, "");

        // decide formatted decimal value
        let formatted = "";
        if (digits.length === 0) {
            formatted = "0.00";
        } else if (digits.length === 1) {
            formatted = `0.0${digits}`;
        } else if (digits.length === 2) {
            formatted = `0.${digits}`;
        } else {
            const intPart = digits.slice(0, -2);
            const decPart = digits.slice(-2);
            formatted = `${intPart}.${decPart}`;
        }

        setProjectBudgetDisplay(formatted); // store display value in state
        setProjectBudget(parseFloat(formatted)); // store decimal in state
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <GestureHandlerRootView className="flex-1">
                    <View className="px-4 py-3 w-full">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="size-10 mr-4 rounded-2xl items-center justify-center"
                        >
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-6 pt-2 pb-6">
                        <Text className="text-gray-900 text-2xl font-bold mb-2">Green Building Scores Calculator</Text>
                        <Text className="text-gray-600 text-sm leading-5">
                            Estimate your project's performance against the standards for its green building and cost optimisation compliance.
                        </Text>
                    </View>

                    <ScrollView className="flex-1 px-4">
                        <View className="mb-4">
                            <FormInputField
                                label="Building Type"
                                value={selectedBuildingType}
                                placeholder="Select Building Type"
                                showChevron={true}
                                onPress={handleBuildingTypePress}
                            />

                            <FormInputField
                                label="Building Category"
                                value={selectedCategory}
                                placeholder={selectedBuildingType ? "Select Building Category" : "Please Select Building Type First"}
                                showChevron={true}
                                disabled={!selectedBuildingType}
                                onPress={handleCategoryPress}
                            />

                            <FormInputField
                                label="Project/Building Size (m²)"
                                value={formatWithThousandSeparator(buildingSizeDisplay)}
                                placeholder="Enter Project/Building Size"
                                onChangeText={(text) => handleNumericInput(text, setBuildingSize, setBuildingSizeDisplay, false)}
                                keyboardType="decimal-pad"
                                inputMode="decimal"
                            />

                            <FormInputField
                                label="Project/Building Budget (in RM)"
                                value={formatCurrency(projectBudgetDisplay)}
                                placeholder="Enter Project/Building Budget"
                                onChangeText={handleCurrencyInput}
                                keyboardType="numeric"
                                inputMode="numeric"
                            />

                            <FormInputField
                                label="Year of Proposed Project/Building"
                                value={selectedYear}
                                placeholder="Select Year of Proposed Project"
                                showChevron={true}
                                onPress={handleYearPress}
                            />

                            <FormInputField
                                label="State"
                                value={selectedState}
                                placeholder="Select State"
                                showChevron={true}
                                onPress={handleStatePress}
                            />

                            {selectedState && locationMapping[selectedState]?.regions && (
                                <FormInputField
                                    label="Region"
                                    value={selectedRegion}
                                    placeholder="Select Region"
                                    showChevron={true}
                                    onPress={handleRegionPress}
                                />
                            )}

                            <FormInputField
                                label="Target Certified Rating Scale"
                                value={ratingScaleMapping[selectedCertifiedRatingScale]}
                                placeholder="Select Target Certified Rating Scale"
                                showChevron={true}
                                onPress={handleRatingPress}
                            />
                        </View>
                    </ScrollView>

                    {/* Next Button */}
                    <View className="px-6 py-4">
                        <TouchableOpacity
                            className="bg-green-600 rounded-full py-4 items-center"
                            activeOpacity={0.8}
                            onPress={() => {
                                console.log('Form submitted:', formData);
                            }}
                        >
                            <Text className="text-white text-base font-semibold">Submit</Text>
                        </TouchableOpacity>
                    </View>

                    {renderBottomSheet(
                        buildingTypeBottomSheetRef,
                        buildingTypes.map((bt) => bt.building_type),
                        selectedBuildingType,
                        handleBuildingTypeSelect,
                        "Building Type"
                    )}
                    {renderBottomSheet(
                        categoryBottomSheetRef,
                        categories.map((cat) => cat.category),
                        selectedCategory,
                        handleCategorySelect,
                        "Building Category"
                    )}
                    {renderBottomSheet(
                        yearBottomSheetRef,
                        yearList.map((year) => year.toString()),
                        selectedYear,
                        handleYearSelect,
                        "Year of Proposed Project/Building"
                    )}
                    {renderBottomSheet(
                        stateBottomSheetRef,
                        Object.keys(locationMapping),
                        selectedState,
                        handleStateSelect,
                        "State"
                    )}
                    {renderBottomSheet(
                        regionBottomSheetRef,
                        Object.keys(locationMapping[selectedState]?.regions || {}),
                        selectedRegion,
                        handleRegionSelect,
                        "Region"
                    )}
                    {renderBottomSheet(
                        ratingScaleBottomSheetRef,
                        Object.keys(ratingScaleMapping),
                        selectedCertifiedRatingScale,
                        handleRatingSelect,
                        "Target Certified Rating Scale"
                    )}
                </GestureHandlerRootView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}

export default GBSCalculatorScreen;