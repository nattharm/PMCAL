import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { dbCapabilitylist, dbEquipmentMaster, initialPMCALMaster, initialPMCALlist } from '../data/mockData';

const LabContext = createContext();

// LocalStorage Keys
const STORAGE_KEYS = {
    pmCalMaster: 'atc_pmCalMaster',
    pmCalList: 'atc_pmCalList',
    abnormalityReports: 'atc_abnormalityReports',
    troubleshootingCases: 'atc_troubleshootingCases',
    capabilities: 'atc_capabilities',
    equipmentMaster: 'atc_equipmentMaster'
};

// Load from localStorage or use default
const loadFromStorage = (key, defaultValue) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        return defaultValue;
    }
};

// Default data for abnormality reports
const defaultAbnormalityReports = [
    {
        id: 'mock-1',
        EquipmentName: 'Universal Testing Machine',
        EquipmentCode: 'UTM-01',
        Capability: 'Mechanical Testing',
        OriginalDate: '2024-01-15',
        NewDate: '2024-01-20',
        Reason: 'Delayed spare parts delivery from vendor.',
        Type: 'Postpone',
        Status: 'Reported',
        CreatedAt: new Date('2024-01-10').toISOString()
    },
    {
        id: 'mock-2',
        EquipmentName: 'Keyence Microscopy',
        EquipmentCode: 'MIC-03',
        Capability: 'Microscopy',
        OriginalDate: '2024-02-10',
        NewDate: '2024-02-25',
        Reason: 'External calibrator not available on scheduled date.',
        Type: 'Postpone',
        Status: 'Draft',
        CreatedAt: new Date('2024-02-05').toISOString()
    }
];

// Initialize state from localStorage if available, otherwise use defaults
const initialState = {
    capabilities: loadFromStorage(STORAGE_KEYS.capabilities, [...new Set(dbCapabilitylist)]),
    equipmentMaster: loadFromStorage(STORAGE_KEYS.equipmentMaster, dbEquipmentMaster),
    pmCalMaster: loadFromStorage(STORAGE_KEYS.pmCalMaster, initialPMCALMaster),
    pmCalList: loadFromStorage(STORAGE_KEYS.pmCalList, initialPMCALlist),
    abnormalityReports: loadFromStorage(STORAGE_KEYS.abnormalityReports, defaultAbnormalityReports),
    troubleshootingCases: loadFromStorage(STORAGE_KEYS.troubleshootingCases, []),
};

function labReducer(state, action) {
    switch (action.type) {
        // --- Existing Cases ---
        case 'REGISTER_MASTER':
            return {
                ...state,
                pmCalMaster: [...state.pmCalMaster, { ...action.payload, id: Date.now() }]
            };
        case 'BULK_IMPORT_MASTER':
            // payload: array of master records
            const importedRecords = action.payload.map(item => ({
                ...item,
                id: Date.now() + Math.random()
            }));
            return {
                ...state,
                pmCalMaster: [...state.pmCalMaster, ...importedRecords]
            };
        case 'ADD_SCHEDULE':
            // payload: array of items
            const newItems = action.payload.map(item => ({
                ...item,
                id: Date.now() + Math.random(),
                Status: 'Pending',
            }));
            return {
                ...state,
                pmCalList: [...state.pmCalList, ...newItems]
            };
        case 'UPDATE_SCHEDULE_STATUS':
            return {
                ...state,
                pmCalList: state.pmCalList.map(item =>
                    item.id === action.payload.id
                        ? { ...item, ...action.payload.updates }
                        : item
                )
            };
        case 'UPDATE_MASTER':
            return {
                ...state,
                pmCalMaster: state.pmCalMaster.map(master =>
                    master.id === action.payload.masterId
                        ? { ...master, ...action.payload.updates }
                        : master
                )
            };
        // --- Abnormality Cases ---
        case 'CREATE_ABNORMALITY':
            return {
                ...state,
                abnormalityReports: [...state.abnormalityReports, { ...action.payload, id: Date.now(), Status: 'Draft', CreatedAt: new Date().toISOString() }]
            };
        case 'UPDATE_ABNORMALITY':
            return {
                ...state,
                abnormalityReports: state.abnormalityReports.map(report =>
                    report.id === action.payload.id
                        ? { ...report, ...action.payload.updates }
                        : report
                )
            };
        // --- Troubleshooting Cases ---
        case 'CREATE_TROUBLESHOOTING':
            return {
                ...state,
                troubleshootingCases: [...state.troubleshootingCases, { ...action.payload, id: Date.now(), Status: 'Open', CreatedAt: new Date().toISOString() }]
            };
        case 'UPDATE_TROUBLESHOOTING':
            return {
                ...state,
                troubleshootingCases: state.troubleshootingCases.map(tcase =>
                    tcase.id === action.payload.id
                        ? { ...tcase, ...action.payload.updates }
                        : tcase
                )
            };

        // --- Capability Management ---
        case 'ADD_CAPABILITY':
            // Payload can be string (from prompt) or object (from import)
            const newCap = typeof action.payload === 'string'
                ? { _id: Date.now(), capabilityName: action.payload, isActive: true, createdAt: new Date().toISOString() }
                : action.payload;

            // Check for duplicates based on capabilityName
            if (state.capabilities.some(c => (c.capabilityName || c) === (newCap.capabilityName || newCap))) {
                return state;
            }
            return { ...state, capabilities: [...state.capabilities, newCap] };

        case 'DELETE_CAPABILITY':
            // Payload is likely the name or ID
            return {
                ...state,
                capabilities: state.capabilities.filter(c => (c.capabilityName || c) !== action.payload && c._id !== action.payload)
            };

        // --- Equipment Master Management ---
        case 'ADD_EQUIPMENT':
            return { ...state, equipmentMaster: [...state.equipmentMaster, { ...action.payload, id: Date.now() }] };
        case 'UPDATE_EQUIPMENT':
            return {
                ...state,
                equipmentMaster: state.equipmentMaster.map(item =>
                    item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
                )
            };
        case 'DELETE_EQUIPMENT':
            return { ...state, equipmentMaster: state.equipmentMaster.filter(item => item.id !== action.payload) };

        case 'OVERWRITE_DATABASE':
            return {
                ...state,
                ...action.payload,
                pmCalList: action.payload.pmCalList ? [...action.payload.pmCalList] : state.pmCalList,
                pmCalMaster: action.payload.pmCalMaster ? [...action.payload.pmCalMaster] : state.pmCalMaster,
                abnormalityReports: action.payload.abnormalityReports ? [...action.payload.abnormalityReports] : state.abnormalityReports,
                troubleshootingCases: action.payload.troubleshootingCases ? [...action.payload.troubleshootingCases] : state.troubleshootingCases,
                equipmentMaster: action.payload.equipmentMaster ? [...action.payload.equipmentMaster] : state.equipmentMaster,
                capabilities: action.payload.capabilities ? [...action.payload.capabilities] : state.capabilities,
                lastUpdated: Date.now()
            };
        default:
            return state;
    }
}

