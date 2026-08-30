const { supabaseAdmin } = require('../config/supabase');

/**
 * Get all employees (Admin only)
 */
const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    // Use supabaseAdmin to bypass RLS and see all employees
    let query = supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (role && ['accountant', 'cashier', 'administrative'].includes(role)) {
      query = query.eq('role', role);
    }

    if (status && ['active', 'inactive'].includes(status)) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: employees, error, count } = await query;

    if (error) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }

    return res.status(200).json({
      employees,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all employees error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get employee by ID (Admin only)
 */
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.status(200).json({ employee });
  } catch (error) {
    console.error('Get employee by ID error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new employee (Admin only)
 */
const createEmployee = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      full_name, 
      phone,
      role,
      notes
    } = req.body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ 
        error: 'Email, password, full name, and role are required' 
      });
    }

    // Validate role
    if (!['accountant', 'cashier', 'administrative'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be accountant, cashier, or administrative' 
      });
    }

    // Check if email already exists in employees
    const { data: existingEmployee } = await supabaseAdmin
      .from('employees')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmployee) {
      return res.status(409).json({ error: 'Email already exists in employees' });
    }

    // Create user in Supabase Auth using Admin API
    // Set username from email
    const username = email.split('@')[0];
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name,
        role: 'manager', // Set profile role as manager for staff access
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return res.status(400).json({ 
        error: authError.message || 'Failed to create employee account' 
      });
    }

    const userId = authData.user.id;

    // Wait a moment for trigger to potentially create profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if profile was created by trigger
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // If profile wasn't created by trigger, create it manually
    if (!profile) {
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          username,
          full_name,
          email,
          role: 'manager', // Manager role in profiles for system access
          apartment_number: null
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Delete the auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return res.status(500).json({ 
          error: 'Failed to create user profile' 
        });
      }
      profile = newProfile;
    }

    // Create employee record
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        user_id: userId,
        full_name,
        email,
        phone,
        role,
        notes,
        status: 'active'
      })
      .select()
      .single();

    if (employeeError) {
      console.error('Employee creation error:', employeeError);
      // Delete the auth user and profile if employee creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({ 
        error: 'Failed to create employee record' 
      });
    }

    return res.status(201).json({ 
      message: 'Employee created successfully',
      employee,
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update employee (Admin only)
 */
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, status, notes } = req.body;

    // Check if employee exists
    const { data: existingEmployee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validate role if provided
    if (role && !['accountant', 'cashier', 'administrative'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be accountant, cashier, or administrative' 
      });
    }

    // Validate status if provided
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be active or inactive' 
      });
    }

    // Build update object
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Update employee record
    const { data: employee, error: updateError } = await supabaseAdmin
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Employee update error:', updateError);
      return res.status(500).json({ error: 'Failed to update employee' });
    }

    // Also update profile full_name if changed
    if (full_name) {
      await supabaseAdmin
        .from('profiles')
        .update({ full_name })
        .eq('id', existingEmployee.user_id);
    }

    return res.status(200).json({ 
      message: 'Employee updated successfully',
      employee 
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete employee (Admin only)
 */
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete employee record (this will cascade)
    const { error: deleteError } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Employee deletion error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete employee' });
    }

    // Optionally delete the auth user
    try {
      await supabaseAdmin.auth.admin.deleteUser(employee.user_id);
    } catch (authDeleteError) {
      console.error('Auth user deletion error:', authDeleteError);
      // Continue even if auth deletion fails
    }

    return res.status(200).json({ 
      message: 'Employee deleted successfully' 
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reset employee password (Admin only)
 */
const resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if employee exists
    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update password using Supabase Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      employee.user_id,
      { password }
    );

    if (updateError) {
      console.error('Password reset error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to reset password' 
      });
    }

    return res.status(200).json({ 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Reset employee password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get employee by user_id
 */
const getEmployeeByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.status(200).json({ employee });
  } catch (error) {
    console.error('Get employee by user_id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetEmployeePassword,
  getEmployeeByUserId
};
