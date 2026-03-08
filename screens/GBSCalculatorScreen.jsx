import { View, Text, TouchableWithoutFeedback, Keyboard, TouchableOpacity, StatusBar, ScrollView, FlatList } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import api from '../services/api';

import FormInputField from '../components/FormInputField';
import LoadingIndicator from '../components/LoadingIndicator';
import SelectionItem from '../components/SelectionItem';
import AIButton from '../components/AIButton';
import AIAssistantWrapper from '../components/AIAssistantWrapper';

const GBSCalculatorScreen = ({ navigation }) => {
    const scrollRef = useRef(null);

    const ratingScaleMapping = {
        "Platinum (86 - 100)": "Platinum",
        "Gold (76 - 85)": "Gold",
        "Silver (66 - 75)": "Silver",
        "Certified (50 - 65)": "Certified",
        "Not Certified (0 - 49)": "Not Certified"
    };

    const [buildingTypes, setBuildingTypes] = useState([]);
    const [selectedBuildingType, setSelectedBuildingType] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [mappedCategories, setMappedCategories] = useState(null);
    const [mappedRegions, setMappedRegions] = useState(null);
    const [mappedStructures, setMappedStructures] = useState(null);
    const [categories, setCategories] = useState([]);
    const [structures, setStructures] = useState([]);
    const [states, setStates] = useState([]);
    const [regions, setRegions] = useState([]);

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

    const [projectName, setProjectName] = useState(null);

    const [selectedYear, setSelectedYear] = useState(null);
    const [buildingSize, setBuildingSize] = useState(0.00);
    const [projectBudget, setProjectBudget] = useState(0.00);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [selectedCertifiedRatingScale, setSelectedCertifiedRatingScale] = useState(null);

    const [buildingSizeDisplay, setBuildingSizeDisplay] = useState('');
    const [projectBudgetDisplay, setProjectBudgetDisplay] = useState(""); // in cents

    const [activeSheet, setActiveSheet] = useState(null);
    const [aiModalVisible, setAIModalVisible] = useState(false);

    // Error states for form validation
    const [errors, setErrors] = useState({
        projectName: '',
        buildingType: '',
        category: '',
        year: '',
        buildingSize: '',
        projectBudget: '',
        state: '',
        region: '',
        structure: '',
        certifiedRatingScale: ''
    });

    const buildingTypeBottomSheetRef = useRef(null);
    const categoryBottomSheetRef = useRef(null);
    const yearBottomSheetRef = useRef(null);
    const stateBottomSheetRef = useRef(null);
    const regionBottomSheetRef = useRef(null);
    const ratingScaleBottomSheetRef = useRef(null);
    const structureBottomSheetRef = useRef(null);

    const snapPoints = useMemo(() => ['10%'], []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const formInputFields = await api.get('/form-inputs');
                setBuildingTypes(formInputFields.data.buildingTypes);
                setMappedCategories(formInputFields.data.categories);
                setStates(formInputFields.data.states);
                setMappedRegions(formInputFields.data.regions);
                setMappedStructures(formInputFields.data.structures);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Reset form when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            setProjectName('');
            setSelectedBuildingType(null);
            setSelectedCategory(null);
            setSelectedYear(null);
            setBuildingSize(0.00);
            setProjectBudget(0.00);
            setSelectedState(null);
            setSelectedRegion(null);
            setSelectedStructure(null);
            setSelectedCertifiedRatingScale(null);
            setBuildingSizeDisplay('');
            setProjectBudgetDisplay('');
            setErrors({
                projectName: '',
                buildingType: '',
                category: '',
                year: '',
                buildingSize: '',
                projectBudget: '',
                state: '',
                region: '',
                structure: '',
                certifiedRatingScale: ''
            });
            // Scroll to top when screen is focused
            scrollRef.current?.scrollTo({ y: 0, animated: false });
        }, [])
    );

    // Update categories when building type changes
    useEffect(() => {
        if (selectedBuildingType) {
            const categories = mappedCategories[selectedBuildingType];
            setCategories(categories || []);
            setSelectedCategory(null); // reset category when type changes
        } else {
            setCategories([]);
        }
    }, [selectedBuildingType, mappedCategories]);

    useEffect(() => {
        if (selectedBuildingType && selectedState) {
            if (selectedBuildingType === "Residential New Construction (RNC)") {
                setSelectedStructure(null);
                setStructures(mappedStructures?.[selectedBuildingType]?.["ALL"] || []);
            } else if (selectedBuildingType === "Non-Residential New Construction (NRNC)") {
                setSelectedStructure(null);
                if (selectedState === "Sabah" || selectedState === "Sarawak") {
                    setStructures(mappedStructures[selectedBuildingType][selectedState.toUpperCase()]);
                } else {
                    setStructures(mappedStructures[selectedBuildingType]["SMSIA"]);
                }
            }
        } else {
            setSelectedStructure(null);
            setStructures([]);
        }
    }, [selectedBuildingType, selectedState]);

    useEffect(() => {
        if (selectedState === "Sabah" || selectedState === "Sarawak") {
            setSelectedRegion(null);
            setRegions(mappedRegions[selectedState] || []);
        } else {
            setSelectedRegion(null);
            setRegions([]);
        }
    }, [selectedState, mappedRegions]);

    const handleBuildingTypePress = useCallback(() => {
        Keyboard.dismiss();
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
        Keyboard.dismiss();
        clearError('category');
        setActiveSheet('category');
        categoryBottomSheetRef.current?.snapToIndex(1);
    }, [categories]);

    const handleCategorySelect = useCallback((category) => {
        setSelectedCategory(category);
        clearError('category');
        categoryBottomSheetRef.current?.close();
    }, []);

    const handleYearPress = useCallback(() => {
        Keyboard.dismiss();
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
        Keyboard.dismiss();
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
        Keyboard.dismiss();
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
        Keyboard.dismiss();
        clearError('structure');
        setActiveSheet('structure');
        structureBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleStructureSelect = useCallback((structure) => {
        setSelectedStructure(structure);
        clearError('structure');
        structureBottomSheetRef.current?.close();
    }, []);

    const handleRatingPress = useCallback(() => {
        Keyboard.dismiss();
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

    const handleBudgetFocus = () => {
        closeActiveBottomSheet();
        // Show 0.00 on focus if field is empty
        if (projectBudgetDisplay === "") {
            setProjectBudgetDisplay("0");
        }
    };

    const handleBudgetBlur = () => {
        // Reset to empty if value is still 0.00
        if (projectBudgetDisplay === "0" || formatCurrency(projectBudgetDisplay) === "0.00") {
            setProjectBudgetDisplay("");
            setProjectBudget(0.00);
        }
    };

    const validateForm = () => {
        const newErrors = {
            projectName: '',
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

        // Validate project name
        if (!projectName || !projectName.trim()) {
            newErrors.projectName = 'Please enter a project name';
        }

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

        // Validate project budget - allow 0 or null (system will predict), but not negative
        if (projectBudget < 0) {
            newErrors.projectBudget = 'Project budget cannot be negative';
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

        // Validate certified rating scale
        if (!selectedCertifiedRatingScale) {
            newErrors.certifiedRatingScale = 'Please select a rating scale';
        }

        setErrors(newErrors);

        // Return true if no errors
        return Object.values(newErrors).every(error => error === '');
    };

    const handleFormSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const formData = {
            projectName: projectName,
            buildingType: selectedBuildingType,
            category: selectedCategory,
            year: selectedYear,
            buildingSize: buildingSize,
            projectBudget: projectBudget > 0 ? projectBudget : null,
            state: selectedState,
            region: selectedRegion || '',
            structure: selectedStructure,
            costPreviewWay: "Detailed",
            certifiedRatingScale: selectedCertifiedRatingScale
        };

        navigation.navigate('Results', { formData });
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
                    <View className="px-4 py-3 w-full flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="size-10 rounded-2xl items-center justify-center"
                        >
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                        </TouchableOpacity>

                        <View className="items-end">
                            <AIButton onPress={() => setAIModalVisible(true)} />
                        </View>
                    </View>

                    <View className="px-6 pt-2 pb-6">
                        <Text className="text-gray-900 text-2xl font-bold mb-2">Green Building Scores Calculator</Text>
                        <Text className="text-gray-600 text-sm leading-5">
                            Estimate your project's performance against the standards for its green building and cost optimisation compliance.
                        </Text>
                    </View>

                    <ScrollView
                        ref={scrollRef}
                        className="flex-1 px-4"
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        removeClippedSubviews={true}
                        scrollEventThrottle={16}
                        bounces={true}
                    >
                        <View className="mb-4">
                            <FormInputField
                                label="Project Name"
                                value={projectName}
                                placeholder="Enter Project Name"
                                onChangeText={setProjectName}
                                error={errors.projectName}
                            />

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
                                value={projectBudgetDisplay === "" ? "" : formatCurrency(projectBudgetDisplay)}
                                placeholder="Enter budget or leave empty"
                                onChangeText={handleCurrencyInput}
                                onFocus={handleBudgetFocus}
                                onBlur={handleBudgetBlur}
                                keyboardType="numeric"
                                inputMode="numeric"
                                error={errors.projectBudget}
                                required={false}
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

                            {selectedState && regions.length !== 0 && (
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
                                label="Target Certified Rating Scale"
                                value={selectedCertifiedRatingScale ?? ''}
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

                    <AIAssistantWrapper isVisible={aiModalVisible} onClose={() => setAIModalVisible(false)} />

                    {renderBottomSheet(
                        buildingTypeBottomSheetRef,
                        buildingTypes,
                        selectedBuildingType,
                        handleBuildingTypeSelect,
                        "Building Type"
                    )}
                    {renderBottomSheet(
                        categoryBottomSheetRef,
                        categories,
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
                        states,
                        selectedState,
                        handleStateSelect,
                        "State"
                    )}
                    {renderBottomSheet(
                        regionBottomSheetRef,
                        regions,
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