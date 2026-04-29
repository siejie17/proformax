import { Animated, View, Text, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback, Dimensions, TextInput } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

import api from '../services/api';

import InfoGuideModal from '../components/InfoGuideModal';
import SkeletonLoader from '../components/SkeletonLoader';
import PointsBadge from '../components/PointsBadge';
import GroupLabel from '../components/GroupLabel';
import IconButton from '../components/IconButton';
import AddCustomItemRow from '../components/AddCustomItemRow';

configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

const GreenElementsDisplayScreen = ({
    greenElements,
    selectedProject,
    setSelectedProject,
    marksData, setMarksData,
    showCostUpdatedToast,
    onAuditSubmitRef = null,
    hideSubmitButton = false,
    ...otherProps
}) => {
    const certifiedScaleRange = otherProps?.certifiedScaleRange || {};
    const isRefreshingProject = otherProps?.isRefreshingProject || false;
    const activeActualCostBreakdown = otherProps?.actualCostBreakdown || selectedProject?.cost_breakdown || null;
    const onAuditUnsavedChange = otherProps?.onAuditUnsavedChange || (() => { });
    const safeGreenElements = Array.isArray(greenElements) ? greenElements : [];

    const createEmptyAuditState = () => ({
        items: {},
        options: {},
        subitems: {},
        customEntries: {},
    });

    const createEmptyAuditMeta = () => ({
        items: {},
        options: {},
        subitems: {},
        customEntries: {},
        selections: {},
    });

    const [criteria, setCriteria] = useState([]);
    const [selectedDropdowns, setSelectedDropdowns] = useState({});
    const [selectedCriterion, setSelectedCriterion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isInfoGuideVisible, setIsInfoGuideVisible] = useState(false);
    const [infoGuideText, setInfoGuideText] = useState('');
    const [infoGuideTitle, setInfoGuideTitle] = useState('Information');
    const [infoGuideLabel, setInfoGuideLabel] = useState('Guide');
    const [baselineAnswers, setBaselineAnswers] = useState(createEmptyAuditState);
    const [baselineAnswerMeta, setBaselineAnswerMeta] = useState(createEmptyAuditMeta);
    const [actualAnswers, setActualAnswers] = useState(createEmptyAuditState);
    const [baselineSelectionAnswers, setBaselineSelectionAnswers] = useState({});
    const [actualSelectionAnswers, setActualSelectionAnswers] = useState({});
    const [activeExclusiveGroup, setActiveExclusiveGroup] = useState(null);
    const [customInputs, setCustomInputs] = useState({});
    const [customItems, setCustomItems] = useState({});

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const lastAppliedMultiplierRef = useRef(null);
    const lastAuditInitializationSignatureRef = useRef(null);

    const verticalScrollRef = useRef(null); // Ref for vertical ScrollView

    const handleInfoGuideOpen = (text, title = 'Information', label = 'Guide') => {
        setInfoGuideText(text);
        setInfoGuideTitle(title);
        setInfoGuideLabel(label);
        setIsInfoGuideVisible(true);
    }

    const selectedCriterionData = useMemo(() => {
        if (criteria && selectedCriterion) {
            return criteria.find(criterion => criterion.name === selectedCriterion);
        }
        return null;
    }, [criteria, selectedCriterion]);

    const handleSectionPress = useCallback((criterion) => {
        setSelectedCriterion(criterion.name);

        // Reset vertical scroll to top
        verticalScrollRef.current?.scrollTo({ y: 0, animated: true });

        fadeAnim.setValue(0);
        slideAnim.setValue(50);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();
    }, [fadeAnim, slideAnim]);

    useEffect(() => {
        setLoading(true);

        if (safeGreenElements.length > 0) {
            const newSections = safeGreenElements.map(item => {
                let name;

                if (typeof item === 'string') {
                    name = item;
                } else if (item && item.name) {
                    name = item.name;
                } else {
                    name = String(item);
                }

                return name ? { ...item } : null;
            }).filter(Boolean);

            setSelectedCriterion(newSections[0]?.name);
            setCriteria(newSections);
        } else {
            setCriteria([]);
        }

        setLoading(false);
    }, [safeGreenElements]);

    const checkedItemsPayload = useMemo(() => {
        return selectedProject?.checked_items && typeof selectedProject.checked_items === 'object' && !Array.isArray(selectedProject.checked_items)
            ? selectedProject.checked_items
            : null;
    }, [selectedProject]);

    const actualCheckedItemsPayload = useMemo(() => {
        return selectedProject?.actual_checked_items && typeof selectedProject.actual_checked_items === 'object' && !Array.isArray(selectedProject.actual_checked_items)
            ? selectedProject.actual_checked_items
            : null;
    }, [selectedProject]);

    const answerIdsPayload = useMemo(() => {
        return checkedItemsPayload?.answerIds
            ?? selectedProject?.answer_ids
            ?? null;
    }, [checkedItemsPayload, selectedProject]);

    const actualAnswerIdsPayload = useMemo(() => {
        return selectedProject?.actual_answers_id ?? null;
    }, [selectedProject]);

    const auditInitializationSignature = useMemo(() => JSON.stringify({
        criteria: (criteria || []).map((criterion) => criterion?.name || ''),
        checked_items: selectedProject?.checked_items ?? null,
        checked_options: selectedProject?.checked_options ?? null,
        checked_subitems: selectedProject?.checked_subitems ?? null,
        custom_inputs: selectedProject?.custom_inputs ?? null,
        selected_items: selectedProject?.selected_items ?? selectedProject?.selectedItems ?? null,
        actual_checked_items: selectedProject?.actual_checked_items ?? null,
        actual_checked_options: selectedProject?.actual_checked_options ?? null,
        actual_checked_subitems: selectedProject?.actual_checked_subitems ?? null,
        actual_custom_inputs: selectedProject?.actual_custom_inputs ?? null,
        actual_selected_items: selectedProject?.actual_selected_items ?? selectedProject?.actualSelectedItems ?? null,
        answer_ids: selectedProject?.answer_ids ?? null,
        actual_answers_id: selectedProject?.actual_answers_id ?? null,
        checked_items_payload: checkedItemsPayload ?? null,
        actual_checked_items_payload: actualCheckedItemsPayload ?? null,
    }), [
        actualCheckedItemsPayload,
        checkedItemsPayload,
        criteria,
        selectedProject?.actual_answers_id,
        selectedProject?.actual_checked_items,
        selectedProject?.actual_checked_options,
        selectedProject?.actual_checked_subitems,
        selectedProject?.actual_custom_inputs,
        selectedProject?.actual_selected_items,
        selectedProject?.actualSelectedItems,
        selectedProject?.answer_ids,
        selectedProject?.checked_items,
        selectedProject?.checked_options,
        selectedProject?.checked_subitems,
        selectedProject?.custom_inputs,
        selectedProject?.selected_items,
        selectedProject?.selectedItems,
    ]);

    const toNumericId = useCallback((value) => {
        if (value === null || value === undefined || value === '') return null;

        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }, []);

    const normalizeIdArray = useCallback((value) => {
        if (Array.isArray(value)) {
            return value.map(toNumericId).filter(item => item !== null);
        }

        if (value && typeof value === 'object') {
            return Object.keys(value)
                .filter(key => value[key])
                .map(toNumericId)
                .filter(item => item !== null);
        }

        return [];
    }, [toNumericId]);

    const hasNestedValues = useCallback((value) => {
        if (value === null || value === undefined) return false;
        if (Array.isArray(value)) return value.some(hasNestedValues);
        if (typeof value === 'object') return Object.values(value).some(hasNestedValues);
        if (typeof value === 'string') return value.trim() !== '';
        return true;
    }, []);

    const getCheckedOptionIds = useCallback((groupId) => {
        const currentValue = checkedItemsPayload?.checkedOptions?.[groupId]
            ?? selectedProject?.checked_options?.[groupId]
            ?? [];

        return normalizeIdArray(currentValue);
    }, [checkedItemsPayload, normalizeIdArray, selectedProject]);

    const getSelectedSelectionId = useCallback((groupId) => {
        return toNumericId(
            checkedItemsPayload?.selections?.[groupId]
            ?? selectedProject?.selected_items?.[groupId]
            ?? selectedProject?.selectedItems?.[groupId]
            ?? null
        );
    }, [checkedItemsPayload, selectedProject, toNumericId]);

    const getCheckedSubitemsList = useCallback((itemId) => {
        return normalizeIdArray(
            checkedItemsPayload?.checkedSubitems?.[itemId]
            ?? selectedProject?.checked_subitems?.[itemId]
            ?? []
        );
    }, [checkedItemsPayload, normalizeIdArray, selectedProject]);

    const getCustomInputsList = useCallback((itemId) => {
        const currentValue = checkedItemsPayload?.customItems?.[itemId]
            ?? selectedProject?.custom_inputs?.[itemId]
            ?? [];

        if (Array.isArray(currentValue)) {
            return currentValue;
        }

        return [];
    }, [checkedItemsPayload, selectedProject]);

    const getCheckedItemIds = useCallback(() => {
        if (Array.isArray(selectedProject?.checked_items)) {
            return normalizeIdArray(selectedProject.checked_items);
        }

        if (Array.isArray(checkedItemsPayload?.checkedItems)) {
            return normalizeIdArray(checkedItemsPayload.checkedItems);
        }

        return [];
    }, [checkedItemsPayload, normalizeIdArray, selectedProject]);

    const getActualCheckedOptionIds = useCallback((groupId) => {
        const currentValue = actualCheckedItemsPayload?.checkedOptions?.[groupId]
            ?? selectedProject?.actual_checked_options?.[groupId]
            ?? [];

        return normalizeIdArray(currentValue);
    }, [actualCheckedItemsPayload, normalizeIdArray, selectedProject]);

    const getActualSelectedSelectionId = useCallback((groupId) => {
        return toNumericId(
            actualCheckedItemsPayload?.selections?.[groupId]
            ?? selectedProject?.actual_selected_items?.[groupId]
            ?? selectedProject?.actualSelectedItems?.[groupId]
            ?? null
        );
    }, [actualCheckedItemsPayload, selectedProject, toNumericId]);

    const getActualCheckedSubitemsList = useCallback((itemId) => {
        return normalizeIdArray(
            actualCheckedItemsPayload?.checkedSubitems?.[itemId]
            ?? selectedProject?.actual_checked_subitems?.[itemId]
            ?? []
        );
    }, [actualCheckedItemsPayload, normalizeIdArray, selectedProject]);

    const getActualCustomInputsList = useCallback((itemId) => {
        const currentValue = actualCheckedItemsPayload?.customItems?.[itemId]
            ?? selectedProject?.actual_custom_inputs?.[itemId]
            ?? [];

        if (Array.isArray(currentValue)) {
            return currentValue;
        }

        return [];
    }, [actualCheckedItemsPayload, selectedProject]);

    const getCustomEntryAuditKey = useCallback((itemId, customValue, fallbackIndex = null) => {
        const normalizedCustomValue = customValue === null || customValue === undefined
            ? ''
            : String(customValue).trim();

        if (normalizedCustomValue) {
            return `${itemId}:value:${normalizedCustomValue}`;
        }

        return `${itemId}:index:${fallbackIndex ?? ''}`;
    }, []);

    const getActualCheckedItemIds = useCallback(() => {
        if (Array.isArray(selectedProject?.actual_checked_items)) {
            return normalizeIdArray(selectedProject.actual_checked_items);
        }

        if (Array.isArray(actualCheckedItemsPayload?.checkedItems)) {
            return normalizeIdArray(actualCheckedItemsPayload.checkedItems);
        }

        return [];
    }, [actualCheckedItemsPayload, normalizeIdArray, selectedProject]);

    const hasPersistedActualAudit = useMemo(() => {
        const actualSources = [
            actualCheckedItemsPayload?.checkedItems ?? selectedProject?.actual_checked_items ?? null,
            actualCheckedItemsPayload?.checkedOptions ?? selectedProject?.actual_checked_options ?? null,
            actualCheckedItemsPayload?.checkedSubitems ?? selectedProject?.actual_checked_subitems ?? null,
            actualCheckedItemsPayload?.customItems ?? selectedProject?.actual_custom_inputs ?? null,
            actualCheckedItemsPayload?.selections
            ?? selectedProject?.actual_selected_items
            ?? selectedProject?.actualSelectedItems
            ?? null,
            actualAnswerIdsPayload ?? null,
        ];

        return actualSources.some(hasNestedValues);
    }, [
        actualAnswerIdsPayload,
        actualCheckedItemsPayload,
        hasNestedValues,
        selectedProject,
    ]);
    const getActualItemAnswerId = useCallback((itemId) => {
        return actualAnswerIdsPayload?.items?.[itemId] ?? null;
    }, [actualAnswerIdsPayload]);

    const getItemAnswerId = useCallback((itemId) => {
        return answerIdsPayload?.items?.[itemId] ?? null;
    }, [answerIdsPayload]);

    const getActualOptionAnswerId = useCallback((groupId, optionId) => {
        return actualAnswerIdsPayload?.options?.[groupId]?.[optionId] ?? null;
    }, [actualAnswerIdsPayload]);

    const getOptionAnswerId = useCallback((groupId, optionId) => {
        return answerIdsPayload?.options?.[groupId]?.[optionId] ?? null;
    }, [answerIdsPayload]);

    const getActualSelectionAnswerId = useCallback((groupId) => {
        return actualAnswerIdsPayload?.selections?.[groupId] ?? null;
    }, [actualAnswerIdsPayload]);

    const getSelectionAnswerId = useCallback((groupId) => {
        return answerIdsPayload?.selections?.[groupId] ?? null;
    }, [answerIdsPayload]);

    const getActualSubitemAnswerId = useCallback((itemId, subitemId) => {
        return actualAnswerIdsPayload?.subitems?.[itemId]?.[subitemId] ?? null;
    }, [actualAnswerIdsPayload]);

    const getSubitemAnswerId = useCallback((itemId, subitemId) => {
        return answerIdsPayload?.subitems?.[itemId]?.[subitemId] ?? null;
    }, [answerIdsPayload]);

    const getCustomEntryAnswerId = useCallback((itemId, customValue, customIndex = null) => {
        const customEntries = answerIdsPayload?.customEntries?.[itemId];
        if (!customEntries) return null;

        const normalizedCustomValue = customValue === null || customValue === undefined
            ? null
            : String(customValue).trim();

        if (normalizedCustomValue !== null && Object.prototype.hasOwnProperty.call(customEntries, normalizedCustomValue)) {
            return customEntries[normalizedCustomValue] ?? null;
        }

        if (customIndex !== null && customIndex !== undefined && Object.prototype.hasOwnProperty.call(customEntries, customIndex)) {
            return customEntries[customIndex] ?? null;
        }

        return null;
    }, [answerIdsPayload]);

    const getActualCustomEntryAnswerId = useCallback((itemId, customValue, customIndex = null) => {
        const customEntries = actualAnswerIdsPayload?.customEntries?.[itemId];
        if (!customEntries) return null;

        const normalizedCustomValue = customValue === null || customValue === undefined
            ? null
            : String(customValue).trim();

        if (normalizedCustomValue !== null && Object.prototype.hasOwnProperty.call(customEntries, normalizedCustomValue)) {
            return customEntries[normalizedCustomValue] ?? null;
        }

        if (customIndex !== null && customIndex !== undefined && Object.prototype.hasOwnProperty.call(customEntries, customIndex)) {
            return customEntries[customIndex] ?? null;
        }

        return null;
    }, [actualAnswerIdsPayload]);

    useEffect(() => {
        if (!criteria.length || !selectedProject) {
            const emptyState = createEmptyAuditState();
            const emptyMeta = createEmptyAuditMeta();
            lastAuditInitializationSignatureRef.current = null;
            setBaselineAnswers(emptyState);
            setBaselineAnswerMeta(emptyMeta);
            setActualAnswers(emptyState);
            setBaselineSelectionAnswers({});
            setActualSelectionAnswers({});
            setSelectedDropdowns({});
            return;
        }

        if (lastAuditInitializationSignatureRef.current === auditInitializationSignature) {
            return;
        }

        const nextBaseline = createEmptyAuditState();
        const nextActual = createEmptyAuditState();
        const nextBaselineMeta = createEmptyAuditMeta();
        const nextBaselineSelections = {};
        const nextActualSelections = {};
        const nextSelectedDropdowns = {};
        let nextActiveExclusiveGroup = null;
        const actualItemIdSet = new Set(getActualCheckedItemIds().map((id) => String(id)));

        criteria.forEach((criterion) => {
            const allItems = [
                ...(criterion.items || []),
                ...(criterion.subcriteria?.flatMap(subcriterion => subcriterion.items || []) || [])
            ];

            allItems.forEach((item) => {
                const optionGroups = Array.isArray(item.option_groups) ? item.option_groups : [];
                const selectionGroups = Array.isArray(item.selection_groups) ? item.selection_groups : [];
                const subitems = Array.isArray(item.subitems) ? item.subitems : [];
                const hasOptions = optionGroups.some(group => Array.isArray(group?.options) && group.options.length > 0);
                const hasSelections = selectionGroups.some(group => Array.isArray(group?.selections) && group.selections.length > 0);
                const hasSubitems = item.subitems_exist && subitems.length > 0;

                if (!hasOptions && !hasSelections && !hasSubitems) {
                    const isFixedActualChecked = actualItemIdSet.has(String(item.id));
                    nextBaseline.items[item.id] = isFixedActualChecked;
                    nextActual.items[item.id] = isFixedActualChecked;
                    nextBaselineMeta.items[item.id] = {
                        itemId: item.id,
                        userAnswerId: isFixedActualChecked
                            ? getActualItemAnswerId(item.id)
                            : null,
                    };
                }

                optionGroups.forEach((group) => {
                    const fixedActualOptionIdSet = new Set(
                        getActualCheckedOptionIds(group.id).map((id) => String(id))
                    );
                    (group.options || []).forEach((option) => {
                        const optionKey = `${group.id}:${option.id}`;
                        const isFixedActualChecked = fixedActualOptionIdSet.has(String(option.id));
                        nextBaseline.options[optionKey] = isFixedActualChecked;
                        nextActual.options[optionKey] = isFixedActualChecked;
                        nextBaselineMeta.options[optionKey] = {
                            optionGroupId: group.id,
                            optionId: option.id,
                            userAnswerId: isFixedActualChecked
                                ? getActualOptionAnswerId(group.id, option.id)
                                : null,
                        };
                    });
                });

                selectionGroups.forEach((group) => {
                    const fixedActualSelectionId = getActualSelectedSelectionId(group.id) ?? null;
                    nextBaselineSelections[group.id] = fixedActualSelectionId;
                    nextActualSelections[group.id] = fixedActualSelectionId;
                    nextSelectedDropdowns[group.id] = fixedActualSelectionId;
                    nextBaselineMeta.selections[group.id] = {
                        selectionGroupId: group.id,
                        userAnswerId: fixedActualSelectionId !== null
                            ? getActualSelectionAnswerId(group.id)
                            : null,
                    };

                    if (group.exclusive && fixedActualSelectionId !== null) {
                        nextActiveExclusiveGroup = group.id;
                    }
                });

                if (hasSubitems) {
                    const fixedActualSubitemIdSet = new Set(
                        getActualCheckedSubitemsList(item.id).map((id) => String(id))
                    );
                    subitems.forEach((subitem) => {
                        const subitemKey = `${item.id}:${subitem.id}`;
                        const isFixedActualChecked = fixedActualSubitemIdSet.has(String(subitem.id));
                        nextBaseline.subitems[subitemKey] = isFixedActualChecked;
                        nextActual.subitems[subitemKey] = isFixedActualChecked;
                        nextBaselineMeta.subitems[subitemKey] = {
                            itemId: item.id,
                            subitemId: subitem.id,
                            userAnswerId: isFixedActualChecked
                                ? getActualSubitemAnswerId(item.id, subitem.id)
                                : null,
                        };
                    });

                    const fixedActualCustomInputsList = getActualCustomInputsList(item.id);
                    fixedActualCustomInputsList.forEach((customValue, index) => {
                        const customKey = getCustomEntryAuditKey(item.id, customValue, index);
                        nextBaseline.customEntries[customKey] = true;
                        nextBaselineMeta.customEntries[customKey] = {
                            itemId: item.id,
                            customIndex: index,
                            customValue,
                            userAnswerId: getActualCustomEntryAnswerId(item.id, customValue, index),
                        };
                        nextActual.customEntries[customKey] = true;
                    });
                }
            });
        });

        setBaselineAnswers(nextBaseline);
        setBaselineAnswerMeta(nextBaselineMeta);
        setActualAnswers(nextActual);
        setBaselineSelectionAnswers(nextBaselineSelections);
        setActualSelectionAnswers(nextActualSelections);
        setSelectedDropdowns(nextSelectedDropdowns);
        setActiveExclusiveGroup(nextActiveExclusiveGroup);
        lastAuditInitializationSignatureRef.current = auditInitializationSignature;
    }, [auditInitializationSignature, criteria, getActualCheckedItemIds, getActualCheckedOptionIds, getActualCheckedSubitemsList, getActualCustomInputsList, getActualCustomEntryAnswerId, getActualItemAnswerId, getActualOptionAnswerId, getActualSelectedSelectionId, getActualSelectionAnswerId, getActualSubitemAnswerId, getCustomEntryAuditKey, selectedProject]);

    const buildSupplementalInfo = useCallback((item) => {
        const sections = [];

        if (item.esg) {
            sections.push(`## ESG Sarawak\n\n${item.esg}`);
        }

        if (item.suggestions) {
            sections.push(`## Materials & Suggestions\n\n${item.suggestions}`);
        }

        return sections.join('\n\n');
    }, []);

    const toggleActualAnswer = useCallback((category, key) => {
        setActualAnswers(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: !prev[category]?.[key],
            }
        }));

        // Sync metadata for custom entries to preserve customValue
        if (category === 'customEntries') {
            setBaselineAnswerMeta(prev => {
                // Only add metadata if it doesn't already exist
                if (prev.customEntries[key]) {
                    return prev;
                }

                // Extract customValue and itemId from the key
                // Key format: "${itemId}:value:${normalizedCustomValue}" or "${itemId}:index:${fallbackIndex}"
                const parts = key.split(':');
                const itemId = parts[0];
                const keyType = parts[1]; // 'value' or 'index'

                let customValue = null;
                let customIndex = null;

                if (keyType === 'value' && parts.length > 2) {
                    // Rejoin in case customValue contained colons
                    customValue = parts.slice(2).join(':');
                } else if (keyType === 'index') {
                    customIndex = parts[2] || null;
                }

                return {
                    ...prev,
                    customEntries: {
                        ...prev.customEntries,
                        [key]: {
                            itemId,
                            customValue,
                            customIndex,
                            userAnswerId: null,
                        }
                    }
                };
            });
        }
    }, []);

    const handleCustomInputChange = useCallback((itemId, text) => {
        setCustomInputs(prev => ({
            ...prev,
            [itemId]: text
        }));
    }, []);

    const addCustomItem = useCallback((itemId, text) => {
        if (!text || !text.trim()) return;

        const customItemId = `custom_${itemId}_${Date.now()}`;
        const newCustomItem = {
            id: customItemId,
            description: text.trim(),
            isCustom: true
        };

        // Add custom item to the list
        setCustomItems(prevCustomItems => ({
            ...prevCustomItems,
            [itemId]: [...(prevCustomItems[itemId] || []), newCustomItem]
        }));

        // Add to actual answers only (not baseline)
        // baseline = false (new), actual = true → "add" action recorded
        // After submit, commitCurrentAuditStateAsBaseline will copy it to baseline
        const customAuditKey = `${itemId}:value:${text.trim()}`;

        setActualAnswers(prev => ({
            ...prev,
            customEntries: {
                ...prev.customEntries,
                [customAuditKey]: true
            }
        }));

        // Set metadata for the custom entry
        setBaselineAnswerMeta(prev => ({
            ...prev,
            customEntries: {
                ...prev.customEntries,
                [customAuditKey]: {
                    itemId,
                    customValue: text.trim(),
                    customIndex: null,
                    customItemId: customItemId,
                    userAnswerId: null,
                }
            }
        }));

        // Clear input field
        setCustomInputs(prev => ({
            ...prev,
            [itemId]: ''
        }));
    }, []);

    const deleteCustomItem = useCallback((itemId, customItemId) => {
        // Find the custom value from metadata to construct the correct audit key
        const customValue = Object.values(baselineAnswerMeta.customEntries || {})
            .find(entry => entry?.customItemId === customItemId)?.customValue;

        // Remove custom item from the list
        setCustomItems(prevCustomItems => ({
            ...prevCustomItems,
            [itemId]: prevCustomItems[itemId]?.filter(item => item.id !== customItemId) || []
        }));

        if (customValue) {
            const customAuditKey = `${itemId}:value:${customValue}`;

            // Mark as deleted by removing from actual (baseline keeps it)
            // Baseline = true, Actual = false → "delete" action recorded
            setActualAnswers(prev => {
                const updatedAnswers = { ...prev };
                delete updatedAnswers.customEntries?.[customAuditKey];
                return updatedAnswers;
            });

            // Also remove from metadata
            setBaselineAnswerMeta(prev => ({
                ...prev,
                customEntries: {
                    ...Object.entries(prev.customEntries || {})
                        .filter(([key]) => key !== customAuditKey)
                        .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {})
                }
            }));
        }
    }, [baselineAnswerMeta]);

    const normalizeSelectionValue = useCallback((groupId, value) => {
        if (value === null || value === undefined || value === '') return null;

        const matchedSelection = (criteria || [])
            .flatMap((criterion) => [
                ...(criterion.items || []),
                ...(criterion.subcriteria?.flatMap((subcriterion) => subcriterion.items || []) || []),
            ])
            .flatMap((item) => item.selection_groups || [])
            .find((group) => String(group?.id) === String(groupId))
            ?.selections?.find((selection) => String(selection?.id) === String(value));

        const description = typeof matchedSelection?.description === 'string'
            ? matchedSelection.description.trim().toLowerCase()
            : '';

        if (description === 'none / not applicable') {
            return null;
        }

        return value;
    }, [criteria]);

    const auditChanges = useMemo(() => {
        const changes = [];
        const checkboxCategories = ['items', 'options', 'subitems', 'customEntries'];

        checkboxCategories.forEach((category) => {
            const baselineCategory = baselineAnswers[category] || {};
            const actualCategory = actualAnswers[category] || {};
            const metaCategory = baselineAnswerMeta[category] || {};
            const keys = new Set([...Object.keys(baselineCategory), ...Object.keys(actualCategory)]);

            keys.forEach((key) => {
                const before = !!baselineCategory[key];
                const after = !!actualCategory[key];
                const meta = metaCategory[key] || {};

                if (before === after) return;

                if (category === 'items') {
                    changes.push({
                        action: after ? 'add' : 'delete',
                        answerType: 'item',
                        userAnswerId: meta.userAnswerId ?? null,
                        itemId: meta.itemId ?? key,
                    });
                    return;
                }

                if (category === 'options') {
                    changes.push({
                        action: after ? 'add' : 'delete',
                        answerType: 'option',
                        userAnswerId: meta.userAnswerId ?? null,
                        optionGroupId: meta.optionGroupId ?? key.split(':')[0],
                        optionId: meta.optionId ?? key.split(':')[1],
                    });
                    return;
                }

                if (category === 'subitems') {
                    changes.push({
                        action: after ? 'add' : 'delete',
                        answerType: 'subitem',
                        userAnswerId: meta.userAnswerId ?? null,
                        itemId: meta.itemId ?? key.split(':')[0],
                        subitemId: meta.subitemId ?? key.split(':')[1],
                    });
                    return;
                }

                changes.push({
                    action: after ? 'add' : 'delete',
                    answerType: 'custom',
                    userAnswerId: meta.userAnswerId ?? getActualCustomEntryAnswerId(
                        meta.itemId ?? key.split(':')[0],
                        meta.customValue,
                        meta.customIndex ?? Number(key.split(':')[1])
                    ) ?? null,
                    itemId: meta.itemId ?? key.split(':')[0],
                    customValue: meta.customValue ?? null,
                });
            });
        });

        const selectionKeys = new Set([
            ...Object.keys(baselineSelectionAnswers),
            ...Object.keys(actualSelectionAnswers),
        ]);

        selectionKeys.forEach((groupId) => {
            const before = normalizeSelectionValue(groupId, baselineSelectionAnswers[groupId] ?? null);
            const after = normalizeSelectionValue(groupId, actualSelectionAnswers[groupId] ?? null);
            const meta = baselineAnswerMeta.selections[groupId] || {};

            if (String(before ?? '') === String(after ?? '')) return;

            if (before !== null && after !== null) {
                changes.push({
                    action: 'edit',
                    answerType: 'selection',
                    userAnswerId: meta.userAnswerId ?? null,
                    selectionGroupId: meta.selectionGroupId ?? groupId,
                    baselineValue: before,
                    actualValue: after,
                    previousSelectionId: before,
                    newSelectionId: after,
                });
                return;
            }

            if (before === null && after !== null) {
                changes.push({
                    action: 'add',
                    answerType: 'selection',
                    userAnswerId: null,
                    selectionGroupId: meta.selectionGroupId ?? groupId,
                    baselineValue: before,
                    actualValue: after,
                    selectionId: after,
                });
                return;
            }

            if (before !== null && after === null) {
                changes.push({
                    action: 'delete',
                    answerType: 'selection',
                    userAnswerId: meta.userAnswerId ?? null,
                    selectionGroupId: meta.selectionGroupId ?? groupId,
                    baselineValue: before,
                    actualValue: after,
                    selectionId: before,
                });
            }
        });

        return changes;
    }, [actualAnswers, actualSelectionAnswers, baselineAnswerMeta, baselineAnswers, baselineSelectionAnswers, getActualCustomEntryAnswerId, normalizeSelectionValue]);

    const hasAuditChanges = auditChanges.length > 0;

    useEffect(() => {
        onAuditUnsavedChange(hasAuditChanges);
    }, [hasAuditChanges, onAuditUnsavedChange]);

    useEffect(() => {
        return () => {
            onAuditUnsavedChange(false);
        };
    }, [onAuditUnsavedChange]);

    const commitCurrentAuditStateAsBaseline = useCallback(() => {
        setBaselineAnswers(JSON.parse(JSON.stringify(actualAnswers)));
        setBaselineSelectionAnswers(JSON.parse(JSON.stringify(actualSelectionAnswers)));
        onAuditUnsavedChange(false);
    }, [actualAnswers, actualSelectionAnswers, onAuditUnsavedChange]);

    const buildCommittedActualCustomInputs = useCallback(() => {
        const nextActualCustomInputs = {};

        criteria.forEach((criterion) => {
            const allItems = [
                ...(criterion.items || []),
                ...(criterion.subcriteria?.flatMap(subcriterion => subcriterion.items || []) || []),
            ];

            allItems.forEach((item) => {
                const subitems = Array.isArray(item.subitems) ? item.subitems : [];
                const hasSubitems = item.subitems_exist && subitems.length > 0;

                if (!hasSubitems) return;

                const committedValues = [];
                const seenValues = new Set();
                const appendValue = (value) => {
                    const normalizedValue = value === null || value === undefined ? '' : String(value).trim();
                    if (!normalizedValue || seenValues.has(normalizedValue)) return;
                    seenValues.add(normalizedValue);
                    committedValues.push(normalizedValue);
                };

                getCustomInputsList(item.id).forEach((customValue, index) => {
                    const customAuditKey = getCustomEntryAuditKey(item.id, customValue, index);
                    if (actualAnswers.customEntries?.[customAuditKey]) {
                        appendValue(customValue);
                    }
                });

                getActualCustomInputsList(item.id).forEach((customValue, index) => {
                    const customAuditKey = getCustomEntryAuditKey(item.id, customValue, index);
                    if (actualAnswers.customEntries?.[customAuditKey]) {
                        appendValue(customValue);
                    }
                });

                (customItems[item.id] || []).forEach((customItem) => {
                    appendValue(customItem?.description);
                });

                if (committedValues.length > 0) {
                    nextActualCustomInputs[item.id] = committedValues;
                }
            });
        });

        return nextActualCustomInputs;
    }, [actualAnswers.customEntries, criteria, customItems, getActualCustomInputsList, getCustomEntryAuditKey, getCustomInputsList]);

    const handleSubmitAuditChanges = useCallback(async () => {
        if (auditChanges.length === 0) return true;
        console.log('Submitting audit changes:', auditChanges);

        const response = await api.post(`/projects/${selectedProject.id}/save-actual-changes`, {
            actualChanges: auditChanges
        });

        if (response.data.success) {

        } else {
            return false;
        }

        const nextActualCustomInputs = buildCommittedActualCustomInputs();

        setCustomItems({});
        setSelectedProject?.((prevProject) => {
            if (!prevProject) return prevProject;

            const nextProject = JSON.parse(JSON.stringify(prevProject));
            nextProject.actual_custom_inputs = nextActualCustomInputs;

            if (
                nextProject.actual_checked_items
                && typeof nextProject.actual_checked_items === 'object'
                && !Array.isArray(nextProject.actual_checked_items)
            ) {
                nextProject.actual_checked_items.customItems = nextActualCustomInputs;
            }

            return nextProject;
        });

        commitCurrentAuditStateAsBaseline();
        return true;
    }, [auditChanges, selectedProject, activeActualCostBreakdown, actualCertificationLevel, buildCommittedActualCustomInputs, commitCurrentAuditStateAsBaseline, setSelectedProject]);

    // Register submit handler with parent component
    useEffect(() => {
        if (onAuditSubmitRef) {
            onAuditSubmitRef.current = handleSubmitAuditChanges;
        }
    }, [handleSubmitAuditChanges, onAuditSubmitRef]);

    const getAllCriterionItems = useCallback((criterionData) => {
        if (!criterionData) return [];

        const allItems = [];

        if (criterionData.items && Array.isArray(criterionData.items)) {
            allItems.push(...criterionData.items);
        }

        if (criterionData.subcriteria && Array.isArray(criterionData.subcriteria)) {
            criterionData.subcriteria.forEach(subcriterion => {
                if (subcriterion.items && Array.isArray(subcriterion.items)) {
                    allItems.push(...subcriterion.items);
                }
            });
        }

        return allItems;
    }, []);

    const calculateCriterionMarks = useCallback((criterionData, sources) => {
        if (!criterionData) return 0;

        let totalMarks = 0;
        const allItems = getAllCriterionItems(criterionData);
        const {
            getItemIds,
            getOptionIds,
            getSelectionId,
            getSubitemsList,
            getCustomInputs,
        } = sources;

        // Calculate marks for each item
        allItems.forEach(item => {
            const optionGroups = Array.isArray(item.option_groups) ? item.option_groups : [];
            const selectionGroups = Array.isArray(item.selection_groups) ? item.selection_groups : [];
            const subitems = Array.isArray(item.subitems) ? item.subitems : [];
            const hasSubitems = item.subitems_exist && subitems.length > 0;
            const hasSelections = selectionGroups.some(group => Array.isArray(group?.selections) && group.selections.length > 0);
            const hasOptions = optionGroups.some(group => Array.isArray(group?.options) && group.options.length > 0);

            if (hasSubitems) {
                const checkedSubitemsList = getSubitemsList(item.id);
                const customInputsList = getCustomInputs(item.id);

                // Count total: subitems (1 mark each) + custom inputs (1 mark each)
                const totalCount = checkedSubitemsList.length + customInputsList.length;

                // Limit to item.marks
                const maxMarks = item.marks || 6;
                const itemMarks = Math.min(totalCount, maxMarks);

                totalMarks += itemMarks;
            } else if (hasSelections && !hasOptions) {
                totalMarks += selectionGroups.reduce((sum, group) => {
                    const selectedSelectionId = getSelectionId(group.id);
                    const selectedSelection = (group.selections || []).find(selection => selection.id === selectedSelectionId);
                    return sum + (selectedSelection?.marks || 0);
                }, 0);
            } else if (hasOptions && !hasSelections) {
                const optionMarks = optionGroups.reduce((sum, group) => {
                    const selectedOptionIds = getOptionIds(group.id);
                    return sum + (group.options || []).reduce((groupSum, option) => {
                        return groupSum + (selectedOptionIds.includes(option.id) ? (option.marks || 0) : 0);
                    }, 0);
                }, 0);

                totalMarks += optionMarks;
            } else if (hasSelections && hasOptions) {
                // If item has both selections and options, calculate both
                const selectionMarks = selectionGroups.reduce((sum, group) => {
                    const selectedSelectionId = getSelectionId(group.id);
                    const selectedSelection = (group.selections || []).find(selection => selection.id === selectedSelectionId);
                    return sum + (selectedSelection?.marks || 0);
                }, 0);

                const optionMarks = optionGroups.reduce((sum, group) => {
                    const selectedOptionIds = getOptionIds(group.id);
                    return sum + (group.options || []).reduce((groupSum, option) => {
                        return groupSum + (selectedOptionIds.includes(option.id) ? (option.marks || 0) : 0);
                    }, 0);
                }, 0);

                totalMarks += selectionMarks + optionMarks;
            } else {
                if (getItemIds().includes(item.id)) {
                    totalMarks += item.marks || 0;
                }
            }
        });

        return totalMarks;
    }, [getAllCriterionItems]);

    const calculateCumulativeMarks = useCallback((criterionData) => {
        if (!selectedProject || !criterionData) return 0;

        return calculateCriterionMarks(criterionData, {
            getItemIds: getCheckedItemIds,
            getOptionIds: getCheckedOptionIds,
            getSelectionId: getSelectedSelectionId,
            getSubitemsList: getCheckedSubitemsList,
            getCustomInputs: getCustomInputsList,
        });
    }, [calculateCriterionMarks, getCheckedItemIds, getCheckedOptionIds, getCheckedSubitemsList, getCustomInputsList, getSelectedSelectionId, selectedProject]);

    const calculateActualCumulativeMarks = useCallback((criterionData) => {
        if (!criterionData) return 0;

        return calculateCriterionMarks(criterionData, {
            getItemIds: () => Object.keys(actualAnswers.items || {}).filter(key => actualAnswers.items[key]).map(Number),
            getOptionIds: (groupId) => {
                return Object.keys(actualAnswers.options || {})
                    .filter(key => key.startsWith(`${groupId}:`) && actualAnswers.options[key])
                    .map(key => Number(key.split(':')[1]));
            },
            getSelectionId: (groupId) => actualSelectionAnswers[groupId] ?? null,
            getSubitemsList: (itemId) => {
                return Object.keys(actualAnswers.subitems || {})
                    .filter(key => key.startsWith(`${itemId}:`) && actualAnswers.subitems[key])
                    .map(key => Number(key.split(':')[1]));
            },
            getCustomInputs: (itemId) => {
                // Count checked baseline custom inputs
                const baselineInputs = getCustomInputsList(itemId);
                const filteredBaselineInputs = baselineInputs.filter((customValue, index) => (
                    actualAnswers.customEntries?.[getCustomEntryAuditKey(itemId, customValue, index)]
                ));

                // Count checked actual custom inputs
                const actualInputs = getActualCustomInputsList(itemId);
                const filteredActualInputs = actualInputs.filter((customValue, index) => (
                    actualAnswers.customEntries?.[getCustomEntryAuditKey(itemId, customValue, index)]
                ));

                // Include newly added custom items from customItems state
                const newCustomItems = customItems[itemId]?.map(item => item.description) || [];

                return [...filteredBaselineInputs, ...filteredActualInputs, ...newCustomItems];
            },
        });
    }, [actualAnswers, actualSelectionAnswers, calculateCriterionMarks, customItems, getCustomInputsList, getActualCustomInputsList, getCustomEntryAuditKey]);

    const overallScoreSummary = useMemo(() => {
        const predicted = criteria.reduce((sum, criterion) => sum + (calculateCumulativeMarks(criterion) || 0), 0);
        const actual = criteria.reduce((sum, criterion) => sum + (calculateActualCumulativeMarks(criterion) || 0), 0);
        const total = criteria.reduce((sum, criterion) => sum + (criterion?.total_marks || 0), 0);
        const predictedPct = total > 0 ? Math.min(Math.round((predicted / total) * 100), 100) : 0;
        const actualPct = total > 0 ? Math.min(Math.round((actual / total) * 100), 100) : 0;

        return {
            predicted,
            actual,
            total,
            predictedPct,
            actualPct,
        };
    }, [calculateActualCumulativeMarks, calculateCumulativeMarks, criteria]);

    // Update parent component with marks data
    useEffect(() => {
        if (setMarksData && overallScoreSummary) {
            setMarksData({
                predicted: overallScoreSummary.predicted,
                actual: overallScoreSummary.actual,
                total: overallScoreSummary.total,
                predictedPct: overallScoreSummary.predictedPct,
                actualPct: overallScoreSummary.actualPct,
            });
        }
    }, [overallScoreSummary, setMarksData]);

    const calculateActualBaseTotal = useCallback((costBreakdown) => {
        if (!costBreakdown || typeof costBreakdown !== 'object') return 0;

        const getNodeActualTotal = (node) => {
            if (!node) return 0;

            const description = typeof node.description === 'string'
                ? node.description.trim().toLowerCase()
                : '';

            const isCertificationNode = node.isMultiplier || node.is_certification || description === 'certification';
            if (isCertificationNode) return 0;

            if (node.actual_cost !== undefined) {
                return Number(node.actual_cost) || 0;
            }

            if (node.children && typeof node.children === 'object') {
                return Object.values(node.children).reduce((childSum, childNode) => {
                    return childSum + getNodeActualTotal(childNode);
                }, 0);
            }

            return 0;
        };

        return Object.values(costBreakdown).reduce((sum, node) => {
            return sum + getNodeActualTotal(node);
        }, 0);
    }, []);

    // Apply certification multiplier to actual costs when actual marks change
    // Pass the multiplier info to parent, don't update selectedProject here
    useEffect(() => {
        if (otherProps?.displayOnly && !otherProps?.actualCostBreakdown) {
            return;
        }

        if (!selectedProject || !overallScoreSummary || overallScoreSummary.actual === 0) {
            return;
        }

        // Get certification level - determine based on actual marks
        const getCertLevel = (marks) => {
            for (const [level, range] of Object.entries(otherProps?.certifiedScaleRange || {})) {
                if (marks >= range[0] && marks <= range[1]) {
                    return level;
                }
            }
            return 'Not Certified';
        };

        const actualCertLevel = getCertLevel(overallScoreSummary.actual);
        const multiplierPercent = otherProps?.certificationMultipliers?.[actualCertLevel] || 0;

        // Parent nodes already carry the rolled-up actual total of their children,
        // so summing top-level nodes avoids double counting nested trees.
        const baseTotal = calculateActualBaseTotal(activeActualCostBreakdown);

        const multiplierCost = multiplierPercent > 0 ? (baseTotal * multiplierPercent) / 100 : 0;

        const nextMultiplierPayload = {
            certLevel: actualCertLevel,
            multiplierPercent,
            multiplierCost,
            baseTotal,
        };

        const previousPayload = lastAppliedMultiplierRef.current;
        const hasMultiplierChanged = !previousPayload
            || previousPayload.certLevel !== nextMultiplierPayload.certLevel
            || Math.abs((previousPayload.multiplierPercent || 0) - nextMultiplierPayload.multiplierPercent) > 0.0001
            || Math.abs((previousPayload.multiplierCost || 0) - nextMultiplierPayload.multiplierCost) > 0.01
            || Math.abs((previousPayload.baseTotal || 0) - nextMultiplierPayload.baseTotal) > 0.01;

        // Pass multiplier info to parent only when the computed payload changes.
        if (hasMultiplierChanged && otherProps?.onApplyMultiplier) {
            lastAppliedMultiplierRef.current = nextMultiplierPayload;
            otherProps.onApplyMultiplier(nextMultiplierPayload, {
                suppressToast: !previousPayload,
            });
        }
    }, [
        actualCertificationLevel,
        activeActualCostBreakdown,
        calculateActualBaseTotal,
        otherProps?.actualCostBreakdown,
        overallScoreSummary.actual,
        otherProps?.displayOnly,
        otherProps?.certificationMultipliers,
        otherProps?.certifiedScaleRange,
        otherProps?.onApplyMultiplier,
    ]);

    const getCertificationLevel = useCallback((marks) => {
        for (const [level, range] of Object.entries(certifiedScaleRange)) {
            if (marks >= range[0] && marks <= range[1]) {
                return level;
            }
        }

        return 'Not Certified';
    }, [certifiedScaleRange]);

    const getCertificationPalette = useCallback((level) => {
        const palette = {
            Platinum: {
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                labelColor: '#E2E8F0',
                valueColor: '#FFFFFF',
                badgeBackgroundColor: '#E2E8F0',
                badgeTextColor: '#0F172A',
            },
            Gold: {
                backgroundColor: '#D97706',
                borderColor: '#F59E0B',
                labelColor: '#FEF3C7',
                valueColor: '#FFFFFF',
                badgeBackgroundColor: '#FEF3C7',
                badgeTextColor: '#92400E',
            },
            Silver: {
                backgroundColor: '#94A3B8',
                borderColor: '#CBD5E1',
                labelColor: '#F8FAFC',
                valueColor: '#FFFFFF',
                badgeBackgroundColor: '#F8FAFC',
                badgeTextColor: '#475569',
            },
            Certified: {
                backgroundColor: '#059669',
                borderColor: '#34D399',
                labelColor: '#D1FAE5',
                valueColor: '#FFFFFF',
                badgeBackgroundColor: '#D1FAE5',
                badgeTextColor: '#065F46',
            },
            'Not Certified': {
                backgroundColor: '#DC2626',
                borderColor: '#F87171',
                labelColor: '#FEE2E2',
                valueColor: '#FFFFFF',
                badgeBackgroundColor: '#FEE2E2',
                badgeTextColor: '#991B1B',
            },
        };

        return palette[level] || palette['Not Certified'];
    }, []);

    const predictedCertificationLevel = useMemo(() => getCertificationLevel(overallScoreSummary.predicted), [getCertificationLevel, overallScoreSummary.predicted]);
    const actualCertificationLevel = useMemo(() => getCertificationLevel(overallScoreSummary.actual), [getCertificationLevel, overallScoreSummary.actual]);
    const predictedCertificationPalette = useMemo(() => getCertificationPalette(predictedCertificationLevel), [getCertificationPalette, predictedCertificationLevel]);
    const actualCertificationPalette = useMemo(() => getCertificationPalette(actualCertificationLevel), [getCertificationPalette, actualCertificationLevel]);

    // Custom render function for dropdown items with marks
    const renderSelectionItem = useCallback((item) => {
        return (
            <View className="flex-row items-center justify-between px-3 py-2.5">
                <Text className="flex-1 text-gray-700 font-medium text-sm">{item.description}</Text>
                <View className="bg-blue-100 px-2.5 py-1 rounded-lg ml-2">
                    <Text className="text-blue-700 font-bold text-xs">{item.marks} pts</Text>
                </View>
            </View>
        );
    }, []);

    // Custom render function for selected label
    const renderSelectedLabel = useCallback((selectedItem) => {
        if (!selectedItem) {
            return <Text>Select an option...</Text>;
        }
        return (
            <View className="flex-row items-center justify-between flex-1">
                <Text className="text-gray-900 font-semibold text-sm flex-1">{selectedItem.description}</Text>
                <View className="bg-emerald-100 px-2.5 py-1 rounded-lg ml-2">
                    <Text className="text-emerald-700 font-bold text-xs">{selectedItem.marks} pts</Text>
                </View>
            </View>
        );
    }, []);

    const renderCheckboxComparisonRow = useCallback((predictedChecked, actualChecked, onToggle) => (
        <View className="flex-row gap-2 mt-3">
            <View className="flex-1 flex-row items-center justify-between rounded-xl bg-white border border-slate-200 px-3 py-2.5">
                <View className="flex-row items-center">
                    {predictedChecked ? (
                        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                    ) : (
                        <Ionicons name="close-circle" size={18} color="#DC2626" />
                    )}
                    <Text className="text-[11px] font-semibold text-slate-500 ml-2">PREDICTED</Text>
                </View>
                <Text className={`text-xs font-semibold ${predictedChecked ? 'text-emerald-600' : 'text-red-600'}`}>
                    {predictedChecked ? 'Checked' : 'Unchecked'}
                </Text>
            </View>

            <TouchableOpacity
                onPress={onToggle}
                activeOpacity={0.75}
                className={`flex-1 flex-row items-center justify-between rounded-xl px-3 py-2.5 border ${actualChecked ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}
            >
                <View className="flex-row items-center">
                    <MaterialCommunityIcons
                        name={actualChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={18}
                        color={actualChecked ? '#10B981' : '#94A3B8'}
                    />
                    <Text className="text-[11px] font-semibold text-slate-500 ml-2">ACTUAL</Text>
                </View>
                <Text className={`text-xs font-semibold ${actualChecked ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {actualChecked ? 'Checked' : 'Unchecked'}
                </Text>
            </TouchableOpacity>
        </View>
    ), []);

    const renderActualMarksIndicator = useCallback((points, active = false, showIndicator = true) => (
        <View className="flex-row items-center gap-1">
            {showIndicator ? (
                <Text className={`text-[10px] font-semibold uppercase ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    Actual
                </Text>
            ) : null}
            <PointsBadge points={points} active={active} />
        </View>
    ), []);

    const renderItem = useCallback((item) => {
        const optionGroups = Array.isArray(item.option_groups) ? item.option_groups : [];
        const selectionGroups = Array.isArray(item.selection_groups) ? item.selection_groups : [];
        const subitems = Array.isArray(item.subitems) ? item.subitems : [];
        const itemOptions = optionGroups.flatMap(g => Array.isArray(g?.options) ? g.options : []);
        const hasOptions = itemOptions.length > 0;
        const hasSubitems = item.subitems_exist && subitems.length > 0;
        const itemSelections = selectionGroups.flatMap(g => Array.isArray(g?.selections) ? g.selections : []);
        const hasSelections = itemSelections.length > 0;
        const itemSelectionTotal =
            selectionGroups.reduce((sum, group) => {
                const selectedSelectionId = getSelectedSelectionId(group.id);
                const selectedSelection = (group.selections || []).find(selection => selection.id === selectedSelectionId);
                return sum + (selectedSelection?.marks || 0);
            }, 0) +
            optionGroups.reduce((sum, group) => {
                const selectedOptionIds = getCheckedOptionIds(group.id);
                return sum + (group.options || []).reduce((groupSum, option) => {
                    return groupSum + (selectedOptionIds.includes(option.id) ? (option.marks || 0) : 0);
                }, 0);
            }, 0);

        const showPointsBadge = !!item.marks && !hasOptions && !hasSubitems && !hasSelections;
        const showSelectionBadge = hasSelections || hasOptions;
        const actualItemMarks = calculateActualCumulativeMarks(item) || 0;

        // Display-only mode logic - get data from selectedProject
        let isItemChecked = false;
        let checkedSubitemsList = [];
        let customInputsList = [];
        let actualInputsList = [];

        if (selectedProject) {
            if (hasSubitems) {
                checkedSubitemsList = getCheckedSubitemsList(item.id);
                customInputsList = getCustomInputsList(item.id);
                actualInputsList = getActualCustomInputsList(item.id);
            } else {
                isItemChecked = getCheckedItemIds().includes(item.id);
            }
        }

        const actualItemChecked = !!actualAnswers.items[item.id];

        return (
            <View key={item.id} className="mb-2">
                {/* Main Item Card */}
                <View
                    className={`bg-white rounded-xl overflow-hidden ${!hasOptions && !hasSubitems && !hasSelections
                        ? 'border-l-2 border-l-emerald-400 border border-gray-100'
                        : 'border border-gray-100'
                        }`}
                    style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 1 }}
                >
                    <View className="px-4 py-3.5">
                        <View className="flex-row items-center">
                            <View className="flex-1 mr-3">
                                <Text
                                    className={`text-[13.5px] leading-[20px] ${hasSubitems ? 'text-gray-800' : isItemChecked ? 'text-gray-500' : 'text-gray-700'
                                        }`}
                                    style={{
                                        fontWeight: hasSubitems ? '600' : (isItemChecked ? '400' : '450')
                                    }}
                                >
                                    {item.description}
                                </Text>
                            </View>

                            <View className="flex-row items-center gap-2">
                                {showPointsBadge ? (
                                    renderActualMarksIndicator(item.marks, actualItemChecked, false)
                                ) : null}

                                {hasOptions && optionGroups.map((group, gi) => {
                                    const actualOptionGroupMarks = (group.options || []).reduce((sum, option) => {
                                        const optionAuditKey = `${group.id}:${option.id}`;
                                        return sum + (actualAnswers.options?.[optionAuditKey] ? (option.marks || 0) : 0);
                                    }, 0);

                                    return (
                                        <View key={`actual-option-group-${group.id}-${gi}`}>
                                            {renderActualMarksIndicator(actualOptionGroupMarks, actualOptionGroupMarks !== 0)}
                                        </View>
                                    );
                                })}


                                {(item.info && !hasOptions) ? (
                                    <IconButton
                                        onPress={() => handleInfoGuideOpen(item.info, 'Information', 'Guide')}
                                        icon="information-circle-outline"
                                        color="#9CA3AF"
                                        bg="bg-gray-200"
                                        activeBg="active:bg-gray-100"
                                    />
                                ) : null}

                                {(item.suggestions || item.esg) ? (
                                    <IconButton
                                        onPress={() => handleInfoGuideOpen(buildSupplementalInfo(item), 'ESG & Suggestions', 'Details')}
                                        icon="document-text-outline"
                                        color="#F59E0B"
                                        bg="bg-amber-50"
                                        activeBg="active:bg-amber-100"
                                    />
                                ) : null}
                            </View>
                        </View>

                        {(!hasOptions && !hasSubitems && !hasSelections)
                            ? renderCheckboxComparisonRow(
                                isItemChecked,
                                actualItemChecked,
                                () => toggleActualAnswer('items', item.id)
                            )
                            : null}

                        {hasOptions && optionGroups.map((group, gi) => (
                            <View key={`${group.id}-${gi}`} className="mt-4">
                                <View className="flex-1 gap-2">
                                    {group.options.map((option, oi) => {
                                        const isChecked = getCheckedOptionIds(group.id).includes(option.id);
                                        const optionAuditKey = `${group.id}:${option.id}`;
                                        const actualOptionChecked = !!actualAnswers.options[optionAuditKey];
                                        const actualOptionMarks = actualOptionChecked ? (option.marks || 0) : 0;

                                        return (
                                            <View
                                                key={`${oi}`}
                                                className="py-2.5 px-3 rounded-lg bg-gray-50"
                                            >
                                                <View className="flex-row items-center">
                                                    <Text
                                                        className="flex-1 text-[13px] leading-5 text-gray-600"
                                                        style={{ fontWeight: isChecked ? '500' : '400' }}
                                                    >
                                                        {option?.description}
                                                    </Text>
                                                    <Text className="text-xs font-semibold text-gray-500">
                                                        {option.marks} pts
                                                    </Text>
                                                    <IconButton
                                                        onPress={() => handleInfoGuideOpen(option.sub_description)}
                                                        icon="information-circle-outline"
                                                        color="#9CA3AF"
                                                        bg="bg-gray-200"
                                                        activeBg=""
                                                    />
                                                </View>
                                                {renderCheckboxComparisonRow(
                                                    isChecked,
                                                    actualOptionChecked,
                                                    () => toggleActualAnswer('options', optionAuditKey)
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}

                        {(() => {
                            const exclusiveGroups = selectionGroups.filter(g => g.exclusive);
                            const normalGroups = selectionGroups.filter(g => !g.exclusive);

                            return (
                                <>
                                    {normalGroups.map((group, gi) => {
                                        const predictedSelection = group.selections.find(sel => sel.id === getSelectedSelectionId(group.id));
                                        const actualSelectionId = actualSelectionAnswers[group.id] ?? null;
                                        const actualSelection = group.selections.find(sel => sel.id === actualSelectionId);

                                        let isActive = false;

                                        return (
                                            <View key={`${group.id}-${gi}`} className="mt-4">
                                                <GroupLabel label={group.label} accentColor="#A5B4FC" />
                                                <View style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    marginBottom: 8,
                                                }}>
                                                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>
                                                        PREDICTED :
                                                    </Text>
                                                    <View style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        backgroundColor: '#EEF2FF',
                                                        borderRadius: 6,
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 5,
                                                        flex: 1,
                                                    }}>
                                                        <Ionicons name="bookmark-outline" size={12} color="#818CF8" />
                                                        <Text style={{
                                                            fontSize: 12,
                                                            color: '#4F46E5',
                                                            fontWeight: '500',
                                                            flex: 1,
                                                        }} numberOfLines={1}>
                                                            {predictedSelection?.description || 'None / Not Applicable'}
                                                        </Text>
                                                        <Text style={{
                                                            fontSize: 11,
                                                            color: '#818CF8',
                                                            fontWeight: '600',
                                                        }}>
                                                            {predictedSelection?.marks || 0} pts
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View className="flex-row items-center justify-between mb-2">
                                                    {/* Left side: Actual answer label */}
                                                    <Text className="text-xs font-semibold text-[#9CA3AF]">
                                                        ACTUAL :
                                                    </Text>

                                                    {/* Right side: Render indicator */}
                                                    <View>
                                                        {renderActualMarksIndicator(
                                                            actualSelection?.marks || 0,
                                                            !!actualSelectionId && (actualSelection?.marks || 0) !== 0,
                                                            false
                                                        )}
                                                    </View>
                                                </View>

                                                <Dropdown
                                                    style={{
                                                        height: 44,
                                                        backgroundColor: '#F9FAFB',
                                                        borderRadius: 8,
                                                        paddingHorizontal: 12,
                                                        borderWidth: 1,
                                                        borderColor: '#E5E7EB',
                                                    }}
                                                    containerStyle={{
                                                        borderRadius: 8,
                                                        borderWidth: 1,
                                                        borderColor: '#E5E7EB',
                                                        backgroundColor: '#FFFFFF',
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 4 },
                                                        shadowOpacity: 0.06,
                                                        shadowRadius: 8,
                                                        elevation: 3,
                                                        marginTop: 2,
                                                    }}
                                                    itemContainerStyle={{ backgroundColor: '#FFFFFF' }}
                                                    itemTextStyle={{ color: '#374151', fontSize: 13, fontWeight: '400' }}
                                                    activeColor="#F3F4F6"
                                                    selectedTextStyle={{ fontSize: 13, color: '#111827', fontWeight: '500' }}
                                                    placeholderStyle={{ color: '#9CA3AF', fontSize: 13 }}
                                                    renderRightIcon={() => (
                                                        <Ionicons
                                                            name={isActive ? 'chevron-up' : 'chevron-down'}
                                                            size={14}
                                                            color="#9CA3AF"
                                                        />
                                                    )}
                                                    data={group.selections}
                                                    value={actualSelectionId}
                                                    onFocus={() => {
                                                        isActive = true;
                                                    }}
                                                    onBlur={() => {
                                                        isActive = false;
                                                    }}
                                                    onChange={(selected) => {
                                                        setSelectedDropdowns(prev => ({ ...prev, [group.id]: selected?.id ?? null }));
                                                        setActualSelectionAnswers(prev => ({ ...prev, [group.id]: selected?.id ?? null }));
                                                    }}
                                                    labelField="description"
                                                    valueField="id"
                                                    placeholder="Select an option..."
                                                    renderItem={(item) => renderSelectionItem(item)}
                                                    renderSelectedLabel={(item) => renderSelectedLabel(item)}
                                                    search={false}
                                                    maxHeight={240}
                                                />
                                            </View>
                                        );
                                    })}

                                    {/* ── Exclusive groups: only one can be active ── */}
                                    {exclusiveGroups.length > 0 && (
                                        <View className="mt-4">
                                            {/* Section divider */}
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 6,
                                                marginBottom: 8,
                                            }}>
                                                <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                                                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>
                                                    SELECT ONE GROUP ONLY
                                                </Text>
                                                <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                                            </View>

                                            {exclusiveGroups.map((group, gi) => {
                                                const actualSelectionId = actualSelectionAnswers[group.id] ?? null;
                                                const actualSelection = group.selections.find(sel => sel.id === actualSelectionId);
                                                const isActive = activeExclusiveGroup === group.id || actualSelectionId !== null;

                                                return (
                                                    <View
                                                        key={`${group.id}-${gi}`}
                                                        style={{
                                                            marginBottom: 10,
                                                            borderRadius: 10,
                                                            borderWidth: 1.5,
                                                            borderColor: isActive ? '#A5B4FC' : '#E5E7EB',
                                                            backgroundColor: isActive ? '#F5F3FF' : '#F9FAFB',
                                                            padding: 10,
                                                            opacity: (!isActive && activeExclusiveGroup !== null) ? 0.45 : 1,
                                                        }}
                                                    >
                                                        {/* Radio row + label */}
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                if (isActive) {
                                                                    setActiveExclusiveGroup(null);
                                                                    setSelectedDropdowns(prev => ({ ...prev, [group.id]: null }));
                                                                    setActualSelectionAnswers(prev => ({ ...prev, [group.id]: null }));
                                                                    return;
                                                                }

                                                                setActiveExclusiveGroup(group.id);
                                                                setSelectedDropdowns(prev => {
                                                                    const updated = { ...prev };
                                                                    selectionGroups.forEach(g => {
                                                                        if (g.exclusive && g.id !== group.id) {
                                                                            updated[g.id] = null;
                                                                        }
                                                                    });
                                                                    return updated;
                                                                });
                                                                setActualSelectionAnswers(prev => {
                                                                    const updated = { ...prev };
                                                                    selectionGroups.forEach(g => {
                                                                        if (g.exclusive && g.id !== group.id) {
                                                                            updated[g.id] = null;
                                                                        }
                                                                    });
                                                                    return updated;
                                                                });
                                                            }}
                                                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                                                            activeOpacity={0.7}
                                                        >
                                                            {/* Radio indicator */}
                                                            <View style={{
                                                                width: 18,
                                                                height: 18,
                                                                borderRadius: 9,
                                                                borderWidth: 2,
                                                                borderColor: isActive ? '#818CF8' : '#D1D5DB',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                marginRight: 8,
                                                            }}>
                                                                {isActive && (
                                                                    <View style={{
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius: 4,
                                                                        backgroundColor: '#818CF8',
                                                                    }} />
                                                                )}
                                                            </View>
                                                            <Text style={{
                                                                fontSize: 13,
                                                                fontWeight: '600',
                                                                color: isActive ? '#4F46E5' : '#6B7280',
                                                            }}>
                                                                {group.label}
                                                            </Text>
                                                        </TouchableOpacity>

                                                        {/* Predicted answer display */}
                                                        {(() => {
                                                            const predictedSelection = group.selections.find(sel => sel.id === getSelectedSelectionId(group.id));
                                                            return (
                                                                <View style={{
                                                                    flexDirection: 'row',
                                                                    alignItems: 'center',
                                                                    gap: 6,
                                                                    marginBottom: 8,
                                                                }}>
                                                                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>
                                                                        PREDICTED :
                                                                    </Text>
                                                                    <View style={{
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center',
                                                                        gap: 6,
                                                                        backgroundColor: '#EEF2FF',
                                                                        borderRadius: 6,
                                                                        paddingHorizontal: 10,
                                                                        paddingVertical: 5,
                                                                        flex: 1,
                                                                    }}>
                                                                        <Ionicons name="bookmark-outline" size={12} color="#818CF8" />
                                                                        <Text style={{
                                                                            fontSize: 12,
                                                                            color: '#4F46E5',
                                                                            fontWeight: '500',
                                                                            flex: 1,
                                                                        }} numberOfLines={1}>
                                                                            {predictedSelection?.description || 'No selected'}
                                                                        </Text>
                                                                        <Text style={{
                                                                            fontSize: 11,
                                                                            color: '#818CF8',
                                                                            fontWeight: '600',
                                                                        }}>
                                                                            {predictedSelection?.marks || 0} pts
                                                                        </Text>
                                                                    </View>
                                                                </View>
                                                            );
                                                        })()}

                                                        <View className="flex-row items-center justify-between mb-2">
                                                            {/* Left side: Actual answer label */}
                                                            <Text className="text-xs font-semibold text-[#9CA3AF]">
                                                                ACTUAL :
                                                            </Text>

                                                            {/* Right side: Render indicator */}
                                                            <View>
                                                                {renderActualMarksIndicator(
                                                                    actualSelection?.marks || 0,
                                                                    !!actualSelectionId && (actualSelection?.marks || 0) !== 0,
                                                                    false
                                                                )}
                                                            </View>
                                                        </View>

                                                        {/* Dropdown — disabled until this group is activated */}
                                                        <Dropdown
                                                            disable={!isActive}
                                                            style={{
                                                                height: 44,
                                                                backgroundColor: isActive ? '#FFFFFF' : '#F3F4F6',
                                                                borderRadius: 8,
                                                                paddingHorizontal: 12,
                                                                borderWidth: 1,
                                                                borderColor: isActive ? '#C7D2FE' : '#E5E7EB',
                                                            }}
                                                            containerStyle={{
                                                                borderRadius: 8,
                                                                borderWidth: 1,
                                                                borderColor: '#E5E7EB',
                                                                backgroundColor: '#FFFFFF',
                                                                shadowColor: '#000',
                                                                shadowOffset: { width: 0, height: 4 },
                                                                shadowOpacity: 0.06,
                                                                shadowRadius: 8,
                                                                elevation: 3,
                                                                marginTop: 2,
                                                            }}
                                                            itemContainerStyle={{ backgroundColor: '#FFFFFF' }}
                                                            itemTextStyle={{ color: '#374151', fontSize: 13, fontWeight: '400' }}
                                                            activeColor="#F3F4F6"
                                                            selectedTextStyle={{ fontSize: 13, color: '#111827', fontWeight: '500' }}
                                                            placeholderStyle={{ color: '#9CA3AF', fontSize: 13 }}
                                                            renderRightIcon={() => (
                                                                <Ionicons
                                                                    name={actualSelectionId ? 'chevron-up' : 'chevron-down'}
                                                                    size={14}
                                                                    color={isActive ? '#9CA3AF' : '#D1D5DB'}
                                                                />
                                                            )}
                                                            data={group.selections}
                                                            value={actualSelectionId}
                                                            onChange={(selected) => {
                                                                const nextSelectionId = selected?.id ?? null;
                                                                setSelectedDropdowns(prev => ({ ...prev, [group.id]: nextSelectionId }));
                                                                setActualSelectionAnswers(prev => {
                                                                    const updated = { ...prev };
                                                                    selectionGroups.forEach(g => {
                                                                        if (g.exclusive && g.id !== group.id) {
                                                                            updated[g.id] = null;
                                                                        }
                                                                    });
                                                                    updated[group.id] = nextSelectionId;
                                                                    return updated;
                                                                });
                                                                setActiveExclusiveGroup(group.id);
                                                            }}
                                                            labelField="description"
                                                            valueField="id"
                                                            placeholder="Select an option..."
                                                            renderItem={(i) => renderSelectionItem(i)}
                                                            renderSelectedLabel={(i) => renderSelectedLabel(i)}
                                                            search={false}
                                                            maxHeight={240}
                                                        />
                                                        {/* <View className="mt-2 self-end">
                                                            {renderActualMarksIndicator(actualSelection?.marks || 0, !!actualSelectionId && (actualSelection?.marks || 0) !== 0, false)}
                                                        </View> */}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )}
                                </>
                            )
                        })()}
                    </View>
                </View>

                {/* Subitems - shown in display mode */}
                {hasSubitems ? (
                    <View className="ml-3 mt-2 space-y-2">
                        {subitems.map((subitem) => {
                            // Check if subitem.id is in checkedSubitemsList
                            const isSubitemChecked = checkedSubitemsList.includes(subitem.id);
                            const subitemAuditKey = `${item.id}:${subitem.id}`;
                            const actualSubitemChecked = !!actualAnswers.subitems[subitemAuditKey];
                            const actualSubitemMarks = actualSubitemChecked ? 1 : 0;

                            return (
                                <View
                                    key={subitem.id}
                                    className={`py-3 px-4 mb-2 rounded-xl border-2 ${isSubitemChecked
                                        ? 'bg-emerald-50 border-emerald-300'
                                        : 'bg-white border-gray-200'
                                        }`}
                                    style={{
                                        shadowColor: isSubitemChecked ? '#10B981' : '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: isSubitemChecked ? 0.1 : 0.05,
                                        shadowRadius: 2,
                                        elevation: isSubitemChecked ? 2 : 1,
                                    }}
                                >
                                    <View>
                                        <View className="flex-row items-start justify-between gap-3">
                                            <Text
                                                className="flex-1 text-sm leading-5 text-gray-700"
                                                style={{
                                                    fontWeight: isSubitemChecked ? '600' : '400',
                                                }}
                                            >
                                                {subitem.description}
                                            </Text>

                                            <View className="shrink-0 pt-0.5">
                                                {renderActualMarksIndicator(actualSubitemMarks, actualSubitemChecked)}
                                            </View>
                                        </View>

                                        {renderCheckboxComparisonRow(
                                            isSubitemChecked,
                                            actualSubitemChecked,
                                            () => toggleActualAnswer('subitems', subitemAuditKey)
                                        )}
                                    </View>
                                </View>
                            );
                        })}

                        {/* Custom Inputs - Display Only Mode */}
                        {((customInputsList && customInputsList.length > 0) || (actualInputsList && actualInputsList.length > 0) || (customItems[item.id]?.length > 0)) && (
                            <View className="mt-2">
                                <Text className="text-xs font-semibold text-gray-500 mb-2 px-2">CUSTOM ENTRIES</Text>
                                {customInputsList.map((customInput, index) => {
                                    const customAuditKey = getCustomEntryAuditKey(item.id, customInput, index);
                                    const actualCustomChecked = !!actualAnswers.customEntries[customAuditKey];
                                    const actualCustomMarks = actualCustomChecked ? 1 : 0;

                                    return (
                                        <View
                                            key={`custom-${item.id}-${index}`}
                                            className="py-3 px-4 bg-blue-50 rounded-xl border-2 border-blue-300 mb-2"
                                            style={{
                                                shadowColor: '#3B82F6',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 2,
                                                elevation: 2,
                                            }}
                                        >
                                            <View>
                                                <View className="flex-row items-start justify-between gap-3">
                                                    <Text className="flex-1 text-sm leading-5 text-gray-700 font-medium">
                                                        {customInput}
                                                    </Text>
                                                    <View className="shrink-0 pt-0.5">
                                                        {renderActualMarksIndicator(actualCustomMarks, actualCustomChecked)}
                                                    </View>
                                                </View>
                                                {renderCheckboxComparisonRow(
                                                    true,
                                                    actualCustomChecked,
                                                    () => toggleActualAnswer('customEntries', customAuditKey)
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}

                                {actualInputsList.map((actualInput, index) => {
                                    const customAuditKey = getCustomEntryAuditKey(item.id, actualInput, index);
                                    const actualCustomChecked = !!actualAnswers.customEntries[customAuditKey];
                                    const actualCustomMarks = actualCustomChecked ? 1 : 0;

                                    return (
                                        <View
                                            key={`custom-${item.id}-${index}`}
                                            className="py-3 px-4 bg-blue-50 rounded-xl border-2 border-blue-300 mb-2"
                                            style={{
                                                shadowColor: '#3B82F6',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 2,
                                                elevation: 2,
                                            }}
                                        >
                                            <View>
                                                <View className="flex-row items-start justify-between gap-3">
                                                    <Text className="flex-1 text-sm leading-5 text-gray-700 font-medium">
                                                        {actualInput}
                                                    </Text>
                                                    <View className="shrink-0 pt-0.5">
                                                        {renderActualMarksIndicator(actualCustomMarks, actualCustomChecked)}
                                                    </View>
                                                </View>
                                                {renderCheckboxComparisonRow(
                                                    false,
                                                    actualCustomChecked,
                                                    () => toggleActualAnswer('customEntries', customAuditKey)
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}

                                {/* Newly Added Custom Items */}
                                {customItems[item.id]?.map((customItem) => {
                                    return (
                                        <View
                                            key={customItem.id}
                                            className="py-3 px-4 bg-purple-50 rounded-xl border-2 border-purple-300 mb-2"
                                            style={{
                                                shadowColor: '#A855F7',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 2,
                                                elevation: 2,
                                            }}
                                        >
                                            <View className="flex-row items-start justify-between mb-2">
                                                <Text className="text-sm leading-5 text-gray-700 font-medium flex-1">
                                                    {customItem.description}
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => deleteCustomItem(item.id, customItem.id)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                    className="ml-2"
                                                >
                                                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                                                </TouchableOpacity>
                                            </View>
                                            {/* Fixed comparison row - predicted is unchecked, actual is checked */}
                                            <View className="flex-row gap-2 mt-3">
                                                <View className="flex-1 flex-row items-center justify-between rounded-xl bg-white border border-slate-200 px-3 py-2.5">
                                                    <View className="flex-row items-center">
                                                        <Ionicons name="close-circle" size={18} color="#DC2626" />
                                                        <Text className="text-[11px] font-semibold text-slate-500 ml-2">PREDICTED</Text>
                                                    </View>
                                                    <Text className="text-xs font-semibold text-red-600">
                                                        Unchecked
                                                    </Text>
                                                </View>

                                                <View className="flex-1 flex-row items-center justify-between rounded-xl bg-emerald-50 border border-emerald-300 px-3 py-2.5">
                                                    <View className="flex-row items-center">
                                                        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                                                        <Text className="text-[11px] font-semibold text-slate-500 ml-2">ACTUAL</Text>
                                                    </View>
                                                    <Text className="text-xs font-semibold text-emerald-600">
                                                        Checked
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <AddCustomItemRow
                            itemId={item.id}
                            value={customInputs[item.id]}
                            onChange={(text) => handleCustomInputChange(item.id, text)}
                            onSubmit={() => addCustomItem(item.id, customInputs[item.id])}
                        />
                    </View>
                ) : null}
            </View>
        );
    }, [actualAnswers, actualSelectionAnswers, activeExclusiveGroup, addCustomItem, buildSupplementalInfo, customItems, customInputs, deleteCustomItem, getActualCustomInputsList, getCheckedItemIds, getCheckedOptionIds, getCheckedSubitemsList, getCustomEntryAuditKey, getCustomInputsList, getSelectedSelectionId, handleCustomInputChange, renderCheckboxComparisonRow, renderSelectedLabel, selectedDropdowns, selectedProject, toggleActualAnswer]);

    const renderCriterionItems = useCallback(() => {
        if (!selectedCriterionData) return null;

        const criterionSubcriteria = Array.isArray(selectedCriterionData.subcriteria)
            ? selectedCriterionData.subcriteria
            : [];
        const criterionItems = Array.isArray(selectedCriterionData.items)
            ? selectedCriterionData.items
            : [];
        const hasSubcriteria = criterionSubcriteria.length > 0;
        const hasCriterionItems = criterionItems.length > 0;

        return (
            <View className="px-5">
                {/* Render items directly if no subcriteria */}
                {!hasSubcriteria && hasCriterionItems && (
                    <View className="mb-6">
                        {criterionItems.map(item => renderItem(item))}
                    </View>
                )}

                {/* Render subcriteria with their items */}
                {hasSubcriteria && criterionSubcriteria.map((subcriterion, index) => {
                    const subcriterionItems = Array.isArray(subcriterion.items) ? subcriterion.items : [];
                    const hasItems = subcriterionItems.length > 0;

                    if (!hasItems) return null;

                    return (
                        <View key={index} className="mb-3">
                            <View className="flex-row px-2 py-2 rounded-lg mb-2">
                                <Ionicons name="leaf-sharp" size={15} color="#10B981" style={{ paddingTop: 2, paddingLeft: 2, marginRight: 6 }} />
                                <Text className="text-gray-700 text-lg font-bold">
                                    {subcriterion.name}
                                </Text>
                            </View>
                            {subcriterionItems.map(item => renderItem(item))}
                        </View>
                    );
                })}
            </View>
        );
    }, [selectedCriterionData, renderItem]);

    if (loading || isRefreshingProject) {
        return <SkeletonLoader type="criteriaCards" />;
    }

    return (
        <View className="flex-1 bg-gray-100">
            {criteria.length === 0 && !loading ? (
                <View className="flex-1 justify-center items-center px-6">
                    {/* Empty State Icon */}
                    <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
                        <Ionicons name="leaf-outline" size={40} color="#52B788" />
                    </View>

                    <Text className="text-gray-900 text-xl font-bold mb-3 text-center">
                        No Green Elements Available
                    </Text>
                    <Text className="text-gray-600 text-base text-center leading-6 mb-6">
                        It looks like there are no green building elements to display for this project.
                    </Text>

                    {/* Info message */}
                    <View className="bg-blue-50 p-4 rounded-xl w-full">
                        <Text className="text-blue-800 text-sm font-medium mb-2">ℹ️ Information:</Text>
                        <Text className="text-blue-700 text-sm leading-5">
                            Review the predicted answers, toggle the actual checkboxes, and submit the pending additions or deletions.
                        </Text>
                    </View>
                </View>
            ) : criteria.length !== 0 && selectedProject && (
                <>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View className="bg-gray-100 px-6 py-2">
                            {/* Section Header */}
                            <View className="mb-1">
                                <Text className="text-slate-800 font-bold text-base mb-2">Assessment Criteria</Text>
                                <Dropdown
                                    style={{
                                        height: 52,
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: 14,
                                        paddingHorizontal: 14,
                                        borderWidth: 1,
                                        borderColor: '#E2E8F0',
                                    }}
                                    containerStyle={{
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: '#E2E8F0',
                                        backgroundColor: '#FFFFFF',
                                        shadowColor: '#94A3B8',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.12,
                                        shadowRadius: 12,
                                        elevation: 4,
                                        marginTop: 4,
                                        overflow: 'hidden',
                                    }}
                                    itemContainerStyle={{
                                        backgroundColor: '#FFFFFF',
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#F1F5F9',
                                    }}
                                    itemTextStyle={{
                                        color: '#334155',
                                        fontSize: 13,
                                        fontWeight: '500',
                                    }}
                                    activeColor="#E6E8EB"
                                    selectedTextStyle={{
                                        fontSize: 13,
                                        color: '#1E293B',
                                        fontWeight: '600',
                                    }}
                                    placeholderStyle={{
                                        color: '#CBD5E1',
                                        fontSize: 13,
                                        fontWeight: '400',
                                    }}
                                    renderLeftIcon={() => null}
                                    renderRightIcon={() => (
                                        <Ionicons name="chevron-down" size={14} color="#CBD5E1" />
                                    )}
                                    data={criteria}
                                    onChange={(item) => {
                                        handleSectionPress(item);
                                        verticalScrollRef.current?.scrollTo({ y: 0, animated: true });
                                    }}
                                    labelField="name"
                                    valueField="name"
                                    value={selectedCriterion}
                                    placeholder="Choose a criterion"
                                    search={false}
                                    maxHeight={320}
                                    renderItem={(item) => {
                                        const earned = calculateCumulativeMarks(item) || 0;
                                        const actualEarned = calculateActualCumulativeMarks(item) || 0;
                                        const total = item.total_marks || 0;

                                        return (
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 12,
                                                }}
                                            >
                                                {/* Name */}
                                                <Text
                                                    style={{
                                                        flex: 1,
                                                        color: '#1E293B',
                                                        fontSize: 13,
                                                        fontWeight: '600',
                                                        flexShrink: 1,
                                                    }}
                                                    numberOfLines={1}
                                                >
                                                    {item.name}
                                                </Text>

                                                {/* Score badge */}
                                                <View
                                                    style={{
                                                        backgroundColor: '#F1F5F9',
                                                        borderRadius: 8,
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 3,
                                                        marginLeft: 8,
                                                        marginRight: 8
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#475569',
                                                            fontSize: 11,
                                                            fontWeight: '700',
                                                            letterSpacing: 0.3,
                                                        }}
                                                    >
                                                        {actualEarned}/{total}
                                                    </Text>
                                                </View>
                                                <Text
                                                    className="text-xs font-semibold text-center"
                                                >
                                                    pts
                                                </Text>
                                            </View>
                                        );
                                    }}
                                    renderSelectedLabel={(item) => {
                                        const earned = calculateCumulativeMarks(item) || 0;
                                        const actualEarned = calculateActualCumulativeMarks(item) || 0;
                                        const total = item.total_marks || 0;

                                        return (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                                <Text
                                                    style={{ color: '#1E293B', fontSize: 13, fontWeight: '600', flexShrink: 1 }}
                                                    numberOfLines={1}
                                                >
                                                    {item.name}
                                                </Text>
                                                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '500' }}>
                                                    {earned}/{actualEarned}/{total}
                                                </Text>
                                            </View>
                                        );
                                    }}
                                />
                            </View>

                            {selectedCriterionData && (() => {
                                const earned = calculateCumulativeMarks(selectedCriterionData) || 0;
                                const actualEarned = calculateActualCumulativeMarks(selectedCriterionData) || 0;
                                const total = selectedCriterionData.total_marks || 1;
                                const pct = Math.min(Math.round((earned / total) * 100), 100);
                                const actualPct = Math.min(Math.round((actualEarned / total) * 100), 100);

                                return (
                                    <View style={{
                                        backgroundColor: 'white',
                                        borderRadius: 12,
                                        borderWidth: 0.5,
                                        borderColor: '#E2E8F0',
                                        padding: 16,
                                        gap: 10,
                                        marginTop: 12,
                                    }}>
                                        {/* Header */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Score summary</Text>
                                        </View>

                                        {/* Predicted row */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#B4B2A9' }} />
                                            <Text style={{ fontSize: 12, color: '#64748B', width: 60 }}>Predicted</Text>
                                            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                                                <View style={{ width: `${pct}%`, height: '100%', borderRadius: 2, backgroundColor: '#B4B2A9' }} />
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, width: 64, justifyContent: 'flex-end' }}>
                                                <Text style={{ fontSize: 16, fontWeight: '500', color: '#1E293B', lineHeight: 20 }}>{earned} / {total}</Text>
                                            </View>
                                        </View>

                                        {/* Actual row */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#1D9E75' }} />
                                            <Text style={{ fontSize: 12, color: '#64748B', width: 60 }}>Actual</Text>
                                            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E1F5EE', overflow: 'hidden' }}>
                                                <View style={{ width: `${actualPct}%`, height: '100%', borderRadius: 2, backgroundColor: '#1D9E75' }} />
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, width: 64, justifyContent: 'flex-end' }}>
                                                <Text style={{ fontSize: 16, fontWeight: '500', color: '#0F6E56', lineHeight: 20 }}>{actualEarned} / {total}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })()}
                        </View>
                    </TouchableWithoutFeedback>

                    <View className="flex-1 pt-2">
                        <ScrollView
                            ref={verticalScrollRef}
                            className="flex-1"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 8 }}
                        >
                            {renderCriterionItems()}
                        </ScrollView>
                    </View>

                    <View
                        className="px-5 pt-4 bg-white border-t border-t-slate-200"
                    >
                        <View>
                            <View style={{
                                flexDirection: 'row',
                                borderRadius: 14,
                                borderWidth: 0.5,
                                borderColor: '#E2E8F0',
                                overflow: 'hidden',
                            }}>
                                {/* Predicted */}
                                <View style={{
                                    flex: 1,
                                    minWidth: 0,
                                    padding: 10, paddingHorizontal: 14,
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <View style={{ gap: 2 }}>
                                        <Text style={{ fontSize: 11, color: '#94A3B8' }}>Predicted</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                                            <Text style={{ fontSize: 18, fontWeight: '500', color: '#1E293B', lineHeight: 22 }}>
                                                {overallScoreSummary.predicted}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: '#94A3B8' }}>/ {overallScoreSummary.total}</Text>
                                        </View>
                                    </View>
                                    <View style={{
                                        backgroundColor: predictedCertificationPalette.badgeBackgroundColor,
                                        borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
                                    }}>
                                        <Text style={{ fontSize: 10, fontWeight: '500', color: predictedCertificationPalette.badgeTextColor }}>
                                            {predictedCertificationLevel}
                                        </Text>
                                    </View>
                                </View>

                                {/* Divider */}
                                <View style={{ width: 0.5, backgroundColor: '#E2E8F0' }} />

                                {/* Actual */}
                                <View style={{
                                    flex: 1,
                                    minWidth: 20,
                                    padding: 10, paddingHorizontal: 14,
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <View style={{ gap: 2 }}>
                                        <Text style={{ fontSize: 11, color: '#1D9E75' }}>Actual</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                                            <Text style={{ fontSize: 18, fontWeight: '500', color: '#0F6E56', lineHeight: 22 }}>
                                                {overallScoreSummary.actual}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: '#1D9E75' }}>/ {overallScoreSummary.total}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        <View style={{
                                            backgroundColor: actualCertificationPalette.badgeBackgroundColor,
                                            borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
                                        }}>
                                            <Text style={{ fontSize: 10, fontWeight: '500', color: actualCertificationPalette.badgeTextColor }}>
                                                {actualCertificationLevel}
                                            </Text>
                                        </View>
                                        {overallScoreSummary.actual !== overallScoreSummary.predicted && (
                                            <View style={{
                                                flexDirection: 'row', alignItems: 'center', gap: 2,
                                                backgroundColor: overallScoreSummary.actual > overallScoreSummary.predicted ? '#E1F5EE' : '#FAECE7',
                                                borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
                                            }}>
                                                <Ionicons
                                                    name={overallScoreSummary.actual > overallScoreSummary.predicted ? 'arrow-up' : 'arrow-down'}
                                                    size={8}
                                                    color={overallScoreSummary.actual > overallScoreSummary.predicted ? '#0F6E56' : '#993C1D'}
                                                />
                                                <Text style={{
                                                    fontSize: 10, fontWeight: '500',
                                                    color: overallScoreSummary.actual > overallScoreSummary.predicted ? '#0F6E56' : '#993C1D',
                                                }}>
                                                    {Math.abs(overallScoreSummary.actual - overallScoreSummary.predicted)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {!hideSubmitButton && (
                            <TouchableOpacity
                                onPress={handleSubmitAuditChanges}
                                disabled={!hasAuditChanges}
                                activeOpacity={0.8}
                                className={`rounded-2xl px-4 py-3 ${hasAuditChanges ? 'bg-slate-900' : 'bg-slate-300'}`}
                            >
                                <Text className="text-center text-sm font-semibold text-white">
                                    {hasAuditChanges ? `Submit Changes (${auditChanges.length})` : 'No changes to submit'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <InfoGuideModal
                        isVisible={isInfoGuideVisible}
                        info={infoGuideText}
                        title={infoGuideTitle}
                        label={infoGuideLabel}
                        onClose={() => setIsInfoGuideVisible(false)}
                    />
                </>
            )
            }
        </View >
    );
}

export default GreenElementsDisplayScreen;
