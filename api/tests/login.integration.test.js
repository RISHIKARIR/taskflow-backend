const request = require("supertest");
const bcrypt = require("bcrypt");

const app = require("../index");


const {
  sequelize,
  users: User,
  organizations: Organization,
  org_members: OrgMember,
  Refreshtoken,
} = require("../src/models");




describe("Login integration test", () => {
  let user;
  let organization;

  beforeAll(async () => {
    await sequelize.authenticate();

    organization = await Organization.create({
      name: "Test Organization",
    });

    const password = await bcrypt.hash("password123", 12);

    user = await User.create({
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      password,
    });

    await OrgMember.create({
      user_id: user.id,
      organization_id: organization.id,
      role: "member",
    });
  });

  afterAll(async () => {
  await Refreshtoken.destroy({
    where: { user_id: user.id },
  });

  await OrgMember.destroy({
    where: { user_id: user.id },
  });

  await User.destroy({
    where: { id: user.id },
  });

  await Organization.destroy({
    where: { id: organization.id },
  });

  await sequelize.close();
});

  test("should login with valid credentials", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: user.email,
        password: "password123",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.user).toMatchObject({
      id: user.id,
      name: "Test User",
      email: user.email,
    });

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  test("should reject invalid password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: user.email,
        password: "wrong-password",
      });

    expect(response.statusCode).toBe(401);

    expect(response.body).toMatchObject({
      error: "Invalid credentials",
      code: "INVALID_CREDENTIALS",
    });
  });
});