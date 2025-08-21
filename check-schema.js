// Check actual database schema
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ixgldvhxzcqlkxhjwupb.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDExNDg5NywiZXhwIjoyMDY5NjkwODk3fQ.kg9EJ_bqh2eG3XFCjM3M_OF3z3iRBXcQnnDPEuGYk0M'

async function checkSchema() {
  console.log('Checking database schema...')
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Check if breakdown_reports table exists and get its structure
    console.log('\n1. Checking breakdown_reports table...')
    const { data: breakdowns, error: breakdownError } = await supabase
      .from('breakdown_reports')
      .select('*')
      .limit(1)
    
    if (breakdownError) {
      console.log('❌ breakdown_reports table error:', breakdownError.message)
      
      // Maybe it's called something else? Let's check for any table with 'breakdown' in name
      console.log('\n   Checking for tables with "breakdown" in name...')
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables') // This might not work, let's try another approach
        
    } else {
      console.log('✅ breakdown_reports table exists')
      if (breakdowns && breakdowns.length > 0) {
        console.log('📋 Table columns:', Object.keys(breakdowns[0]))
      } else {
        console.log('📋 Table is empty')
      }
    }

    // Check equipment_info table
    console.log('\n2. Checking equipment_info table...')
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment_info')
      .select('*')
      .limit(1)
    
    if (equipmentError) {
      console.log('❌ equipment_info table error:', equipmentError.message)
    } else {
      console.log('✅ equipment_info table exists')
      if (equipment && equipment.length > 0) {
        console.log('📋 Table columns:', Object.keys(equipment[0]))
      }
    }

    // Check equipment_status table
    console.log('\n3. Checking equipment_status table...')
    const { data: status, error: statusError } = await supabase
      .from('equipment_status')
      .select('*')
      .limit(1)
    
    if (statusError) {
      console.log('❌ equipment_status table error:', statusError.message)
    } else {
      console.log('✅ equipment_status table exists')
      if (status && status.length > 0) {
        console.log('📋 Table columns:', Object.keys(status[0]))
      }
    }

    // Let's also try to find any breakdown-related data in other possible table names
    console.log('\n4. Looking for breakdown data in alternative tables...')
    const possibleTableNames = [
      'breakdown_report', 
      'breakdowns', 
      'failure_reports', 
      'maintenance_reports',
      'repair_reports'
    ]
    
    for (const tableName of possibleTableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error && data) {
          console.log(`✅ Found table: ${tableName}`)
          if (data.length > 0) {
            console.log(`📋 ${tableName} columns:`, Object.keys(data[0]))
          }
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }

    // Check current status counts to verify our understanding
    console.log('\n5. Current status distribution:')
    const { data: allStatuses } = await supabase
      .from('equipment_status')
      .select('status')
    
    const statusCounts = allStatuses?.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {}) || {}
    
    console.log('📊 Status counts:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`)
    })

  } catch (error) {
    console.error('❌ Schema check failed:', error.message)
  }
}

checkSchema().then(() => {
  console.log('\n✅ Schema check completed!')
}).catch(error => {
  console.error('❌ Schema check error:', error)
})