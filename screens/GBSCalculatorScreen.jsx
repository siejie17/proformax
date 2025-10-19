import { View, Text, TouchableWithoutFeedback, Keyboard, TouchableOpacity, StatusBar, ScrollView, FlatList } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import api from '../services/api';

import FormInputField from '../components/FormInputField';
import LoadingIndicator from '../components/LoadingIndicator';
import SelectionItem from '../components/SelectionItem';

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

    const RNCStructures = [
        "Single Storey (R.C.) Building",
        "2-4 Storey (R.C.) Building (Flat Roof)",
        "2-4 Storey (R.C.) Building (Pitched Roof)",
        "5 Storey and Above (R.C.) Building (For Accommodation)"
    ];

    const NRNCBaseStructures = [
        "5 Storey and Above (R.C.) Building (For Office)",
        "Timber Building",
        "Timber Piling",
        "R.C. Piling"
    ];

    const NRNCSpecialCases = {
        Sarawak: [...NRNCBaseStructures, "Single Storey Steel (Building)"],
        Sabah: [
            ...NRNCBaseStructures,
            "Single Storey Steel (Building)",
            "Single Storey Steel (Tower Only)"
        ]
    };

    const structuresMapping = {
        "Single Storey (R.C.) Building": "1",
        "2-4 Storey (R.C.) Building (Flat Roof)": "2",
        "2-4 Storey (R.C.) Building (Pitched Roof)": "3",
        "5 Storey and Above (R.C.) Building (For Accommodation)": "4",
        "5 Storey and Above (R.C.) Building (For Office)": "5",
        "Timber Building": "6",
        "Timber Piling": "7",
        "R.C. Piling": "8",
        "Single Storey Steel (Building)": "9",
        "Single Storey Steel (Tower Only)": "10"
    };

    const ratingScaleMapping = {
        "Platinum (86 - 100)": "Platinum",
        "Gold (76 - 85)": "Gold",
        "Silver (66 - 75)": "Silver",
        "Certified (50 - 65)": "Certified"
    };

    const previewWays = {
        "Simplified (fast, general cost overview)": "Simplified",
        "Detailed (thorough, itemized cost breakdown)": "Detailed"
    };

    const [buildingTypes, setBuildingTypes] = useState([]);
    const [selectedBuildingType, setSelectedBuildingType] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [structures, setStructures] = useState([]);

    const [loading, setLoading] = useState(false);

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
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [selectedPreviewWay, setSelectedPreviewWay] = useState(null);
    const [selectedCertifiedRatingScale, setSelectedCertifiedRatingScale] = useState(null);

    const [buildingSizeDisplay, setBuildingSizeDisplay] = useState('');
    const [projectBudgetDisplay, setProjectBudgetDisplay] = useState("0"); // in cents

    const [activeSheet, setActiveSheet] = useState(null);

    // Error states for form validation
    const [errors, setErrors] = useState({
        buildingType: '',
        category: '',
        year: '',
        buildingSize: '',
        projectBudget: '',
        state: '',
        region: '',
        structure: '',
        previewWay: '',
        certifiedRatingScale: ''
    });

    const buildingTypeBottomSheetRef = useRef(null);
    const categoryBottomSheetRef = useRef(null);
    const yearBottomSheetRef = useRef(null);
    const stateBottomSheetRef = useRef(null);
    const regionBottomSheetRef = useRef(null);
    const ratingScaleBottomSheetRef = useRef(null);
    const structureBottomSheetRef = useRef(null);
    const previewWayBottomSheetRef = useRef(null);

    const snapPoints = useMemo(() => ['25%', '50%'], []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const response = await api.get('/categories');
                setBuildingTypes(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
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

    useEffect(() => {
        if (selectedBuildingType && selectedState) {
            if (selectedBuildingType === "Residential New Construction (RNC)") {
                setSelectedStructure(null);
                setStructures(RNCStructures);
            } else if (selectedBuildingType === "Non-Residential New Construction (NRNC)") {
                setSelectedStructure(null);
                if (selectedState === "Sabah" || selectedState === "Sarawak") {
                    setStructures(NRNCSpecialCases[selectedState]);
                } else {
                    setStructures(NRNCBaseStructures);
                }
            }
        } else {
            setSelectedStructure(null);
            setStructures([]);
        }
    }, [selectedBuildingType, selectedState]);

    const handleBuildingTypePress = useCallback(() => {
        clearError('buildingType');
        setActiveSheet('buildingType');
        buildingTypeBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleBuildingTypeSelect = useCallback((buildingType) => {
        setSelectedBuildingType(buildingType);
        clearError('buildingType');
        buildingTypeBottomSheetRef.current?.close();
    }, []);

    const handleCategoryPress = useCallback(() => {
        clearError('category');
        setActiveSheet('category');
        categoryBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleCategorySelect = useCallback((category) => {
        setSelectedCategory(category);
        clearError('category');
        categoryBottomSheetRef.current?.close();
    }, []);

    const handleYearPress = useCallback(() => {
        clearError('year');
        setActiveSheet('year');
        yearBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleYearSelect = useCallback((year) => {
        setSelectedYear(year);
        clearError('year');
        yearBottomSheetRef.current?.close();
    }, []);

    const handleStatePress = useCallback(() => {
        clearError('state');
        setActiveSheet('state');
        stateBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleStateSelect = useCallback((state) => {
        setSelectedState(state);
        clearError('state');
        stateBottomSheetRef.current?.close();
    }, []);

    const handleRegionPress = useCallback(() => {
        clearError('region');
        setActiveSheet('region');
        regionBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleRegionSelect = useCallback((region) => {
        setSelectedRegion(region);
        clearError('region');
        regionBottomSheetRef.current?.close();
    }, []);

    const handleStructurePress = useCallback(() => {
        clearError('structure');
        setActiveSheet('structure');
        structureBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleStructureSelect = useCallback((structure) => {
        setSelectedStructure(structure);
        clearError('structure');
        structureBottomSheetRef.current?.close();
    }, []);

    const handlePreviewWayPress = useCallback(() => {
        clearError('previewWay');
        setActiveSheet('previewWay');
        previewWayBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handlePreviewWaySelect = useCallback((previewWay) => {
        setSelectedPreviewWay(previewWay);
        clearError('previewWay');
        previewWayBottomSheetRef.current?.close();
    }, []);

    const handleRatingPress = useCallback(() => {
        clearError('certifiedRatingScale');
        setActiveSheet('ratingScale');
        ratingScaleBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleRatingSelect = useCallback((rating) => {
        setSelectedCertifiedRatingScale(rating);
        clearError('certifiedRatingScale');
        ratingScaleBottomSheetRef.current?.close();
    }, []);

    const handleSheetChanges = useCallback((index) => {
        if (index === -1) {
            setActiveSheet(null);
        }
    }, []);

    const clearError = (fieldName) => {
        setErrors(prevErrors => ({
            ...prevErrors,
            [fieldName]: ''
        }));
    };

    // Handlers for disabled field clicks
    const handleDisabledCategoryPress = useCallback(() => {
        if (!selectedBuildingType) {
            setErrors(prevErrors => ({
                ...prevErrors,
                category: 'Please select a building type first'
            }));

            // Clear error after 3 seconds
            setTimeout(() => {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    category: ''
                }));
            }, 3000);
        }
    }, [selectedBuildingType]);

    const handleDisabledStructurePress = useCallback(() => {
        let errorMessage = '';
        if (!selectedBuildingType && !selectedState) {
            errorMessage = 'Please select building type and state first';
        } else if (!selectedBuildingType) {
            errorMessage = 'Please select building type first';
        } else if (!selectedState) {
            errorMessage = 'Please select state first';
        }

        if (errorMessage) {
            setErrors(prevErrors => ({
                ...prevErrors,
                structure: errorMessage
            }));

            // Clear error after 3 seconds
            setTimeout(() => {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    structure: ''
                }));
            }, 3000);
        }
    }, [selectedBuildingType, selectedState]);

    const closeActiveBottomSheet = useCallback(() => {
        if (activeSheet) {
            switch (activeSheet) {
                case 'buildingType':
                    buildingTypeBottomSheetRef.current?.close();
                    break;
                case 'category':
                    categoryBottomSheetRef.current?.close();
                    break;
                case 'year':
                    yearBottomSheetRef.current?.close();
                    break;
                case 'state':
                    stateBottomSheetRef.current?.close();
                    break;
                case 'region':
                    regionBottomSheetRef.current?.close();
                    break;
                case 'structure':
                    structureBottomSheetRef.current?.close();
                    break;
                case 'previewWay':
                    previewWayBottomSheetRef.current?.close();
                    break;
                case 'ratingScale':
                    ratingScaleBottomSheetRef.current?.close();
                    break;
            }
            setActiveSheet(null);
        }
    }, [activeSheet]);

    const renderBottomSheet = useCallback((ref, data, selectedValue, onSelect, title) => (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            enablePanDownToClose
            enableOverDrag={false}
            backgroundStyle={{ backgroundColor: '#ffffff' }}
            handleIndicatorStyle={{ backgroundColor: '#D1D5DB' }}
        >
            <BottomSheetView className="flex-1">
                {loading ? (
                    <LoadingIndicator />
                ) : (
                    <>
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
                            showsVerticalScrollIndicator={false}
                            bounces={true}
                            removeClippedSubviews={true}
                            windowSize={10}
                            maxToRenderPerBatch={10}
                            updateCellsBatchingPeriod={50}
                            initialNumToRender={10}
                            getItemLayout={(data, index) => ({
                                length: 60, // Approximate item height
                                offset: 60 * index,
                                index,
                            })}
                        />
                    </>
                )}
            </BottomSheetView>
        </BottomSheet>
    ), [handleSheetChanges]);

    // helper function to format numbers with commas
    const formatWithThousandSeparator = (value) => {
        if (!value) return "";

        // split integer & decimal part
        let [integer, decimal] = value.split(".");

        // add commas to integer
        integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        return decimal !== undefined ? `${integer}.${decimal}` : integer;
    };

    const handleNumericInput = (text, setNumeric, setDisplay, fieldName) => {
        // Clear error when user starts typing
        if (fieldName) {
            clearError(fieldName);
        }

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
        const intPart = digits.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const decPart = digits.slice(-2);

        return `${intPart}.${decPart}`;
    };

    const handleCurrencyInput = (text) => {
        // Clear error when user starts typing
        clearError('projectBudget');

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

    const validateForm = () => {
        const newErrors = {
            buildingType: '',
            category: '',
            year: '',
            buildingSize: '',
            projectBudget: '',
            state: '',
            region: '',
            structure: '',
            certifiedRatingScale: ''
        };

        // Validate building type
        if (!selectedBuildingType) {
            newErrors.buildingType = 'Please select a building type';
        }

        // Validate category
        if (!selectedCategory) {
            newErrors.category = 'Please select a building category';
        }

        // Validate year
        if (!selectedYear) {
            newErrors.year = 'Please select a year';
        }

        // Validate building size
        if (!buildingSize || buildingSize <= 0) {
            newErrors.buildingSize = 'Please enter a valid building size';
        }

        // Validate project budget
        if (!projectBudget || projectBudget <= 0) {
            newErrors.projectBudget = 'Please enter a valid project budget';
        }

        // Validate state
        if (!selectedState) {
            newErrors.state = 'Please select a state';
        }

        // Validate region (only for Sabah and Sarawak)
        if ((selectedState === "Sabah" || selectedState === "Sarawak") && !selectedRegion) {
            newErrors.region = 'Please select a region';
        }

        // Validate structure
        if (!selectedStructure) {
            newErrors.structure = 'Please select a structure';
        }

        if (!selectedPreviewWay) {
            newErrors.previewWay = 'Please select a cost preview way';
        }

        // Validate certified rating scale
        if (!selectedCertifiedRatingScale) {
            newErrors.certifiedRatingScale = 'Please select a rating scale';
        }

        setErrors(newErrors);

        // Return true if no errors
        return Object.values(newErrors).every(error => error === '');
    };

    const handleFormSubmit = () => {
        // if (!validateForm()) {
        //     return;
        // }

        // const formData = {
        //     buildingType: selectedBuildingType,
        //     category: selectedCategory,
        //     year: selectedYear,
        //     buildingSize: buildingSize,
        //     projectBudget: projectBudget,
        //     state: selectedState,
        //     region: selectedRegion || '',
        //     structure: selectedStructure,
        //     certifiedRatingScale: selectedCertifiedRatingScale,
        //     costPreviewWay: "Detailed"
        // };

        const formData = {
            "buildingType": "Non-Residential New Construction (NRNC)",
            "category": "Multi-purpose halls",
            "year": 2026,
            "buildingSize": 2500.75,
            "projectBudget": 14300000.00,
            "state": "Sarawak",
            "region": "Miri",
            "structure": "5 Storey and Above (R.C.) Building (For Office)",
            "certifiedRatingScale": "Platinum (86 - 100)",
            "costPreviewWay": "Detailed"
        }

        navigation.replace('Results', { formData });
    }

    if (loading) {
        return (
            <LoadingIndicator />
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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

                    <ScrollView
                        className="flex-1 px-4"
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        removeClippedSubviews={true}
                        scrollEventThrottle={16}
                        bounces={true}
                    >
                        <View className="mb-4">
                            <FormInputField
                                label="Building Type"
                                value={selectedBuildingType}
                                placeholder="Select Building Type"
                                showChevron={true}
                                disabled={activeSheet && activeSheet !== 'buildingType'}
                                onPress={handleBuildingTypePress}
                                error={errors.buildingType}
                            />

                            <FormInputField
                                label="Building Category"
                                value={selectedCategory}
                                placeholder={selectedBuildingType ? "Select Building Category" : "Please Select Building Type First"}
                                showChevron={true}
                                disabled={!selectedBuildingType || (activeSheet && activeSheet !== 'category')}
                                onPress={handleCategoryPress}
                                onDisabledPress={handleDisabledCategoryPress}
                                error={errors.category}
                            />

                            <FormInputField
                                label="Project/Building Size (m²)"
                                value={formatWithThousandSeparator(buildingSizeDisplay)}
                                placeholder="Enter Project/Building Size"
                                onChangeText={(text) => handleNumericInput(text, setBuildingSize, setBuildingSizeDisplay, 'buildingSize')}
                                onFocus={closeActiveBottomSheet}
                                keyboardType="decimal-pad"
                                inputMode="decimal"
                                error={errors.buildingSize}
                            />

                            <FormInputField
                                label="Project/Building Budget (in RM)"
                                value={formatCurrency(projectBudgetDisplay)}
                                placeholder="Enter Project/Building Budget"
                                onChangeText={handleCurrencyInput}
                                onFocus={closeActiveBottomSheet}
                                keyboardType="numeric"
                                inputMode="numeric"
                                error={errors.projectBudget}
                            />

                            <FormInputField
                                label="Year of Proposed Project/Building"
                                value={selectedYear}
                                placeholder="Select Year of Proposed Project"
                                showChevron={true}
                                disabled={activeSheet && activeSheet !== 'year'}
                                onPress={handleYearPress}
                                error={errors.year}
                            />

                            <FormInputField
                                label="State"
                                value={selectedState}
                                placeholder="Select State"
                                showChevron={true}
                                disabled={activeSheet && activeSheet !== 'state'}
                                onPress={handleStatePress}
                                error={errors.state}
                            />

                            {selectedState && locationMapping[selectedState]?.regions && (
                                <FormInputField
                                    label="Region"
                                    value={selectedRegion}
                                    placeholder="Select Region"
                                    showChevron={true}
                                    disabled={activeSheet && activeSheet !== 'region'}
                                    onPress={handleRegionPress}
                                    error={errors.region}
                                />
                            )}

                            <FormInputField
                                label="Structure"
                                value={selectedStructure}
                                placeholder={!selectedBuildingType || !selectedState ? "Please Select Building Type and State First" : "Select Structure"}
                                showChevron={true}
                                disabled={!selectedBuildingType || !selectedState || (activeSheet && activeSheet !== 'structure')}
                                onPress={handleStructurePress}
                                onDisabledPress={handleDisabledStructurePress}
                                error={errors.structure}
                            />

                            <FormInputField
                                label="Cost Preview Way"
                                value={previewWays[selectedPreviewWay] ?? ''}
                                placeholder="Select Cost Preview Way"
                                showChevron={true}
                                disabled={activeSheet && activeSheet !== 'previewWay'}
                                onPress={handlePreviewWayPress}
                                error={errors.previewWay}
                            />

                            <FormInputField
                                label="Target Certified Rating Scale"
                                value={ratingScaleMapping[selectedCertifiedRatingScale]}
                                placeholder="Select Target Certified Rating Scale"
                                showChevron={true}
                                disabled={activeSheet && activeSheet !== 'ratingScale'}
                                onPress={handleRatingPress}
                                error={errors.certifiedRatingScale}
                            />
                        </View>
                    </ScrollView>

                    {/* Next Button */}
                    <View className="px-6 py-4">
                        <TouchableOpacity
                            className="bg-green-600 rounded-full py-4 items-center"
                            activeOpacity={0.8}
                            onPress={handleFormSubmit}
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
                        structureBottomSheetRef,
                        structures,
                        selectedStructure,
                        handleStructureSelect,
                        "Structure"
                    )}
                    {renderBottomSheet(
                        previewWayBottomSheetRef,
                        Object.keys(previewWays),
                        selectedPreviewWay,
                        handlePreviewWaySelect,
                        "Cost Preview Way"
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