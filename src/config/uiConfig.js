export const uiConfig = {
    // Zoom level for the table on mobile devices (0.0 to 1.0)
    // 0.9 = 90% size, allowing more columns to fit
    mobileTableZoom: 0.70,
    // Zoom level for the table on desktop devices (0.0 to 1.0)
    desktopTableZoom: 1.0,

    // Default Column Orders (IDs must match column IDs)
    // Applied ONLY if the user has no saved preference
    defaultDesktopColumnOrder: ['selection', 'audio', 'japanese', 'bangla', 'isMarked'],
    defaultMobileColumnOrder: ['selection', 'audio', 'japanese', 'bangla', 'isMarked']
};
