'use strict';


const bcrypt = require('bcrypt');
 
const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];






/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
 
    // ---- 2 organizations ----
    await queryInterface.bulkInsert('organizations', [
      { name: 'Acme Corp', createdAt: now, updatedAt: now },
      { name: 'Globex Inc', createdAt: now, updatedAt: now },
    ]);
    const orgs = await queryInterface.sequelize.query(
      `SELECT id, name FROM organizations ORDER BY id;`
    );
    const orgRows = orgs[0];
    const org1Id = orgRows[0].id; 
    const org2Id = orgRows[1].id; // Globex Inc
 
    // ---- 5 users (same password for all: Password123!) ----
    const passwordHash = await bcrypt.hash('Password123!', 12);
    const userNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan'];
 
    await queryInterface.bulkInsert(
      'users',
      userNames.map((name) => ({
        name,
        email: `${name.toLowerCase()}@taskflow.dev`,
        password: passwordHash, // change to `password_hash` below if that's your actual column name
        createdAt: now,
        updatedAt: now,
      }))
    );
    const usersResult = await queryInterface.sequelize.query(
      `SELECT id, name FROM users ORDER BY id;`
    );
    const userRows = usersResult[0];
    // map name -> id for readability
    const ids = {};
    userRows.forEach((u) => (ids[u.name] = u.id));
 
    // ---- org_members ----
    await queryInterface.bulkInsert('org_members', [
      { user_id: ids['Alice'], organization_id: org1Id, createdAt: now, updatedAt: now },
      { user_id: ids['Bob'], organization_id: org1Id, createdAt: now, updatedAt: now },
      { user_id: ids['Charlie'], organization_id: org1Id, createdAt: now, updatedAt: now },
      { user_id: ids['Diana'], organization_id: org2Id, createdAt: now, updatedAt: now },
      { user_id: ids['Ethan'], organization_id: org2Id, createdAt: now, updatedAt: now },
      { user_id: ids['Charlie'], organization_id: org2Id, createdAt: now, updatedAt: now },
    ]);
 
    // ---- projects ----
    await queryInterface.bulkInsert('Projects', [
      { name: 'Website Revamp', description: 'Revamp marketing site', organization_id: org1Id, createdAt: now, updatedAt: now },
      { name: 'Mobile App', description: 'New mobile client', organization_id: org1Id, createdAt: now, updatedAt: now },
      { name: 'Internal Tooling', description: 'Internal dashboards', organization_id: org2Id, createdAt: now, updatedAt: now },
    ]);
    const projResult = await queryInterface.sequelize.query(
      `SELECT id, name, organization_id FROM "Projects" ORDER BY id;`
    );
    const projRows = projResult[0];
 
    // ---- 12 tasks distributed across projects ----
    const taskTitles = [
      'Set up CI pipeline', 'Design landing page', 'Fix login bug',
      'Write API docs', 'Refactor auth module', 'Add dark mode',
      'Optimize DB queries', 'Implement search', 'Fix mobile layout',
      'Add push notifications', 'Set up monitoring', 'Update dependencies',
    ];
 
    const taskRows = taskTitles.map((title, i) => {
      const project = projRows[i % projRows.length];
      return {
        title,
        description: `Description for "${title}"`,
        status: STATUSES[i % STATUSES.length],
        priority: PRIORITIES[i % PRIORITIES.length],
        due_date: new Date(now.getTime() + (i + 1) * 86400000),
        project_id: project.id,
        createdAt: now,
        updatedAt: now,
      };
    });
    await queryInterface.bulkInsert('Tasks', taskRows);
 
    const tasksResult = await queryInterface.sequelize.query(
      `SELECT id, title, project_id FROM "Tasks" ORDER BY id;`
    );
    const allTasks = tasksResult[0];
 
    // build project_id -> org_id map for picking valid assignees
    const projOrgMap = {};
    projRows.forEach((p) => (projOrgMap[p.id] = p.organization_id));
 
    const org1UserIds = [ids['Alice'], ids['Bob'], ids['Charlie']];
    const org2UserIds = [ids['Diana'], ids['Ethan'], ids['Charlie']];
 
    const assignmentRows = [];
    const commentRows = [];
 
    allTasks.forEach((task, i) => {
      const isOrg1 = projOrgMap[task.project_id] === org1Id;
      const pool = isOrg1 ? org1UserIds : org2UserIds;
      const assigneeId = pool[i % pool.length];
 
      assignmentRows.push({
        task_id: task.id,
        user_id: assigneeId,
        createdAt: now,
        updatedAt: now,
      });
 
      commentRows.push({
        task_id: task.id,
        user_id: assigneeId,
        content: `Started looking into "${task.title}".`,
        createdAt: now,
        updatedAt: now,
      });
    });
 
    await queryInterface.bulkInsert('TaskAssignments', assignmentRows);
    await queryInterface.bulkInsert('Comments', commentRows);
 
    console.log('Seed complete. All users password: Password123!');

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Comments', null, {});
    await queryInterface.bulkDelete('TaskAssignments', null, {});
    await queryInterface.bulkDelete('Tasks', null, {});
    await queryInterface.bulkDelete('Projects', null, {});
    await queryInterface.bulkDelete('org_members', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('organizations', null, {});
  }
};
