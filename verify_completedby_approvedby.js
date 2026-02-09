// Verification Script for CompletedBy and ApprovedBy in localStorage
// Run this in Browser Console (F12 -> Console)

console.log("=== Checking localStorage for CompletedBy and ApprovedBy ===\n");

// Get data from localStorage
const rawData = localStorage.getItem('atc_pmCalList');

if (!rawData) {
    console.error("❌ No data found in localStorage key 'atc_pmCalList'");
    console.log("Please complete at least one task first.");
} else {
    const pmCalList = JSON.parse(rawData);
    console.log(`✅ Found ${pmCalList.length} items in transaction database\n`);

    // Find completed items
    const completedItems = pmCalList.filter(item => item.Status === 'Completed');
    console.log(`📊 Completed items: ${completedItems.length}\n`);

    if (completedItems.length === 0) {
        console.log("⚠️ No completed items found. Please complete a task first to test.");
    } else {
        console.log("=== Checking CompletedBy and ApprovedBy fields ===\n");

        completedItems.forEach((item, index) => {
            console.log(`Item ${index + 1}: ${item.EquipmentName}`);
            console.log(`  - ID: ${item.id}`);
            console.log(`  - Status: ${item.Status}`);
            console.log(`  - CompleteDate: ${item.CompleteDate || 'N/A'}`);
            console.log(`  - CompletedBy: ${item.CompletedBy || '❌ MISSING'}`);
            console.log(`  - ApprovedBy: ${item.ApprovedBy || '❌ MISSING'}`);
            console.log(`  - LeaderApprove: ${item.LeaderApprove}`);
            console.log("");
        });

        // Summary
        const withCompletedBy = completedItems.filter(item => item.CompletedBy);
        const withApprovedBy = completedItems.filter(item => item.ApprovedBy);

        console.log("=== SUMMARY ===");
        console.log(`Items with CompletedBy: ${withCompletedBy.length}/${completedItems.length}`);
        console.log(`Items with ApprovedBy: ${withApprovedBy.length}/${completedItems.length}`);

        if (withCompletedBy.length === completedItems.length && withApprovedBy.length === completedItems.length) {
            console.log("\n✅ SUCCESS: All completed items have both CompletedBy and ApprovedBy fields!");
        } else {
            console.log("\n❌ ISSUE: Some items are missing CompletedBy or ApprovedBy fields");
            console.log("This might be old data from before these fields were added.");
        }
    }

    // Show one full example
    if (completedItems.length > 0) {
        console.log("\n=== FULL DATA EXAMPLE (First completed item) ===");
        console.log(JSON.stringify(completedItems[0], null, 2));
    }
}

console.log("\n=== End of verification ===");
