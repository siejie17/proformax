import { View, Text, TextInput, TouchableOpacity, Animated, Modal } from 'react-native';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Ionicons, Entypo } from '@expo/vector-icons';

const CostNode = ({ code, node, level = 0, onCostChange, path, onDelete = () => { }, isDeleteMode = null, isAddMode = null, onAddCost = () => { }, highlightedItem = null, displayOnly, originalNode = null, onActualCostChange = null, predictedMarks = 0, marksData = null, setMarksData = null, certifiedScaleRange, certificationMultipliers = {} }) => {
    const getCertificationPalette = (level) => {
        const palette = {
            Platinum: {
                chipBg: '#E2E8F0',
                chipText: '#0F172A',
                accentBg: '#CBD5E1',
                accentText: '#0F172A',
            },
            Gold: {
                chipBg: '#FEF3C7',
                chipText: '#92400E',
                accentBg: '#FDE68A',
                accentText: '#92400E',
            },
            Silver: {
                chipBg: '#F1F5F9',
                chipText: '#475569',
                accentBg: '#E2E8F0',
                accentText: '#334155',
            },
            Certified: {
                chipBg: '#D1FAE5',
                chipText: '#065F46',
                accentBg: '#A7F3D0',
                accentText: '#065F46',
            },
            'Not Certified': {
                chipBg: '#E5E7EB',
                chipText: '#4B5563',
                accentBg: '#D1D5DB',
                accentText: '#374151',
            },
        };

        return palette[level] || palette['Not Certified'];
    };

    const getCertificationLevel = useCallback((marks) => {
        if (node?.is_certification && node?.certification_level && marks === predictedMarks) {
            return node.certification_level;
        }

        if (!certifiedScaleRange || Object.keys(certifiedScaleRange).length === 0) {
            return 'Not Certified';
        }
        for (const [level, range] of Object.entries(certifiedScaleRange)) {
            if (marks >= range[0] && marks <= range[1]) {
                return level;
            }
        }
        return 'Not Certified';
    }, [certifiedScaleRange, node?.certification_level, node?.is_certification, predictedMarks]);

    const getDisplayCode = () => {
        if (level === 2) {
            const numCode = parseInt(code);
            if (!isNaN(numCode)) {
                return String.fromCharCode(96 + numCode);
            }
        }
        return code;
    };

    const formatWithCommas = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const removeCommas = (value) => value.replace(/,/g, '');

    const formatInputWithCommas = (value) => {
        const cleanValue = removeCommas(value);
        if (cleanValue === '') return '';
        if (cleanValue.endsWith('.')) {
            const intPart = cleanValue.slice(0, -1);
            return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.';
        }
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    if (!node) return null;

    const getActualInputDisplayValue = () => (
        formatWithCommas(
            node.actual_cost !== null && node.actual_cost !== undefined
                ? node.actual_cost
                : (node.cost || originalNode?.cost || 0)
        ) || '0.00'
    );

    const getPredictedCost = () => {
        const predictedCost = originalNode?.cost ?? node.cost;
        return predictedCost !== null && predictedCost !== undefined
            ? Number(predictedCost) || 0
            : 0;
    };

    const getActualCost = () => {
        const actualCost = node.actual_cost ?? originalNode?.actual_cost ?? node.cost ?? originalNode?.cost;
        return actualCost !== null && actualCost !== undefined
            ? Number(actualCost) || 0
            : 0;
    };

    const getWorkDonePercentage = () => {
        const predictedCost = getPredictedCost();
        if (predictedCost <= 0) return null;

        return (getActualCost() / predictedCost) * 100;
    };

    const renderWorkDoneBadge = (textColor = 'text-slate-700') => {
        const workDonePercentage = getWorkDonePercentage();

        return (
            <View className="items-end min-w-[18px] ml-1">
                <Text allowFontScaling={false} className={`font-bold text-[10px] ${textColor}`}>
                    {workDonePercentage === null ? '--' : `${workDonePercentage.toFixed(1)}`}
                </Text>
            </View>
        );
    };

    const handleActualInputChange = (val) => {
        const digitsOnly = val.replace(/\D/g, '');
        const nextValue = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10) / 100;

        if (onActualCostChange) {
            onActualCostChange(currentPath, nextValue, digitsOnly);
        }
    };

    const hasChildren = node.children && Object.keys(node.children).length > 0;
    const currentPath = path ? `${path}.${code}` : code;
    const isHighlighted = highlightedItem === currentPath;

    const [isExpanded, setIsExpanded] = useState(level === 0);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const animatedHeight = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
    const rotateAnimation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
    const highlightAnimation = useRef(new Animated.Value(0)).current;

    const toggleExpanded = () => {
        const toValue = isExpanded ? 0 : 1;
        setIsExpanded(!isExpanded);
        Animated.parallel([
            Animated.timing(animatedHeight, { toValue, duration: 300, useNativeDriver: false }),
            Animated.timing(rotateAnimation, { toValue, duration: 300, useNativeDriver: true }),
        ]).start();
    };

    const rotateInterpolate = rotateAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg'],
    });

    React.useEffect(() => {
        if (isHighlighted) {
            Animated.sequence([
                Animated.timing(highlightAnimation, { toValue: 1, duration: 300, useNativeDriver: false }),
                Animated.timing(highlightAnimation, { toValue: 0, duration: 300, useNativeDriver: false }),
                Animated.timing(highlightAnimation, { toValue: 1, duration: 300, useNativeDriver: false }),
                Animated.timing(highlightAnimation, { toValue: 0, duration: 300, useNativeDriver: false }),
                Animated.timing(highlightAnimation, { toValue: 1, duration: 300, useNativeDriver: false }),
                Animated.timing(highlightAnimation, { toValue: 0, duration: 300, useNativeDriver: false }),
            ]).start();
        }
    }, [isHighlighted]);

    const highlightBackgroundColor = highlightAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 1)', 'rgba(59, 130, 246, 0.2)'],
    });

    const handleDelete = () => setDeleteModalVisible(true);
    const confirmDelete = () => {
        setDeleteModalVisible(false);
        onDelete(currentPath);
    };

    // ─── Level 0 (section header) ─────────────────────────────────────────────
    if (level === 0) {
        const isLocked = node.locked && node.isMultiplier;
        const isCertification = node.is_certification;
        const predictedCertificationLevel = node?.certification_level || getCertificationLevel(predictedMarks);
        const predictedCertificationPalette = getCertificationPalette(predictedCertificationLevel);
        const predictedCertificationPercent = node?.multiplier_percent ?? certificationMultipliers[predictedCertificationLevel] ?? 0;
        const actualCertificationLevel = getCertificationLevel(marksData?.actual);
        const actualCertificationPalette = getCertificationPalette(actualCertificationLevel);
        const actualCertificationPercent = certificationMultipliers[actualCertificationLevel] || 0;

        return (
            <View className="bg-white rounded-3xl mb-4 overflow-hidden shadow-md border border-gray-100">
                <TouchableOpacity
                    className="p-4 flex-row items-center justify-between"
                    style={{
                        backgroundColor: isLocked ? '#B45309' : '#1E293B',
                    }}
                    onPress={!isLocked ? toggleExpanded : undefined}
                    activeOpacity={isLocked ? 1 : 0.8}
                    disabled={isLocked}
                >
                    <View className="flex-row items-center flex-1 mr-3">
                        <View className="w-6 h-6 rounded-xl bg-white/10 items-center justify-center mr-3">
                            {isLocked ? (
                                <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
                            ) : hasChildren ? (
                                <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                                    <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
                                </Animated.View>
                            ) : (
                                <Ionicons name="attach" size={12} color="#FFFFFF" opacity={0.5} />
                            )}
                        </View>
                        <Text allowFontScaling={false} className={`text-white font-bold ${displayOnly ? 'text-[10px] leading-4' : 'text-xs leading-4'} flex-1`} numberOfLines={2}>
                            {code}. {node.description || 'No description'}
                        </Text>
                    </View>

                    {/* Cost Display or Input */}
                    {displayOnly ? (
                        <View className="flex-row items-center gap-3">
                            {/* Budget — plain muted text, no box */}

                            <View className="gap-1 items-end">
                                {isCertification ? (
                                    <View className="rounded-xl overflow-hidden min-w-[70px]">
                                        {/* Top layer — value */}
                                        <View className="bg-white/10 px-3 py-1.5 items-end">
                                            <Text allowFontScaling={false} className="text-[11px] font-semibold text-white">
                                                {originalNode?.cost !== null && originalNode?.cost !== undefined
                                                    ? formatWithCommas(originalNode.cost)
                                                    : '—'}
                                            </Text>
                                        </View>
                                        {/* Bottom layer — certification info */}
                                        <View
                                            className="px-3 py-1 items-end gap-0.5"
                                            style={{ backgroundColor: predictedCertificationPalette.accentBg }}
                                        >
                                            <Text allowFontScaling={false} className="text-[9px] font-semibold" style={{ color: predictedCertificationPalette.accentText }}>
                                                {predictedCertificationLevel || 'Not Certified'}
                                            </Text>
                                            <Text allowFontScaling={false} className="text-[9px] font-medium" style={{ color: predictedCertificationPalette.accentText, opacity: 0.75 }}>
                                                +{predictedCertificationPercent}%
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View className="rounded-xl py-1.5 min-w-[80px] items-end">
                                        <Text allowFontScaling={false} className="text-[11px] font-semibold text-white">
                                            {originalNode?.cost !== null && originalNode?.cost !== undefined
                                                ? formatWithCommas(originalNode.cost)
                                                : '—'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {/* Actual */}
                            {(!hasChildren && !isCertification) ? (
                                <View className="bg-white/10 border border-blue-400 rounded-xl px-3 py-1.5 min-w-[75px]">
                                    <TextInput
                                        className="text-blue-300 font-bold text-[11px] text-right p-0"
                                        allowFontScaling={false}
                                        keyboardType="numeric"
                                        value={getActualInputDisplayValue()}
                                        onChangeText={handleActualInputChange}
                                        placeholder={formatWithCommas(node.cost || originalNode?.cost || 0)}
                                        placeholderTextColor="#93c5fd"
                                    />
                                </View>
                            ) : isCertification ? (
                                /* Stacked pill */
                                <View className="rounded-xl overflow-hidden min-w-[70px]">
                                    {/* Top layer — value */}
                                    <View className="bg-white/10 px-3 py-1.5 items-end">
                                        <Text
                                            allowFontScaling={false}
                                            className="text-[11px] font-semibold text-white"
                                        >
                                            {formatWithCommas(node.actual_cost) || '0.00'}
                                        </Text>
                                    </View>
                                    {/* Bottom layer — certification info */}
                                    <View
                                        className="px-3 py-1 items-end gap-0.5"
                                        style={{ backgroundColor: actualCertificationPalette.accentBg }}
                                    >
                                        <Text allowFontScaling={false} className="text-[9px] font-semibold" style={{ color: actualCertificationPalette.accentText }}>
                                            {actualCertificationLevel || 'Not Certified'}
                                        </Text>
                                        <Text allowFontScaling={false} className="text-[9px] font-medium" style={{ color: actualCertificationPalette.accentText, opacity: 0.75 }}>
                                            +{actualCertificationPercent}%
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                /* Plain read-only value */
                                <View className="bg-white/10 rounded-xl px-3 py-1.5 min-w-[80px] items-end">
                                    <Text allowFontScaling={false} className="text-[11px] font-semibold text-white">
                                        {formatWithCommas(node.actual_cost) || '0.00'}
                                    </Text>
                                </View>
                            )}
                            {renderWorkDoneBadge('text-white')}
                        </View>
                    ) : (isLocked || hasChildren || isCertification) ? (
                        <View className="items-end gap-1.5">
                            <View
                                className="rounded-xl px-3.5 py-2 flex-row items-center shadow-sm"
                                style={{ backgroundColor: isLocked ? '#F59E0B' : '#3B82F6' }}
                            >
                                <Text allowFontScaling={false} className="text-white font-bold text-sm tracking-tight">
                                    {node.cost !== null && node.cost !== undefined ? formatWithCommas(node.cost) : '—'}
                                </Text>
                            </View>
                            {isCertification ? (
                                <View
                                    className="rounded-lg px-2.5 py-1"
                                    style={{ backgroundColor: predictedCertificationPalette.chipBg }}
                                >
                                    <Text
                                        allowFontScaling={false}
                                        className="font-semibold text-[9px]"
                                        style={{ color: predictedCertificationPalette.chipText }}
                                    >
                                        {getCertificationLevel(predictedMarks) || 'Not Certified'} • +{predictedCertificationPercent}%
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    ) : (
                        <View className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 min-w-[80px] shadow-sm">
                            <TextInput
                                className="text-slate-800 text-sm font-bold text-right p-0"
                                allowFontScaling={false}
                                keyboardType="numeric"
                                value={node.inputValue !== undefined ? formatInputWithCommas(node.inputValue) : (node.cost !== null && node.cost !== undefined && node.cost !== 0 ? formatWithCommas(node.cost) : '')}
                                onChangeText={(val) => {
                                    const cleanVal = removeCommas(val);
                                    if (val === '' || /^[\d,]*\.?\d*$/.test(val)) {
                                        if (cleanVal === '' || /^\d*\.?\d*$/.test(cleanVal)) {
                                            onCostChange(currentPath, cleanVal === '' ? 0 : parseFloat(cleanVal) || 0, cleanVal);
                                        }
                                    }
                                }}
                                placeholder="0.00"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    )}

                    {/* Add/Delete buttons */}
                    {!isLocked ? (
                        <View className="flex-row items-center gap-2 ml-2">
                            {(isAddMode && hasChildren && !displayOnly && level < 2) ? (
                                <TouchableOpacity onPress={() => onAddCost(currentPath)} className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 active:bg-emerald-100" activeOpacity={0.7}>
                                    <Ionicons name="add" size={14} color="#059669" />
                                </TouchableOpacity>
                            ) : null}
                            {(isDeleteMode && !displayOnly && !hasChildren) ? (
                                <TouchableOpacity onPress={handleDelete} className="bg-red-50 border border-red-200 rounded-lg p-2 active:bg-red-100" activeOpacity={0.7}>
                                    <Ionicons name="trash-outline" size={14} color="#dc2626" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    ) : null}
                </TouchableOpacity>

                {/* Children */}
                {(!isLocked && hasChildren) ? (
                    <Animated.View style={{ opacity: animatedHeight, maxHeight: animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 1200] }) }}>
                        {isExpanded ? Object.entries(node.children).map(([childCode, childNode]) => (
                            <CostNode
                                key={childCode}
                                code={childCode}
                                node={childNode}
                                level={level + 1}
                                path={currentPath}
                                onCostChange={onCostChange}
                                onDelete={onDelete}
                                isDeleteMode={isDeleteMode}
                                isAddMode={isAddMode}
                                onAddCost={onAddCost}
                                highlightedItem={highlightedItem}
                                displayOnly={displayOnly}
                                originalNode={originalNode?.children?.[childCode]}
                                onActualCostChange={onActualCostChange}
                                predictedMarks={predictedMarks}
                                marksData={marksData}
                                setMarksData={setMarksData}
                                certifiedScaleRange={certifiedScaleRange}
                                certificationMultipliers={certificationMultipliers}
                            />
                        )) : null}
                    </Animated.View>
                ) : null}
            </View>
        );
    }

    // ─── Level 1+ rows ────────────────────────────────────────────────────────
    return (
        <>
            <View>
                {hasChildren ? (
                    <>
                        <TouchableOpacity
                            className={`border-b border-slate-100 ${level === 1 ? 'bg-blue-100/50 pr-2' : 'bg-blue-50/40'}`}
                            onPress={toggleExpanded}
                            activeOpacity={0.7}
                        >
                            <View className={`py-3.5 flex-row items-center justify-between ${level === 1 ? 'px-5' : 'px-5'}`}>
                                <View className="flex-row items-center flex-1 mr-3">
                                    {level === 2 ? (
                                        <View className="w-5 mr-2.5 items-center justify-center">
                                            <Entypo name="level-down" size={9} color="#000000" />
                                        </View>
                                    ) : (
                                        <Animated.View
                                            className="w-6 h-6 rounded-lg bg-blue-100 items-center justify-center mr-2.5"
                                            style={{ transform: [{ rotate: rotateInterpolate }] }}
                                        >
                                            <Ionicons name="chevron-forward" size={13} color="#3b82f6" />
                                        </Animated.View>
                                    )}
                                    <Text allowFontScaling={false} className="text-slate-700 font-semibold text-[11px] leading-4 flex-1" numberOfLines={2}>
                                        {level === 2 ? `${getDisplayCode()}. ` : `${code}. `}{node.description || 'No description'}
                                    </Text>
                                </View>

                                {displayOnly ? (
                                    <View className="flex-row items-center gap-4">
                                        {/* Budget — plain muted text */}
                                        <Text allowFontScaling={false} className="text-slate-400 font-bold text-[10px]">
                                            {originalNode?.cost !== null && originalNode?.cost !== undefined ? formatWithCommas(originalNode.cost) : '—'}
                                        </Text>
                                        {/* Actual — subtle filled box */}
                                        <View className="bg-blue-50 rounded-lg px-2.5 py-1.5 min-w-[70px]">
                                            <Text allowFontScaling={false} className="text-blue-600 font-bold text-[10px] text-right">
                                                {formatWithCommas(node.actual_cost) || "0.00"}
                                            </Text>
                                        </View>
                                        {renderWorkDoneBadge()}
                                    </View>
                                ) : (
                                    <View className="bg-blue-50 rounded-lg px-2.5 py-1.5 min-w-[85px]">
                                        <Text allowFontScaling={false} className="text-blue-600 font-bold text-[11px] text-right">
                                            {node.cost !== null && node.cost !== undefined ? formatWithCommas(node.cost) : '—'}
                                        </Text>
                                    </View>
                                )}

                                {(!displayOnly && isAddMode && hasChildren && level < 2) ? (
                                    <TouchableOpacity onPress={() => onAddCost(currentPath)} className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 active:bg-emerald-100 ml-1" activeOpacity={0.7}>
                                        <Ionicons name="add" size={12} color="#059669" />
                                    </TouchableOpacity>
                                ) : null}
                                {(!displayOnly && isDeleteMode && !hasChildren) ? (
                                    <TouchableOpacity onPress={handleDelete} className="bg-red-50 border border-red-200 rounded-lg p-2 active:bg-red-100 ml-1" activeOpacity={0.7}>
                                        <Ionicons name="trash-outline" size={12} color="#dc2626" />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </TouchableOpacity>

                        <Animated.View
                            style={{ opacity: animatedHeight, maxHeight: animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }) }}
                            className="overflow-hidden"
                        >
                            {isExpanded && Object.entries(node.children).map(([childCode, childNode]) => (
                                <CostNode
                                    key={childCode}
                                    code={childCode}
                                    node={childNode}
                                    level={level + 1}
                                    path={currentPath}
                                    onCostChange={onCostChange}
                                    onDelete={onDelete}
                                    isDeleteMode={isDeleteMode}
                                    isAddMode={isAddMode}
                                    onAddCost={onAddCost}
                                    highlightedItem={highlightedItem}
                                    displayOnly={displayOnly}
                                    originalNode={originalNode?.children?.[childCode]}
                                    onActualCostChange={onActualCostChange}
                                    predictedMarks={predictedMarks}
                                    marksData={marksData}
                                    setMarksData={setMarksData}
                                    certifiedScaleRange={certifiedScaleRange}
                                    certificationMultipliers={certificationMultipliers}
                                />
                            ))}
                        </Animated.View>
                    </>
                ) : (
                    // ── Leaf row (no children) ──────────────────────────────
                    <Animated.View
                        className={`py-3.5 flex-row items-center justify-between border-b border-slate-100 ${level === 1 ? 'px-6 bg-blue-50/60 pl-8' : level > 1 ? 'px-5 pl-14 bg-slate-50/40' : 'px-5 bg-white'}`}
                        style={{ backgroundColor: isHighlighted ? highlightBackgroundColor : undefined }}
                    >
                        <View className="flex-row items-center flex-1 mr-3">
                            {level === 2 ? (
                                <View className="w-5 mr-2 items-center justify-center">
                                    <Entypo name="level-down" size={10} color="#000000" />
                                </View>
                            ) : null}
                            <Text
                                allowFontScaling={false}
                                className={`flex-1 leading-4 ${level > 1 ? 'text-slate-500 text-[10px]' : level === 1 ? 'text-blue-700 text-[10px] font-semibold' : 'text-slate-600 text-[11px]'} font-medium`}
                                numberOfLines={2}
                            >
                                {level === 2 ? `${getDisplayCode()}. ` : `${code}. `}{node.description || 'No description'}
                            </Text>
                        </View>

                        <View className="flex-row items-center gap-2">
                            {displayOnly ? (
                                <View className="flex-row items-center gap-4">
                                    {/* Budget — plain muted text, no box */}
                                    <Text allowFontScaling={false} className="text-slate-400 font-bold text-[10px]">
                                        {originalNode?.cost !== null && originalNode?.cost !== undefined ? formatWithCommas(originalNode.cost) : '—'}
                                    </Text>
                                    {/* Actual — editable input */}
                                    <View className="bg-white border border-blue-300 rounded-xl px-2.5 py-1.5 min-w-[75px]">
                                        <TextInput
                                            className="text-blue-700 text-[10px] font-bold text-right p-0"
                                            allowFontScaling={false}
                                            keyboardType="numeric"
                                            value={getActualInputDisplayValue()}
                                            onChangeText={handleActualInputChange}
                                            placeholder={formatWithCommas(node.cost || originalNode?.cost || 0)}
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </View>
                                    {renderWorkDoneBadge()}
                                </View>
                            ) : (
                                <>
                                    <View className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 min-w-[85px] shadow-sm">
                                        <TextInput
                                            className="text-slate-800 text-[11px] font-bold text-right p-0"
                                            allowFontScaling={false}
                                            keyboardType="numeric"
                                            value={node.inputValue !== undefined ? formatInputWithCommas(node.inputValue) : (node.cost !== null && node.cost !== undefined && node.cost !== 0 ? formatWithCommas(node.cost) : '')}
                                            onChangeText={(val) => {
                                                const cleanVal = removeCommas(val);
                                                if (val === '' || /^[\d,]*\.?\d*$/.test(val)) {
                                                    if (cleanVal === '' || /^\d*\.?\d*$/.test(cleanVal)) {
                                                        onCostChange(currentPath, cleanVal === '' ? 0 : parseFloat(cleanVal) || 0, cleanVal);
                                                    }
                                                }
                                            }}
                                            placeholder="0.00"
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </View>
                                    {(isAddMode && level < 2) ? (
                                        <TouchableOpacity onPress={() => onAddCost(currentPath)} className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 active:bg-emerald-100" activeOpacity={0.7}>
                                            <Ionicons name="add" size={14} color="#059669" />
                                        </TouchableOpacity>
                                    ) : null}
                                    {isDeleteMode ? (
                                        <TouchableOpacity onPress={handleDelete} className="bg-red-50 border border-red-200 rounded-lg p-2 active:bg-red-100" activeOpacity={0.7}>
                                            <Ionicons name="trash-outline" size={14} color="#dc2626" />
                                        </TouchableOpacity>
                                    ) : null}
                                </>
                            )}
                        </View>
                    </Animated.View>
                )}
            </View>

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-lg">
                        <View className="items-center mb-4">
                            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center">
                                <Ionicons name="trash-outline" size={32} color="#dc2626" />
                            </View>
                        </View>
                        <Text allowFontScaling={false} className="text-slate-900 font-bold text-lg text-center mb-2">Remove Item</Text>
                        <Text allowFontScaling={false} className="text-slate-600 text-sm text-center mb-6">
                            Are you sure you want to remove "{node.description}"?
                        </Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity onPress={() => setDeleteModalVisible(false)} className="flex-1 bg-slate-100 rounded-xl py-3 active:bg-slate-200" activeOpacity={0.8}>
                                <Text allowFontScaling={false} className="text-slate-700 font-bold text-center text-sm">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmDelete} className="flex-1 bg-red-600 rounded-xl py-3 active:bg-red-700" activeOpacity={0.8}>
                                <Text allowFontScaling={false} className="text-white font-bold text-center text-sm">Remove</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default CostNode;