export function LabProvider({ children }) {
    const [state, dispatch] = useReducer(labReducer, initialState);

    // Save to localStorage whenever state changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.pmCalMaster, JSON.stringify(state.pmCalMaster));
        } catch (error) { console.error('Error saving pmCalMaster:', error); }
    }, [state.pmCalMaster]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.pmCalList, JSON.stringify(state.pmCalList));
        } catch (error) { console.error('Error saving pmCalList:', error); }
    }, [state.pmCalList]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.abnormalityReports, JSON.stringify(state.abnormalityReports));
        } catch (error) { console.error('Error saving abnormalityReports:', error); }
    }, [state.abnormalityReports]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.troubleshootingCases, JSON.stringify(state.troubleshootingCases));
        } catch (error) { console.error('Error saving troubleshootingCases:', error); }
    }, [state.troubleshootingCases]);

    // New Persistence for Capabilities and Equipment Master
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.capabilities, JSON.stringify(state.capabilities));
        } catch (error) { console.error('Error saving capabilities:', error); }
    }, [state.capabilities]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.equipmentMaster, JSON.stringify(state.equipmentMaster));
        } catch (error) { console.error('Error saving equipmentMaster:', error); }
    }, [state.equipmentMaster]);

    const registerMaster = (data) => dispatch({ type: 'REGISTER_MASTER', payload: data });
    const bulkImportMaster = (items) => dispatch({ type: 'BULK_IMPORT_MASTER', payload: items });
    const addSchedule = (items) => dispatch({ type: 'ADD_SCHEDULE', payload: items });
    const updateSchedule = (id, updates) => dispatch({ type: 'UPDATE_SCHEDULE_STATUS', payload: { id, updates } });
    const updateMaster = (masterId, updates) => dispatch({ type: 'UPDATE_MASTER', payload: { masterId, updates } });
    const createAbnormality = (data) => dispatch({ type: 'CREATE_ABNORMALITY', payload: data });
    const updateAbnormality = (id, updates) => dispatch({ type: 'UPDATE_ABNORMALITY', payload: { id, updates } });
    const createTroubleshootingCase = (data) => dispatch({ type: 'CREATE_TROUBLESHOOTING', payload: data });
    const updateTroubleshootingCase = (id, updates) => dispatch({ type: 'UPDATE_TROUBLESHOOTING', payload: { id, updates } });
    const overwriteDatabase = (data) => dispatch({ type: 'OVERWRITE_DATABASE', payload: data });

    // New Actions
    const addCapability = (name) => dispatch({ type: 'ADD_CAPABILITY', payload: name });
    const deleteCapability = (name) => dispatch({ type: 'DELETE_CAPABILITY', payload: name });
    const addEquipment = (data) => dispatch({ type: 'ADD_EQUIPMENT', payload: data });
    const updateEquipment = (id, updates) => dispatch({ type: 'UPDATE_EQUIPMENT', payload: { id, updates } });
    const deleteEquipment = (id) => dispatch({ type: 'DELETE_EQUIPMENT', payload: id });

    // Clear all data and reset to defaults
    const clearAllData = () => {
        if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
            window.location.reload();
        }
    };

    return (
        <LabContext.Provider value={{
            state,
            registerMaster,
            bulkImportMaster,
            addSchedule,
            updateMaster,
            updateSchedule,
            createAbnormality,
            updateAbnormality,
            createTroubleshootingCase,
            updateTroubleshootingCase,
            overwriteDatabase,
            clearAllData,
            // Exposed new functions
            addCapability,
            deleteCapability,
            addEquipment,
            updateEquipment,
            deleteEquipment
        }}>
            {children}
        </LabContext.Provider>
    );


}

export function useLab() {
    const context = useContext(LabContext);
    if (!context) {
        throw new Error('useLab must be used within a LabProvider');
    }
    return context;
}
