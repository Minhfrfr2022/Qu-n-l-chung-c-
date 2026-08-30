#!/usr/bin/env node

/**
 * Test script for Bill Configuration Setup Feature
 * Tests the ability to create, retrieve, update, publish bill configurations
 * and verify notifications are sent to all clients
 */

const API_BASE = 'http://localhost:3001/api';

// Test data
let testConfigId = null;
let authToken = null;

const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  console.log(`${colors[type] || colors.info}[${type.toUpperCase()}]${colors.reset} ${message}`);
};

const testCreateConfiguration = async () => {
  log('Testing: Create Bill Configuration', 'info');
  
  const payload = {
    period: '2025-01',
    services: [
      {
        name: 'Điện',
        unit_cost: 3500,
        number_of_units: 100,
        unit: 'kWh'
      },
      {
        name: 'Nước',
        unit_cost: 8000,
        number_of_units: 50,
        unit: 'm³'
      },
      {
        name: 'Vệ sinh',
        unit_cost: 50000,
        number_of_units: 1,
        unit: 'căn'
      }
    ]
  };

  try {
    const response = await fetch(`${API_BASE}/bills/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      testConfigId = data.data.id;
      log(`✓ Configuration created successfully`, 'success');
      log(`  ID: ${testConfigId}`, 'success');
      log(`  Period: ${data.data.period}`, 'success');
      log(`  Status: ${data.data.status}`, 'success');
      log(`  Services: ${data.data.services.length}`, 'success');
      return true;
    } else {
      log(`✗ Failed to create configuration: ${data.message}`, 'error');
      return false;
    }
  } catch (err) {
    log(`✗ Error: ${err.message}`, 'error');
    return false;
  }
};

const testGetAllConfigurations = async () => {
  log('Testing: Get All Bill Configurations', 'info');

  try {
    const response = await fetch(`${API_BASE}/bills/configs`);
    const data = await response.json();

    if (response.ok) {
      log(`✓ Retrieved ${data.data.length} configuration(s)`, 'success');
      data.data.forEach((config, idx) => {
        log(`  ${idx + 1}. Period: ${config.period}, Status: ${config.status}, Services: ${config.services.length}`, 'success');
      });
      return true;
    } else {
      log(`✗ Failed to get configurations: ${data.message}`, 'error');
      return false;
    }
  } catch (err) {
    log(`✗ Error: ${err.message}`, 'error');
    return false;
  }
};

const testGetConfiguration = async () => {
  if (!testConfigId) {
    log('Skipping: Get Configuration (no config ID)', 'warning');
    return true;
  }

  log('Testing: Get Specific Configuration', 'info');

  try {
    const response = await fetch(`${API_BASE}/bills/config/${testConfigId}`);
    const data = await response.json();

    if (response.ok) {
      const total = data.data.services.reduce((sum, s) => sum + (s.unit_cost * s.number_of_units), 0);
      log(`✓ Retrieved configuration`, 'success');
      log(`  Period: ${data.data.period}`, 'success');
      log(`  Status: ${data.data.status}`, 'success');
      log(`  Total Amount: ${total.toLocaleString('vi-VN')}đ`, 'success');
      return true;
    } else {
      log(`✗ Failed to get configuration: ${data.message}`, 'error');
      return false;
    }
  } catch (err) {
    log(`✗ Error: ${err.message}`, 'error');
    return false;
  }
};

const testUpdateConfiguration = async () => {
  if (!testConfigId) {
    log('Skipping: Update Configuration (no config ID)', 'warning');
    return true;
  }

  log('Testing: Update Bill Configuration', 'info');

  const payload = {
    period: '2025-01',
    services: [
      {
        name: 'Điện',
        unit_cost: 3500,
        number_of_units: 120, // Changed from 100
        unit: 'kWh'
      },
      {
        name: 'Nước',
        unit_cost: 8000,
        number_of_units: 50,
        unit: 'm³'
      }
    ]
  };

  try {
    const response = await fetch(`${API_BASE}/bills/config/${testConfigId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      log(`✓ Configuration updated successfully`, 'success');
      log(`  Services updated to: ${data.data.services.length}`, 'success');
      return true;
    } else {
      log(`✗ Failed to update configuration: ${data.message}`, 'error');
      return false;
    }
  } catch (err) {
    log(`✗ Error: ${err.message}`, 'error');
    return false;
  }
};

const testPublishConfiguration = async () => {
  if (!testConfigId) {
    log('Skipping: Publish Configuration (no config ID)', 'warning');
    return true;
  }

  log('Testing: Publish Configuration and Notify Clients', 'info');

  const payload = {
    configId: testConfigId
  };

  try {
    const response = await fetch(`${API_BASE}/bills/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      log(`✓ Configuration published successfully`, 'success');
      log(`  Status: ${data.data.status}`, 'success');
      log(`  Total Amount: ${data.totalAmount.toLocaleString('vi-VN')}đ`, 'success');
      log(`  Clients Notified: ${data.clientsNotified}`, 'success');
      return true;
    } else {
      log(`✗ Failed to publish configuration: ${data.message}`, 'error');
      return false;
    }
  } catch (err) {
    log(`✗ Error: ${err.message}`, 'error');
    return false;
  }
};

const runTests = async () => {
  log('='.repeat(60), 'info');
  log('Bill Configuration Setup Feature - Test Suite', 'info');
  log('='.repeat(60), 'info');

  log('\nNote: This test requires a valid auth token.', 'warning');
  log('Set the AUTH_TOKEN environment variable or update authToken in this file.\n', 'warning');

  // Check for auth token
  authToken = process.env.AUTH_TOKEN;
  if (!authToken) {
    log('No auth token provided. Tests will fail without authentication.', 'warning');
    log('Usage: AUTH_TOKEN=your_token node test-bill-setup.js', 'warning');
    return;
  }

  const results = [];

  // Run tests
  results.push({ test: 'Create Configuration', passed: await testCreateConfiguration() });
  log('');
  
  results.push({ test: 'Get All Configurations', passed: await testGetAllConfigurations() });
  log('');
  
  results.push({ test: 'Get Specific Configuration', passed: await testGetConfiguration() });
  log('');
  
  results.push({ test: 'Update Configuration', passed: await testUpdateConfiguration() });
  log('');
  
  results.push({ test: 'Publish Configuration', passed: await testPublishConfiguration() });
  log('');

  // Summary
  log('='.repeat(60), 'info');
  log('Test Summary', 'info');
  log('='.repeat(60), 'info');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(r => {
    const status = r.passed ? '✓' : '✗';
    const color = r.passed ? 'success' : 'error';
    log(`${status} ${r.test}`, color);
  });

  log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'success' : 'warning');
  
  if (passed === total) {
    log('\n🎉 All tests passed!', 'success');
  } else {
    log('\n⚠️  Some tests failed. Check the output above.', 'error');
  }
};

// Run tests
runTests().catch(err => log(`Fatal error: ${err.message}`, 'error'));
