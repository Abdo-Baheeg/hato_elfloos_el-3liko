const DormGroup = require('../models/DormGroup');
const User = require('../models/User');
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require('../utils/ApiError');

/**
 * Dorm Group Service
 * Handles all dorm group-related business logic
 */

class DormGroupService {
  /**
   * Create a new dorm group
   * @param {String} userId - Creator user ID
   * @param {Object} groupData - Group data
   * @returns {Object} created group
   */
  static async createGroup(userId, groupData) {
    const { name, description, settings } = groupData;

    // Create dorm group with creator as admin
    const dormGroup = await DormGroup.create({
      name,
      description,
      settings,
      createdBy: userId,
      members: [
        {
          user: userId,
          role: 'admin',
          joinedAt: new Date(),
          isActive: true,
        },
      ],
    });

    // Update user's dormGroup reference
    await User.findByIdAndUpdate(userId, { dormGroup: dormGroup._id });

    // Populate creator info
    await dormGroup.populate('createdBy', 'username fullName email');
    await dormGroup.populate('members.user', 'username fullName email profilePicture');

    return dormGroup;
  }

  /**
   * Join a dorm group using invite code
   * @param {String} userId - User ID
   * @param {String} inviteCode - Group invite code
   * @returns {Object} joined group
   */
  static async joinGroup(userId, inviteCode) {
    // Find group by invite code
    const dormGroup = await DormGroup.findOne({
      inviteCode: inviteCode.toUpperCase(),
      isActive: true,
    });

    if (!dormGroup) {
      throw new NotFoundError('Invalid invite code');
    }

    // Check if invite is valid
    if (!dormGroup.isInviteValid()) {
      throw new BadRequestError('Invite code has expired or group is inactive');
    }

    // Check if user is already a member
    const existingMember = dormGroup.members.find(
      (m) => m.user.equals(userId) && m.isActive
    );

    if (existingMember) {
      throw new ConflictError('You are already a member of this group');
    }

    // Check if user is member of another active group
    const user = await User.findById(userId);
    if (user.dormGroup && !user.dormGroup.equals(dormGroup._id)) {
      throw new ConflictError('You must leave your current group before joining a new one');
    }

    // Add user to group
    await dormGroup.addMember(userId, 'member');

    await dormGroup.populate('members.user', 'username fullName email profilePicture');

    return dormGroup;
  }

  /**
   * Get dorm group details
   * @param {String} groupId - Group ID
   * @param {String} userId - Requesting user ID (for authorization)
   * @returns {Object} group details
   */
  static async getGroupDetails(groupId, userId) {
    const dormGroup = await DormGroup.findById(groupId)
      .populate('createdBy', 'username fullName email')
      .populate('members.user', 'username fullName email profilePicture');

    if (!dormGroup) {
      throw new NotFoundError('Dorm group not found');
    }

    // Check if user is a member
    if (!dormGroup.isUserMember(userId)) {
      throw new ForbiddenError('You are not a member of this group');
    }

    return dormGroup;
  }

  /**
   * Get all groups for a user
   * @param {String} userId - User ID
   * @returns {Array} user's groups
   */
  static async getUserGroups(userId) {
    const groups = await DormGroup.findByUser(userId);
    return groups;
  }

