/**
 * Clear Browser LocalStorage Script
 * 
 * Run this in your browser console to clear all dashboard widget preferences
 * Or use this as a Node.js script to generate the console command
 */

// For browser console use:
const clearDashboardStorage = () => {
  const keys = Object.keys(localStorage);
  let clearedCount = 0;
  
  keys.forEach(key => {
    if (
      key.includes('widgets') || 
      key.includes('layout') || 
      key.includes('dashboard') ||
      key.includes('-widgets') ||
      key.includes('-layouts') ||
      key.includes('-layout')
    ) {
      localStorage.removeItem(key);
      clearedCount++;
      console.log('✓ Removed:', key);
    }
  });
  
  console.log(`\n✅ Cleared ${clearedCount} dashboard preference(s)!`);
  console.log('🔄 Please refresh the page to see welcome messages on all dashboards.');
  
  return clearedCount;
};

// Auto-run if in browser
if (typeof window !== 'undefined') {
  clearDashboardStorage();
} else {
  // For Node.js - output the command
  console.log('Copy and paste this into your browser console:');
  console.log('');
  console.log(clearDashboardStorage.toString());
  console.log('');
  console.log('clearDashboardStorage();');
}
