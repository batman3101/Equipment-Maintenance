// Quick test script to verify API endpoints are working
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixgldvhxzcqlkxhjwupb.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTQ4OTcsImV4cCI6MjA2OTY5MDg5N30.4FGpWF7fJR9rFhJjBdXz_RYQMpq3JQCIQJKWo6ym4c4'

async function testSync() {
  console.log('Testing data synchronization fix...')
  
  try {
    // Test 1: Check if breakdown reports API endpoint works
    console.log('\n1. Testing breakdown reports API...')
    const breakdownResponse = await fetch('http://localhost:3004/api/breakdown-reports')
    console.log('Breakdown API status:', breakdownResponse.status)
    
    if (breakdownResponse.ok) {
      const breakdownData = await breakdownResponse.json()
      console.log('Breakdown reports count:', breakdownData.data?.length || 0)
      console.log('API response success:', breakdownData.success)
    } else {
      console.log('Breakdown API failed:', await breakdownResponse.text())
    }

    // Test 2: Check equipment status API
    console.log('\n2. Testing equipment status API...')
    const statusResponse = await fetch('http://localhost:3004/api/equipment/bulk-status')
    console.log('Status API status:', statusResponse.status)
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json()
      console.log('Equipment statuses count:', statusData.data?.length || 0)
      console.log('API response success:', statusData.success)
    } else {
      console.log('Status API failed:', await statusResponse.text())
    }

    // Test 3: Direct Supabase query to check actual data
    console.log('\n3. Testing direct database queries...')
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Check breakdown reports in database
    const { data: breakdowns, error: breakdownError } = await supabase
      .from('breakdown_reports')
      .select('id, equipment_number, status, urgency_level')
    
    if (breakdownError) {
      console.log('Database breakdown query error:', breakdownError.message)
    } else {
      console.log('Database breakdown reports count:', breakdowns?.length || 0)
      console.log('Active breakdowns:', breakdowns?.filter(b => ['reported', 'assigned', 'in_progress'].includes(b.status)).length || 0)
    }

    // Check equipment status in database  
    const { data: statuses, error: statusError } = await supabase
      .from('equipment_status')
      .select('equipment_id, status')
    
    if (statusError) {
      console.log('Database status query error:', statusError.message)
    } else {
      console.log('Database equipment statuses count:', statuses?.length || 0)
      const statusCounts = statuses?.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1
        return acc
      }, {}) || {}
      console.log('Status breakdown:', statusCounts)
    }

    // Test 4: Force sync API
    console.log('\n4. Testing force sync API...')
    const syncResponse = await fetch('http://localhost:3004/api/sync/force-refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('Sync API status:', syncResponse.status)
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json()
      console.log('Sync success:', syncData.success)
      if (syncData.inconsistencies && syncData.inconsistencies.length > 0) {
        console.log('Data inconsistencies found:', syncData.inconsistencies)
      } else {
        console.log('No data inconsistencies found')
      }
    } else {
      console.log('Sync API failed:', await syncResponse.text())
    }

  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

testSync().then(() => {
  console.log('\nTest completed!')
  process.exit(0)
}).catch(error => {
  console.error('Test error:', error)
  process.exit(1)
})