  /**
   * Update dorm group
   * @param {String} groupId - Group ID
   * @param {String} userId - Requesting user ID
   * @param {Object} updateData - Data to update
   * @returns {Object} updated group
   */
  static async updateGroup(groupId, userId, updateData) {
    const dormGroup = await DormGroup.findById(groupId);

    if (!dormGroup) {
      throw new NotFoundError('Dorm group not found');
    }

    // Check if user is admin
    if (!dormGroup.isUserAdmin(userId)) {
      throw new ForbiddenError('Only group admins can update group settings');
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'avatar', 'settings', 'maxMembers'];
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === 'settings') {
          // Merge settings
          dormGroup.settings = { ...dormGroup.settings, ...updateData.settings };
        } else {
          dormGroup[key] = updateData[key];
        }
      }
    });

    await dormGroup.save();
    await dormGroup.populate('members.user', 'username fullName email');

    return dormGroup;
  }

  /**
   * Remove member from group
   * @param {String} groupId - Group ID
   * @param {String} adminId - Admin user ID
   * @param {String} memberId - Member to remove
   */
  static async removeMember(groupId, adminId, memberId) {
    const dormGroup = await DormGroup.findById(groupId);

    if (!dormGroup) {
      throw new NotFoundError('Dorm group not found');
    }

    // Check if requester is admin
    if (!dormGroup.isUserAdmin(adminId)) {
      throw new ForbiddenError('Only group admins can remove members');
    }

    // Remove member
    await dormGroup.removeMember(memberId);

    return { message: 'Member removed successfully' };
  }

  /**
   * Leave group (self-removal)
   * @param {String} groupId - Group ID
   * @param {String} userId - User ID
   */
  static async leaveGroup(groupId, userId) {
    const dormGroup = await DormGroup.findById(groupId);

    if (!dormGroup) {
      throw new NotFoundError('Dorm group not found');
    }

    // Check if user is a member
    if (!dormGroup.isUserMember(userId)) {
      throw new BadRequestError('You are not a member of this group');
    }

    // Check if user is the last admin
    const member = dormGroup.members.find((m) => m.user.equals(userId) && m.isActive);
    if (member.role === 'admin' && dormGroup.adminCount === 1) {
      throw new BadRequestError(
        'You are the last admin. Please promote another member to admin before leaving'
      );
    }

    await dormGroup.removeMember(userId);

    return { message: 'You have left the group successfully' };
  }

  /**
   * Delete (archive) dorm group
   * @param {String} groupId - Group ID
   * @param {String} userId - Admin user ID
   */
  static async deleteGroup(groupId, userId) {
    const dormGroup = await DormGroup.findById(groupId);

    if (!dormGroup) {
      throw new NotFoundError('Dorm group not found');
    }

    // Check if user is admin
    if (!dormGroup.isUserAdmin(userId)) {
      throw new ForbiddenError('Only group admins can delete the group');
    }

    // Soft delete (archive)
    dormGroup.isActive = false;
    dormGroup.isArchived = true;
    dormGroup.archivedAt = new Date();
    await dormGroup.save();

    // Update all members' dormGroup reference to null
    const memberIds = dormGroup.members.filter((m) => m.isActive).map((m) => m.user);
    await User.updateMany({ _id: { $in: memberIds } }, { dormGroup: null });

    return { message: 'Group deleted successfully' };
  }

  /**
   * Regenerate invite code
   * @param {String} groupId - Group ID
   * @param {String} userId - Admin user ID
   * @param {Number} expiryDays - Days until expiry (optional)
   * @returns {Object} new invite code
   */
  static async regenerateInviteCode(groupId, userId, expiryDays = null) {
    const dormGroup = await DormGroup.findById(groupId);

    if (!dormGroup) {
      throw new NotFoundError('Dorm group not found');
    }

    // Check if user is admin
    if (!dormGroup.isUserAdmin(userId)) {
      throw new ForbiddenError('Only group admins can regenerate invite code');
    }

    await dormGroup.regenerateInviteCode(expiryDays);

    return {
      inviteCode: dormGroup.inviteCode,
      inviteExpiry: dormGroup.inviteExpiry,
    };
  }

  /**
   * Update member role
   * @param {String} groupId - Group ID
   * @param {String} adminId - Admin user ID
   * @param {String} memberId - Member to update
   * @param {String} newRole - New role (admin/member)
   */
  static async updateMemberRole(groupId, adminId, memberId, newRole) {
    const dormGroup = await DormGroup.findById(groupId);

    if (!dormGroup) {
      throw new NotFoundError('Dorm group not found');
    }

    // Check if requester is admin
    if (!dormGroup.isUserAdmin(adminId)) {
      throw new ForbiddenError('Only group admins can update member roles');
    }

    await dormGroup.updateMemberRole(memberId, newRole);

    return { message: 'Member role updated successfully' };
  }
}

module.exports = DormGroupService;
