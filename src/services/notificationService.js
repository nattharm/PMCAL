/**
 * Notification Service for PM/CAL Workflow
 * Currently implements simulated email sending.
 */

// Placeholder mapping - User to provide actual emails
export const CAPABILITY_LEADER_MAPPING = {
    'Microstructure': 'leader.micro@example.com',
    'Rheology': 'leader.rheo@example.com',
    'Imaging': 'leader.imaging@example.com',
    'Small molecules': 'leader.smallmol@example.com',
    'Mesostructure': 'leader.meso@example.com',
    'Manufacturing': 'leader.manuf@example.com',
    'Environmental Testing': 'leader.env@example.com',
    'Chemical Testing': 'leader.chem@example.com',
    'Weighing': 'leader.weigh@example.com',
    'Temperature Control': 'leader.temp@example.com',
    'Measurement Devices': 'leader.measure@example.com',
    'Pressure Measurement': 'leader.pressure@example.com',
    'Vacuum Systems': 'leader.vacuum@example.com',
    'Sample Preparation': 'leader.sample@example.com',
    'Safety Equipment': 'leader.safety@example.com',
    'Storage': 'leader.storage@example.com',
    'Film Testing': 'leader.film@example.com',
    'Weathering': 'leader.weather@example.com',
    'Particle Analysis': 'leader.particle@example.com',
    'Colorimetry': 'leader.color@example.com'
};

/**
 * Sends a notification for PM/CAL task completion or postponement.
 * @param { 'complete' | 'postpone' } type 
 * @param { Object } item - The PM/CAL task item
 * @param { Object } details - Additional details (Remark, Reason, etc.)
 */
export const sendPMNotification = async (type, item, details) => {
    const leaderEmail = CAPABILITY_LEADER_MAPPING[item.Capability] || 'admin@example.com';
    const timestamp = new Date().toLocaleString();

    console.group(`%c [NOTIFICATION] PM/CAL ${type.toUpperCase()} `, 'background: #0d9488; color: #fff; padding: 2px 5px; border-radius: 3px;');
    console.log(`To: ${leaderEmail}`);
    console.log(`Subject: [PM/CAL Notification] ${item.EquipmentName} - ${type === 'complete' ? 'Job Completed' : 'Plan Postponed'}`);
    console.log(`Time: ${timestamp}`);
    console.log('--- Content ---');

    if (type === 'complete') {
        console.log(`Equipment: ${item.EquipmentName} (${item.EquipmentCode})`);
        console.log(`Capability: ${item.Capability}`);
        console.log(`Due Date: ${item.DueDate}`);
        console.log(`Completed Date: ${details.CompleteDate}`);
        console.log(`Status: ${details.DetailsOfComplete}`);
        if (details.Remark) console.log(`Remark: ${details.Remark}`);
        if (details.isLate) console.log(`%c [ALERT] Late Completion Detected! Needs Approval. `, 'color: #ea580c; font-weight: bold;');
    } else {
        console.log(`Equipment: ${item.EquipmentName} (${item.EquipmentCode})`);
        console.log(`Capability: ${item.Capability}`);
        console.log(`Original Due Date: ${item.PostponedFrom}`);
        console.log(`Requested New Due Date: ${item.DueDate}`);
        console.log(`Reason: ${details.Reason}`);
        console.log(`%c [ACTION] Waiting for Leader Approval. `, 'color: #2563eb; font-weight: bold;');
    }

    console.groupEnd();

    // In the future, this will use EmailJS, Resend, or a Backend API
    // return await axios.post('/api/notify', { ... });

    return { success: true, message: 'Simulated email sent' };
};
