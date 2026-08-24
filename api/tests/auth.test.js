jest.mock("../src/models", () => ({
  users: {
    findOne: jest.fn(),
  },
  Refreshtoken: {
    findOne: jest.fn(),
  },
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("../src/utils/token.utils", () => ({
  issueTokens: jest.fn(),
  hashToken: jest.fn(),
}));

const { users: User } = require("../src/models");
const bcrypt = require("bcrypt");
const { issueTokens } = require("../src/utils/token.utils");

const { loginUser } = require("../src/services/auth.service");

describe("Authentication logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should reject login when user does not exist", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      loginUser({
        email: "unknown@example.com",
        password: "password123",
      })
    ).rejects.toMatchObject({
      message: "Invalid credentials",
      code: "INVALID_CREDENTIALS",
    });

    expect(User.findOne).toHaveBeenCalledWith({
      where: {
        email: "unknown@example.com",
      },
    });

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(issueTokens).not.toHaveBeenCalled();
  });

  test("should reject login when password is incorrect", async () => {
    const user = {
      id: 1,
      name: "Alice",
      email: "alice@example.com",
      password: "hashed-password",
    };

    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      loginUser({
        email: "alice@example.com",
        password: "wrong-password",
      })
    ).rejects.toMatchObject({
      message: "Invalid credentials",
      code: "INVALID_CREDENTIALS",
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "wrong-password",
      "hashed-password"
    );

    expect(issueTokens).not.toHaveBeenCalled();
  });

  test("should login successfully with valid credentials", async () => {
    const user = {
      id: 1,
      name: "Alice",
      email: "alice@example.com",
      password: "hashed-password",
    };

    const tokens = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };

    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    issueTokens.mockResolvedValue(tokens);

    const result = await loginUser({
      email: "alice@example.com",
      password: "correct-password",
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "correct-password",
      "hashed-password"
    );

    expect(issueTokens).toHaveBeenCalledWith(user);

    expect(result).toEqual({
      user: {
        id: 1,
        name: "Alice",
        email: "alice@example.com",
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });
});
