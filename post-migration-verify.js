const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function postMigrationVerification() {
  console.log('🔍 Post-Migration Verification Report')
  console.log('=====================================\n')
  
  let allChecks = []
  
  try {
    // 1. Core Tables Check
    console.log('📋 Core Tables Status:')
    const coreTables = [
      'profiles', 'equipment_info', 'equipment_status', 
      'breakdown_reports', 'repair_reports', 'system_settings'
    ]
    
    for (const table of coreTables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        console.log(`   ✅ ${table}: ${count} records`)
        allChecks.push(`${table}: OK`)
      } catch (err) {
        console.log(`   ❌ ${table}: Error`)
        allChecks.push(`${table}: ERROR`)
      }
    }
    
    // 2. New Tables Check
    console.log('\n🆕 New Tables Status:')
    const newTables = [
      'status_transition_log', 'system_status_definitions', 'system_notifications'
    ]
    
    for (const table of newTables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        console.log(`   ✅ ${table}: ${count || 0} records`)
        allChecks.push(`${table}: OK`)
      } catch (err) {
        console.log(`   ❌ ${table}: Not found`)
        allChecks.push(`${table}: MISSING`)
      }
    }
    
    // 3. Status Definitions Check
    console.log('\n📊 Status System Verification:')
    try {
      const { data: statusDefs, error } = await supabase
        .from('system_status_definitions')
        .select('status_group, count(*)')
        .group('status_group')
      
      if (error) throw error
      
      console.log('   Status definitions by group:')
      statusDefs.forEach(group => {
        console.log(`   - ${group.status_group}: ${group.count} statuses`)
      })
      allChecks.push('Status System: OK')
    } catch (err) {
      console.log('   ❌ Status system not configured')
      allChecks.push('Status System: ERROR')
    }
    
    // 4. Views Check
    console.log('\n👁️ Views Status:')
    const views = [
      'v_equipment_status_summary', 'v_dashboard_summary', 'v_repair_with_equipment'
    ]
    
    for (const view of views) {
      try {
        const { count } = await supabase
          .from(view)
          .select('*', { count: 'exact', head: true })
        console.log(`   ✅ ${view}: ${count || 0} records`)
        allChecks.push(`${view}: OK`)
      } catch (err) {
        console.log(`   ❌ ${view}: Not available`)
        allChecks.push(`${view}: ERROR`)
      }
    }
    
    // 5. Functions Check
    console.log('\n🔧 Functions Status:')
    try {
      const { data, error } = await supabase
        .rpc('validate_equipment_status_consistency')
      
      if (error) throw error
      
      console.log(`   ✅ Data consistency validation: ${data.length} issues found`)
      if (data.length > 0) {
        console.log('   ⚠️ Found data inconsistencies:')
        data.slice(0, 3).forEach(issue => {
          console.log(`     - ${issue.equipment_name}: ${issue.details}`)
        })
      }
      allChecks.push('Functions: OK')
    } catch (err) {
      console.log('   ❌ Functions not available')
      allChecks.push('Functions: ERROR')
    }
    
    // 6. New Columns Check
    console.log('\n🆕 New Columns Verification:')
    try {
      // Check equipment_info new columns
      const { data: equipment } = await supabase
        .from('equipment_info')
        .select('asset_tag, serial_number, custom_fields, equipment_tags')
        .limit(1)
      
      if (equipment && equipment.length > 0) {
        console.log('   ✅ equipment_info: New columns available')
        allChecks.push('equipment_info columns: OK')
      }
    } catch (err) {
      console.log('   ❌ equipment_info: New columns missing')
      allChecks.push('equipment_info columns: ERROR')
    }
    
    try {
      // Check breakdown_reports new columns
      const { data: breakdown } = await supabase
        .from('breakdown_reports')
        .select('unified_status, is_emergency, impact_level')
        .limit(1)
      
      if (breakdown !== null) {
        console.log('   ✅ breakdown_reports: New columns available')
        allChecks.push('breakdown_reports columns: OK')
      }
    } catch (err) {
      console.log('   ❌ breakdown_reports: New columns missing')
      allChecks.push('breakdown_reports columns: ERROR')
    }
    
    // 7. Dashboard Summary
    console.log('\n📊 System Overview:')
    try {
      const { data: summary } = await supabase
        .from('v_dashboard_summary')
        .select('*')
        .single()
      
      if (summary) {
        console.log(`   Total Equipment: ${summary.total_equipment}`)
        console.log(`   Running: ${summary.running_equipment}`)
        console.log(`   Breakdown: ${summary.breakdown_equipment}`)
        console.log(`   Active Breakdowns: ${summary.active_breakdowns}`)
        console.log(`   Emergency Cases: ${summary.emergency_breakdowns}`)
        allChecks.push('Dashboard: OK')
      }
    } catch (err) {
      console.log('   ❌ Dashboard not available')
      allChecks.push('Dashboard: ERROR')
    }
    
    // Final Report
    console.log('\n🎯 Migration Status Summary:')
    console.log('=====================================')
    
    const errorChecks = allChecks.filter(check => check.includes('ERROR') || check.includes('MISSING'))
    const successChecks = allChecks.filter(check => check.includes('OK'))
    
    console.log(`✅ Successful: ${successChecks.length}`)
    console.log(`❌ Failed: ${errorChecks.length}`)
    
    if (errorChecks.length === 0) {
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!')
      console.log('✅ All systems are operational')
      console.log('✅ Core features are ready for use')
      console.log('✅ Optimized schema is active')
    } else {
      console.log('\n⚠️ MIGRATION INCOMPLETE')
      console.log('❌ The following items need attention:')
      errorChecks.forEach(check => console.log(`   - ${check}`))
      console.log('\n📋 Next Steps:')
      console.log('1. Execute final-migration.sql in Supabase SQL Editor')
      console.log('2. Run this verification script again')
    }
    
  } catch (err) {
    console.error('❌ Verification failed:', err.message)
  }
}

postMigrationVerification()