"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    // Prevents the same user from being assigned to the same task twice.
    // The composite index also makes lookups using task_id + user_id faster.
    await queryInterface.addIndex(
      "TaskAssignments",
      ["task_id", "user_id"],
      {
        name: "task_assignments_task_user_idx",
        unique: true,
      }
    );

    // Makes it faster to find all task assignments belonging to a specific user.
    await queryInterface.addIndex(
      "TaskAssignments",
      ["user_id"],
      {
        name: "task_assignments_user_idx",
      }
    );

    // Organization membership is commonly checked using organization_id
    // and user_id together.
    // Unique prevents the same user from being added to the same organization twice.
    await queryInterface.addIndex(
      "org_members",
      ["organization_id", "user_id"],
      {
        name: "org_members_org_user_idx",
        unique: true,
      }
    );

    // Makes it faster to find the organization membership of a specific user.
    await queryInterface.addIndex(
      "org_members",
      ["user_id"],
      {
        name: "org_members_user_idx",
      }
    );

    // Refresh and logout operations search for a refresh token using its hash.
    // Unique prevents the same hashed refresh token from being stored multiple times.
    await queryInterface.addIndex(
      "Refreshtokens",
      ["hashed_token"],
      {
        name: "refresh_tokens_hash_idx",
        unique: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {

    // Remove the unique task + user assignment index.
    await queryInterface.removeIndex(
      "TaskAssignments",
      "task_assignments_task_user_idx"
    );

    // Remove the user assignment lookup index.
    await queryInterface.removeIndex(
      "TaskAssignments",
      "task_assignments_user_idx"
    );

    // Remove the unique organization + user membership index.
    await queryInterface.removeIndex(
      "org_members",
      "org_members_org_user_idx"
    );

    // Remove the user membership lookup index.
    await queryInterface.removeIndex(
      "org_members",
      "org_members_user_idx"
    );

    // Remove the refresh-token hash lookup index.
    await queryInterface.removeIndex(
      "Refreshtokens",
      "refresh_tokens_hash_idx"
    );
  },
};