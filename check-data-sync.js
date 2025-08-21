// Simple data sync check
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ixgldvhxzcqlkxhjwupb.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDExNDg5NywiZXhwIjoyMDY5NjkwODk3fQ.kg9EJ_bqh2eG3XFCjM3M_OF3z3iRBXcQnnDPEuGYk0M'

async function checkDataSyncIssue() {
  console.log('Checking data synchronization issue...')
  
  try {
    // Use service role for direct access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // 1. Check breakdown reports
    console.log('\n1. Checking breakdown reports...')
    const { data: breakdowns, error: breakdownError } = await supabase
      .from('breakdown_reports')
      .select('id, equipment_id, equipment_number, status, urgency_level, created_at')
      .order('created_at', { ascending: false })
    
    if (breakdownError) {
      console.log('❌ Breakdown query error:', breakdownError.message)
    } else {
      console.log(`✅ Found ${breakdowns?.length || 0} breakdown reports`)
      
      const activeBreakdowns = breakdowns?.filter(b => 
        ['reported', 'assigned', 'in_progress'].includes(b.status)
      ) || []
      
      console.log(`📊 Active breakdowns: ${activeBreakdowns.length}`)
      if (activeBreakdowns.length > 0) {
        activeBreakdowns.forEach(breakdown => {
          console.log(`   - ${breakdown.equipment_number}: ${breakdown.status} (${breakdown.urgency_level})`)
        })
      }
    }

    // 2. Check equipment status
    console.log('\n2. Checking equipment status...')
    const { data: statuses, error: statusError } = await supabase
      .from('equipment_status')
      .select('equipment_id, status, status_changed_at')
      .order('status_changed_at', { ascending: false })
    
    if (statusError) {
      console.log('❌ Status query error:', statusError.message)
    } else {
      console.log(`✅ Found ${statuses?.length || 0} equipment statuses`)
      
      const statusCounts = statuses?.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1
        return acc
      }, {}) || {}
      
      console.log('📊 Status breakdown:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`)
      })
    }

    // 3. Check for synchronization issues
    console.log('\n3. Checking for synchronization issues...')
    
    if (breakdowns && statuses) {
      // Get equipment IDs with active breakdowns
      const activeBreakdownEquipmentIds = new Set(
        breakdowns
          .filter(b => ['reported', 'assigned', 'in_progress'].includes(b.status))
          .map(b => b.equipment_id)
      )
      
      // Get equipment IDs with running status
      const runningEquipmentIds = new Set(
        statuses
          .filter(s => s.status === 'running')
          .map(s => s.equipment_id)
      )
      
      // Find inconsistencies
      const inconsistentEquipments = Array.from(activeBreakdownEquipmentIds)
        .filter(id => runningEquipmentIds.has(id))
      
      if (inconsistentEquipments.length > 0) {
        console.log(`🚨 Found ${inconsistentEquipments.length} equipment(s) with status inconsistencies:`)
        
        for (const equipmentId of inconsistentEquipments) {
          const breakdown = breakdowns.find(b => b.equipment_id === equipmentId && 
            ['reported', 'assigned', 'in_progress'].includes(b.status))
          const status = statuses.find(s => s.equipment_id === equipmentId)
          
          console.log(`   - Equipment ${breakdown?.equipment_number || equipmentId}:`)
          console.log(`     * Has active breakdown: ${breakdown?.status}`)
          console.log(`     * Equipment status: ${status?.status}`)
          console.log(`     * This causes the dashboard to show incorrect counts!`)
        }
        
        console.log('\n💡 Solution: The API endpoints I created will fix this by:')
        console.log('   1. Automatically updating equipment status when breakdown reports are created/updated')
        console.log('   2. Providing proper data synchronization between breakdown reports and equipment status')
        console.log('   3. Ensuring the dashboard shows accurate status counts')
        
      } else {
        console.log('✅ No status inconsistencies found')
      }
    }

    // 4. Show the issue impact
    console.log('\n4. Impact on dashboard:')
    console.log('Current situation:')
    console.log(`   - Breakdown reports page shows: ${breakdowns?.filter(b => ['reported', 'assigned', 'in_progress'].includes(b.status)).length || 0} active reports`)
    console.log(`   - Equipment management page shows: ${statusCounts.breakdown || 0} equipment in breakdown status`)
    console.log(`   - Equipment management page shows: ${statusCounts.maintenance || 0} equipment under maintenance`)
    
    if ((breakdowns?.filter(b => ['reported', 'assigned', 'in_progress'].includes(b.status)).length || 0) > 
        (statusCounts.breakdown || 0)) {
      console.log('🚨 ISSUE CONFIRMED: Breakdown reports exist but equipment status is not synchronized!')
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkDataSyncIssue().then(() => {
  console.log('\n✅ Data sync check completed!')
}).catch(error => {
  console.error('❌ Check error:', error)
})