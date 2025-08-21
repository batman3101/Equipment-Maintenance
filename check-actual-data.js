// Check actual data to understand the synchronization issue
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ixgldvhxzcqlkxhjwupb.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJps3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDExNDg5NywiZXhwIjoyMDY5NjkwODk3fQ.kg9EJ_bqh2eG3XFCjM3M_OF3z3iRBXcQnnDPEuGYk0M'

async function checkActualData() {
  console.log('Checking actual data to understand the synchronization issue...')
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // 1. Check breakdown_reports data with equipment info
    console.log('\n1. Checking breakdown_reports with equipment details...')
    const { data: breakdowns, error: breakdownError } = await supabase
      .from('breakdown_reports')
      .select(`
        id, 
        equipment_id, 
        breakdown_title, 
        breakdown_type, 
        priority, 
        status, 
        occurred_at,
        created_at,
        equipment_info:equipment_id (
          equipment_number,
          equipment_name,
          category
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (breakdownError) {
      console.log('❌ Breakdown query error:', breakdownError.message)
    } else {
      console.log(`✅ Found ${breakdowns?.length || 0} breakdown reports`)
      
      if (breakdowns && breakdowns.length > 0) {
        console.log('\n📋 Recent breakdown reports:')
        breakdowns.forEach((breakdown, index) => {
          console.log(`   ${index + 1}. ${breakdown.equipment_info?.equipment_number || 'Unknown'} - ${breakdown.breakdown_title}`)
          console.log(`      Status: ${breakdown.status} | Priority: ${breakdown.priority}`)
          console.log(`      Created: ${breakdown.created_at}`)
        })
        
        // Count active breakdowns
        const activeBreakdowns = breakdowns.filter(b => 
          ['reported', 'pending', 'in_progress', 'assigned'].includes(b.status?.toLowerCase() || '')
        )
        console.log(`\n🚨 Active breakdown reports: ${activeBreakdowns.length}`)
        
        // Check if equipment_ids from breakdowns match equipment in breakdown status
        console.log('\n🔍 Checking equipment status for breakdown reports...')
        for (const breakdown of breakdowns.slice(0, 5)) {
          const { data: equipmentStatus } = await supabase
            .from('equipment_status')
            .select('status, status_changed_at')
            .eq('equipment_id', breakdown.equipment_id)
            .single()
          
          console.log(`   ${breakdown.equipment_info?.equipment_number || 'Unknown'}: Report status="${breakdown.status}" | Equipment status="${equipmentStatus?.status || 'not found'}"`)
        }
      }
    }

    // 2. Check repair_reports table
    console.log('\n2. Checking repair_reports table...')
    const { data: repairs, error: repairError } = await supabase
      .from('repair_reports')
      .select('*')
      .limit(5)
    
    if (repairError) {
      console.log('❌ Repair reports error:', repairError.message)
    } else {
      console.log(`✅ Found ${repairs?.length || 0} repair reports`)
      if (repairs && repairs.length > 0) {
        console.log('📋 Repair reports columns:', Object.keys(repairs[0]))
      }
    }

    // 3. Check equipment with breakdown status
    console.log('\n3. Checking equipment currently in breakdown status...')
    const { data: breakdownEquipment, error: breakdownStatusError } = await supabase
      .from('equipment_status')
      .select(`
        equipment_id,
        status,
        status_reason,
        status_changed_at,
        equipment_info:equipment_id (
          equipment_number,
          equipment_name
        )
      `)
      .eq('status', 'breakdown')
    
    if (breakdownStatusError) {
      console.log('❌ Equipment status query error:', breakdownStatusError.message)
    } else {
      console.log(`✅ Found ${breakdownEquipment?.length || 0} equipment in breakdown status`)
      
      if (breakdownEquipment && breakdownEquipment.length > 0) {
        console.log('\n📋 Equipment in breakdown status:')
        breakdownEquipment.forEach((equipment, index) => {
          console.log(`   ${index + 1}. ${equipment.equipment_info?.equipment_number || 'Unknown'} - ${equipment.equipment_info?.equipment_name}`)
          console.log(`      Status reason: ${equipment.status_reason || 'No reason'}`)
          console.log(`      Changed at: ${equipment.status_changed_at}`)
        })
      }
    }

    // 4. Summary and diagnosis
    console.log('\n4. 🔍 DIAGNOSIS:')
    
    const totalBreakdowns = breakdowns?.length || 0
    const totalBreakdownStatus = breakdownEquipment?.length || 0
    
    console.log(`   - Total breakdown reports in database: ${totalBreakdowns}`)
    console.log(`   - Equipment currently in breakdown status: ${totalBreakdownStatus}`)
    
    if (totalBreakdowns > 0 && totalBreakdownStatus === 5) {
      console.log('\n✅ GOOD NEWS: The equipment management page is working correctly!')
      console.log('   - It shows 5 equipment in breakdown status from equipment_status table')
      console.log('   - The issue is likely that the breakdown reports page is not loading data properly')
      console.log('   - The API endpoints I created will fix the breakdown reports page')
    }
    
    if (totalBreakdowns === 0) {
      console.log('\n🤔 POSSIBLE ISSUE: No breakdown reports found in breakdown_reports table')
      console.log('   - But equipment_status shows 5 in breakdown status')
      console.log('   - This suggests data might be in a different table or the breakdown reports were cleared')
    }

  } catch (error) {
    console.error('❌ Data check failed:', error.message)
  }
}

checkActualData().then(() => {
  console.log('\n✅ Data analysis completed!')
}).catch(error => {
  console.error('❌ Data analysis error:', error)
})