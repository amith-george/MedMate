/**
 * Compares schedules against logs to find missed doses for TODAY.
 * Returns an array of dose objects for the popup queue.
 */
export function getPendingDoses(schedules, recentLogs) {
  const pendingDoses = [];
  const now = new Date();

  schedules.forEach((schedule) => {
    if (!schedule.isActive) return;

    let targetTimes = []; // We will fill this with Date objects for all of TODAY's doses

    // ---------------------------------------------------------
    // STRATEGY 1: INTERVAL MEDICINES (Dynamic Calculation)
    // ---------------------------------------------------------
    if (schedule.frequency === 'interval' && schedule.intervalHours && schedule.startDate) {
      
      const startOfDay = new Date(); 
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(); 
      endOfDay.setHours(23, 59, 59, 999);
      
      const intervalMs = schedule.intervalHours * 60 * 60 * 1000;
      let pointer = new Date(schedule.startDate);

      // 1. Fast forward the pointer from StartDate until we reach Today
      // (This handles the "drift" across days)
      while (pointer < startOfDay) {
        pointer = new Date(pointer.getTime() + intervalMs);
      }

      // 2. Collect all slots that fall within Today
      while (pointer <= endOfDay) {
        // Stop if we exceed the schedule's end date (if it exists)
        if (schedule.endDate && pointer > new Date(schedule.endDate)) break;
        
        targetTimes.push(new Date(pointer)); // Add copy of date
        
        // Move to next interval
        pointer = new Date(pointer.getTime() + intervalMs);
      }
    } 
    
    // ---------------------------------------------------------
    // STRATEGY 2: FIXED DAILY / WEEKLY SCHEDULES
    // ---------------------------------------------------------
    else {
      const todayStr = now.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue"...
      
      const isDueToday = 
        schedule.frequency === 'daily' || 
        (schedule.frequency === 'weekly' && schedule.daysOfWeek.includes(todayStr));

      if (isDueToday) {
        schedule.times.forEach((timeStr) => {
          // Parse "08:00" into a Today Date Object
          const [hours, minutes] = timeStr.split(':').map(Number);
          const t = new Date();
          t.setHours(hours, minutes, 0, 0);
          targetTimes.push(t);
        });
      }
    }

    // ---------------------------------------------------------
    // CHECK LOGS: Compare "Target Times" vs "Actual Logs"
    // ---------------------------------------------------------
    targetTimes.forEach((scheduledDate) => {
      
      // Condition A: Time must be in the PAST (and within last 24h)
      // We add a 2-minute buffer so it doesn't pop up the exact second it's due
      if (scheduledDate < now && (now - scheduledDate) > 2 * 60 * 1000) {
        
        // Condition B: Does a Log ALREADY EXIST for this specific time?
        const logExists = recentLogs.some((log) => {
          const logDate = new Date(log.scheduledTime);
          
          // Compare Medicine ID (Handle populated object vs string ID)
          const logMedId = log.medicine._id || log.medicine;
          const schedMedId = schedule.medicine._id || schedule.medicine;
          
          const sameMed = logMedId === schedMedId;
          
          // Compare Time (Allow 1 minute tolerance for slight DB shifts)
          const sameTime = Math.abs(logDate - scheduledDate) < 60000; 
          
          return sameMed && sameTime;
        });

        // Condition C: If NO log exists, it is PENDING
        if (!logExists) {
          pendingDoses.push({
            medicineId: schedule.medicine._id || schedule.medicine,
            medicineName: schedule.medicine.name || 'Medicine',
            scheduledTime: scheduledDate.toISOString(), // ISO for DB
            displayTime: scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawDate: scheduledDate // For sorting
          });
        }
      }
    });
  });

  // Sort by time so the earliest missed dose shows up first
  return pendingDoses.sort((a, b) => a.rawDate - b.rawDate);
}