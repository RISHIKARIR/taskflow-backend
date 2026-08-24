const request = require("supertest");
const bcrypt = require("bcrypt");

const app = require("../index");

const {
  sequelize,
  users: User,
  organizations: Organization,
  org_members: OrgMember,
  Refreshtoken,
  Project,
  Task,
} = require("../src/models");

describe("Cross-tenant access", () => {
  let orgA;
  let orgB;
  let userA;
  let userB;
  let projectA;
  let taskA;
  let tokenB;

  beforeAll(async () => {
    await sequelize.authenticate();

    // Organization A
    orgA = await Organization.create({
      name: `Org A ${Date.now()}`,
    });

    // Organization B
    orgB = await Organization.create({
      name: `Org B ${Date.now()}`,
    });

    const password = await bcrypt.hash("password123", 12);

    // User A
    userA = await User.create({
      name: "User A",
      email: `user-a-${Date.now()}@example.com`,
      password,
    });

    // User B
    userB = await User.create({
      name: "User B",
      email: `user-b-${Date.now()}@example.com`,
      password,
    });

    // Memberships
    await OrgMember.create({
      user_id: userA.id,
      organization_id: orgA.id,
      role: "org_admin",
    });

    await OrgMember.create({
      user_id: userB.id,
      organization_id: orgB.id,
      role: "org_admin",
    });

    // Project belongs to Org A
    projectA = await Project.create({
      name: "Org A Project",
      description: "Private project",
      organization_id: orgA.id,
    });

    // Task belongs to Org A
    taskA = await Task.create({
      title: "Org A Task",
      description: "Private task",
      status: "todo",
      priority: "medium",
      project_id: projectA.id,
    });

    // Login as User B
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        email: userB.email,
        password: "password123",
      });

    expect(loginResponse.statusCode).toBe(200);

    tokenB = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await Refreshtoken.destroy({
      where: {
        user_id: [userA.id, userB.id],
      },
    });

    await Task.destroy({
      where: {
        id: taskA.id,
      },
    });

    await Project.destroy({
      where: {
        id: projectA.id,
      },
    });

    await OrgMember.destroy({
      where: {
        user_id: [userA.id, userB.id],
      },
    });

    await User.destroy({
      where: {
        id: [userA.id, userB.id],
      },
    });

    await Organization.destroy({
      where: {
        id: [orgA.id, orgB.id],
      },
    });

    await sequelize.close();
  });

  test("should reject cross-tenant task access with 403", async () => {
    const response = await request(app)
      .get(`/tasks/${taskA.id}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(response.statusCode).toBe(403);

    expect(response.body).toMatchObject({
      error: "Forbidden",
      code: "FORBIDDEN",
    });
  });
});