import { describe, expect, it } from "vitest";
import { canChangeRole, canManageTargetRole, isAdminRole } from "./permissions";

describe("isAdminRole", () => {
  it("is true for admin and superadmin, false for farmer", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("superadmin")).toBe(true);
    expect(isAdminRole("farmer")).toBe(false);
  });
});

describe("canManageTargetRole", () => {
  it("nobody can manage a superadmin, not even another superadmin", () => {
    expect(canManageTargetRole("superadmin", "superadmin")).toBe(false);
    expect(canManageTargetRole("admin", "superadmin")).toBe(false);
  });

  it("only superadmin can manage an admin", () => {
    expect(canManageTargetRole("superadmin", "admin")).toBe(true);
    expect(canManageTargetRole("admin", "admin")).toBe(false);
    expect(canManageTargetRole("farmer", "admin")).toBe(false);
  });

  it("both admin and superadmin can manage a farmer", () => {
    expect(canManageTargetRole("admin", "farmer")).toBe(true);
    expect(canManageTargetRole("superadmin", "farmer")).toBe(true);
    expect(canManageTargetRole("farmer", "farmer")).toBe(false);
  });
});

describe("canChangeRole", () => {
  it("only superadmin can promote/demote", () => {
    expect(canChangeRole("superadmin", "farmer")).toBe(true);
    expect(canChangeRole("superadmin", "admin")).toBe(true);
    expect(canChangeRole("admin", "farmer")).toBe(false);
  });

  it("never targets a superadmin, even from a superadmin actor", () => {
    expect(canChangeRole("superadmin", "superadmin")).toBe(false);
  });
});
