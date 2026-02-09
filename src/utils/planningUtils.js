
/**
 * Calculates the next due date based on history or reference date.
 * Priority: 
 * 1. Calculate from latest entry in history (dbPMCALlist) matching MasterID
 * 2. If no history, use LastDoneDate/NextDueDate from Master
 * @param {object} masterItem - The master item object (containing Frequency, NextDueDate/LastDoneDate).
 * @param {Array} historyList - The list of completed PM/CAL actions (dbPMCALlist).
 * @returns {Date} The calculated next due date object.
 */
export const calculateNextDueDate = (masterItem, historyList = []) => {
    if (!masterItem) return null;

    const freqMatch = String(masterItem.Frequency).match(/(\d+)/);
    const frequencyMonths = freqMatch ? parseInt(freqMatch[0], 10) : 0;

    // 1. Check History for latest "Completed" entry
    if (historyList && historyList.length > 0) {
        // Find items matching this MasterID (or Equipment + Action)
        const relevantHistory = historyList.filter(h =>
            (h.MasterID === masterItem.id) ||
            (h.EquipmentCode === masterItem.EquipmentCode && h.Action === masterItem.Action)
        );

        if (relevantHistory.length > 0) {
            // Sort by CompletedDate descending
            relevantHistory.sort((a, b) => new Date(b.CompletedDate) - new Date(a.CompletedDate));
            const lastCompleted = relevantHistory[0];

            if (lastCompleted.CompletedDate) {
                const date = new Date(lastCompleted.CompletedDate);
                date.setMonth(date.getMonth() + frequencyMonths);
                return date;
            }
        }
    }

    // 2. Fallback: Use manual NextDueDate / LastDoneDate
    // Supports both 'NextDueDate' (Start Plan) and legacy 'LastDoneDate'
    let referenceDate = null;
    let addFrequency = false;

    if (masterItem.NextDueDate) {
        referenceDate = new Date(masterItem.NextDueDate);
        // If it's NextDueDate, we don't add frequency, we just return it (it IS the due date)
        return referenceDate;
    } else if (masterItem.LastDoneDate) {
        referenceDate = new Date(masterItem.LastDoneDate);
        addFrequency = true;
    }

    if (referenceDate) {
        if (addFrequency) {
            referenceDate.setMonth(referenceDate.getMonth() + frequencyMonths);
        }
        return referenceDate;
    }

    return null;
};

/**
 * Calculates all expected due dates within a specific target year.
 * @param {object} masterItem - The master item.
 * @param {Array} historyList - History of completed items.
 * @param {number} targetYear - The year to plan for.
 * @returns {Array<Date>} List of expected due dates in that year.
 */
export const getDueDatesInYear = (masterItem, historyList, targetYear) => {
    if (!masterItem) return [];

    // 1. Determine "Base Date" (The last completed date, or the Start Plan date)
    let baseDate = null;
    // Robust parsing: extract first number from string (e.g., "6 months" -> 6)
    const freqMatch = String(masterItem.Frequency).match(/(\d+)/);
    const frequencyMonths = freqMatch ? parseInt(freqMatch[0], 10) : 0;

    if (frequencyMonths <= 0) return []; // Invalid frequency

    // Check history first
    if (historyList && historyList.length > 0) {
        const relevantHistory = historyList.filter(h =>
            (h.MasterID === masterItem.id) ||
            (h.EquipmentCode === masterItem.EquipmentCode && h.Action === masterItem.Action)
        );
        if (relevantHistory.length > 0) {
            relevantHistory.sort((a, b) => new Date(b.CompletedDate) - new Date(a.CompletedDate));
            const lastCompleted = relevantHistory[0];
            if (lastCompleted.CompletedDate) {
                baseDate = new Date(lastCompleted.CompletedDate);
                // For history, the NEXT due date is Last + Freq
                baseDate.setMonth(baseDate.getMonth() + frequencyMonths);
            }
        }
    }

    // Fallback to Master data if no history
    if (!baseDate) {
        if (masterItem.NextDueDate) {
            baseDate = new Date(masterItem.NextDueDate);
            // If NextDueDate is set, that IS the first due date.
        } else if (masterItem.LastDoneDate) {
            baseDate = new Date(masterItem.LastDoneDate);
            // If LastDoneDate is set, add Freq
            baseDate.setMonth(baseDate.getMonth() + frequencyMonths);
        }
    }

    if (!baseDate) return []; // Cannot calculate if no reference date

    // BACKTRACK LOGIC: 
    // If the baseDate is already inside the Target Year (or later), we might miss previous cycles that belong to this year.
    // We backtrack until baseDate is BEFORE the start of Target Year.
    // This ensures we capture ALL cycles that fall within Target Year.
    const startOfTargetYear = new Date(targetYear, 0, 1);
    while (baseDate >= startOfTargetYear) {
        baseDate.setMonth(baseDate.getMonth() - frequencyMonths);
    }
    // Now baseDate is in (TargetYear-1) or earlier.
    // We advance ONCE to get the first potential candidate.
    baseDate.setMonth(baseDate.getMonth() + frequencyMonths);

    if (!baseDate) return []; // Cannot calculate if no reference date

    const dueDates = [];
    let currentDate = new Date(baseDate);

    // Limit loop to prevent infinite hangs (e.g. wrong freq)
    let loopCount = 0;
    const maxProjectedYear = targetYear + 10; // Only look 10 years ahead max

    while (loopCount < 200) {
        const currentYear = currentDate.getFullYear();

        // Optimization: If current date is way past target, stop
        if (currentYear > targetYear) {
            break;
        }

        // If it matches target year, add it
        if (currentYear === targetYear) {
            dueDates.push(new Date(currentDate));
        }

        // Advance to next period
        currentDate.setMonth(currentDate.getMonth() + frequencyMonths);
        loopCount++;

        // Safety break
        if (currentDate.getFullYear() > maxProjectedYear) break;
    }

    return dueDates;
};

/**
 * Formats a date object to a readable string (e.g., "15 Jan 2026").
 * @param {Date} date - The date object.
 * @returns {string} Formatted date string.
 */
export const formatDateDisplay = (date) => {
    if (!date) return '-';
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

/**
 * Checks if a plan is due in a specific year.
 * @param {Date} nextDueDate - The calculated due date.
 * @param {number} targetYear - The year to check against.
 * @returns {boolean} True if due in that year.
 */
export const isDueInYear = (nextDueDate, targetYear) => {
    if (!nextDueDate) return false;
    return nextDueDate.getFullYear() === targetYear;
};
