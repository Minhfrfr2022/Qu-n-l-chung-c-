const { supabaseAdmin, supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

/**
 * Get all users (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    // Use supabaseAdmin to bypass RLS and see all profiles
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role && ['admin', 'manager', 'user'].includes(role)) {
      query = query.eq('role', role);
    }

    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    return res.status(200).json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user by ID (Admin only)
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Use supabaseAdmin to bypass RLS
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new user (Admin only)
 */
const createUser = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      username, 
      full_name, 
      role = 'user',
      apartment_number 
    } = req.body;

    // Validate required fields
    if (!email || !password || !username || !full_name) {
      return res.status(400).json({ 
        error: 'Email, password, username, and full name are required' 
      });
    }

    // Validate role
    if (!['admin', 'manager', 'user', 'accounting'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be admin, manager, user, or accounting' 
      });
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Create user in Supabase Auth using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name,
        role,
        apartment_number
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return res.status(400).json({ 
        error: authError.message || 'Failed to create user account' 
      });
    }

    // Wait a moment for trigger to potentially create profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if profile was created by trigger
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      // If profile doesn't exist, create it manually using admin client to bypass RLS
      console.log('Profile not created by trigger, creating manually...');
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          full_name,
          email,
          role,
          apartment_number
        })
        .select()
        .single();

      if (insertError) {
        console.error('Profile creation error:', insertError);
        console.error('Error details:', JSON.stringify(insertError, null, 2));
        // Clean up auth user if profile creation failed
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(500).json({ 
          error: 'Failed to create user profile',
          details: insertError.message 
        });
      }

      return res.status(201).json({ 
        message: 'User created successfully',
        user: newProfile 
      });
    }

    return res.status(201).json({ 
      message: 'User created successfully',
      user: profile 
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user (Admin only)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      username, 
      full_name, 
      role, 
      apartment_number,
      email,
      password 
    } = req.body;

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (id === req.user.id && role && role !== existingUser.role) {
      return res.status(403).json({ 
        error: 'You cannot change your own role' 
      });
    }

    // Check if new username is already taken
    if (username && username !== existingUser.username) {
      const { data: userWithUsername } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', id)
        .single();

      if (userWithUsername) {
        return res.status(409).json({ error: 'Username already exists' });
      }
    }

    // Validate role if provided
    if (role && !['admin', 'manager', 'user', 'accounting'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be admin, manager, user, or accounting' 
      });
    }

    // NEW VALIDATION: If changing role to 'user', must have resident record
    if (role === 'user' && existingUser.role !== 'user') {
      const { data: residentRecord } = await supabaseAdmin
        .from('residents')
        .select('id')
        .eq('user_id', id)
        .single();

      if (!residentRecord) {
        return res.status(400).json({ 
          error: 'User must be registered as a resident before being assigned role "user". Please create a resident record first.' 
        });
      }
    }

    // NEW VALIDATION: If assigning apartment_number to user with role 'user', must have resident
    if (role === 'user' && apartment_number) {
      const { data: residentRecord } = await supabaseAdmin
        .from('residents')
        .select('id, apt_id')
        .eq('user_id', id)
        .single();

      if (!residentRecord) {
        return res.status(400).json({ 
          error: 'User must be registered as a resident before being assigned to an apartment.' 
        });
      }

      // Verify apartment_number matches resident's apartment
      if (residentRecord.apt_id !== apartment_number) {
        return res.status(400).json({ 
          error: `User's resident record is in apartment ${residentRecord.apt_id}, not ${apartment_number}` 
        });
      }
    }

    // Update auth user if email or password changed
    if (email || password) {
      const updateData = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;

      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        updateData
      );

      if (authUpdateError) {
        console.error('Auth update error:', authUpdateError);
        return res.status(400).json({ 
          error: authUpdateError.message || 'Failed to update user credentials' 
        });
      }
    }

    // Update profile
    const updateFields = {};
    if (username) updateFields.username = username;
    if (full_name) updateFields.full_name = full_name;
    if (role) updateFields.role = role;
    if (apartment_number !== undefined) updateFields.apartment_number = apartment_number;
    if (email) updateFields.email = email;
    updateFields.updated_at = new Date().toISOString();

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ error: 'Failed to update user profile' });
    }

    return res.status(200).json({ 
      message: 'User updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete user (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(403).json({ 
        error: 'You cannot delete your own account' 
      });
    }

    // Check if user exists using admin client
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 1: Unlink resident record if exists
    const { data: residentRecord } = await supabaseAdmin
      .from('residents')
      .select('id')
      .eq('user_id', id)
      .maybeSingle();

    if (residentRecord) {
      // Unlink resident from user (don't delete resident, just unlink)
      const { error: unlinkError } = await supabaseAdmin
        .from('residents')
        .update({ user_id: null })
        .eq('user_id', id);
      
      if (unlinkError) {
        console.error('Unlink resident error:', unlinkError);
      }
    }

    // Step 2: Delete related records that might block profile deletion
    try {
      // Delete notifications
      await supabaseAdmin.from('notifications').delete().eq('user_id', id);
      
      // Delete maintenance requests created by user
      await supabaseAdmin.from('maintenance_requests').delete().eq('created_by', id);
      
      // Delete visitors created by user
      await supabaseAdmin.from('visitors').delete().eq('created_by', id);
      
      // Delete access cards for user
      await supabaseAdmin.from('access_cards').delete().eq('user_id', id);
    } catch (cleanupError) {
      console.warn('Cleanup error (non-critical):', cleanupError);
      // Continue with deletion even if cleanup fails
    }

    // Step 3: Delete from Supabase Auth first (this often cascades to profiles via trigger)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authDeleteError) {
      console.error('Auth delete error:', authDeleteError);
      // Continue to try profile delete even if auth delete fails
    }

    // Step 4: Delete profile if it still exists
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileDeleteError) {
      console.error('Profile delete error:', profileDeleteError);
      // If profile delete fails but auth delete succeeded, still return success
      if (!authDeleteError) {
        return res.status(200).json({ 
          message: 'User deleted successfully (profile may have been auto-deleted)' 
        });
      }
      return res.status(500).json({ 
        error: profileDeleteError.message || 'Failed to delete user profile' 
      });
    }

    return res.status(200).json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reset user password (Admin only)
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Update user password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { password }
    );

    if (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({ 
        error: error.message || 'Failed to reset password' 
      });
    }

    return res.status(200).json({ 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword
};
