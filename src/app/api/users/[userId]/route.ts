import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import prisma from "@/lib/prisma";
import { genSaltSync, hashSync } from "bcrypt-ts";

// Helper to exclude keys from an object
function exclude<User, Key extends keyof User>(
  user: User,
  keys: Key[]
): Omit<User, Key> {
  for (let key of keys) {
    delete user[key];
  }
  return user;
}

export async function PUT(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!sessionUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = params.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, email, isAdmin, password } = body;

    // Basic input validation
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "Request body cannot be empty" },
        { status: 400 }
      );
    }

    if (email && typeof email !== 'string') {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if (name && typeof name !== 'string') {
      return NextResponse.json({ error: "Invalid name format" }, { status: 400 });
    }
    if (password && (typeof password !== 'string' || password.length < 8)) {
       return NextResponse.json({ error: "Password must be a string and at least 8 characters long" }, { status: 400 });
    }
     if (typeof isAdmin !== 'undefined' && typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: "isAdmin must be a boolean" }, { status: 400 });
    }


    // Critical check: Prevent admin from removing their own admin status if they are the only admin
    if (sessionUser.id === userId && typeof isAdmin === "boolean" && !isAdmin) {
      const userToEdit = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (userToEdit?.isAdmin) { // Check if the user being edited is currently an admin
        const adminCount = await prisma.user.count({
          where: { isAdmin: true },
        });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "Cannot remove admin status from the only admin user." },
            { status: 400 } // Or 403 Forbidden
          );
        }
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
        // Potentially check for email uniqueness if it's being changed
        if (email !== sessionUser.email) { // Example: only check if email is different from current user's email
            const existingUser = await prisma.user.findUnique({ where: { email }});
            if (existingUser && existingUser.id !== userId) {
                return NextResponse.json({ error: "Email already in use by another account." }, { status: 409 });
            }
        }
        updateData.email = email;
    }
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (password) {
      const salt = genSaltSync(10);
      updateData.password = hashSync(password, salt);
    }
    updateData.updatedAt = new Date();


    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const userWithoutPassword = exclude(updatedUser, ["password"]);
    return NextResponse.json(userWithoutPassword);

  } catch (error: any) {
    console.error(`Error updating user ${params.userId}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request, // Request object might not be strictly needed for DELETE if no body is processed
  { params }: { params: { userId: string } }
) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!sessionUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = params.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Critical check: Prevent admin from deleting themselves if they are the only admin user.
    if (sessionUser.id === userId) {
      const userToDelete = await prisma.user.findUnique({
        where: { id: userId },
      });
      // Ensure the user being deleted is actually an admin before checking admin count
      if (userToDelete?.isAdmin) {
        const adminCount = await prisma.user.count({
          where: { isAdmin: true },
        });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "Cannot delete the only admin user." },
            { status: 400 } // Or 403 Forbidden
          );
        }
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    // Return 204 No Content for DELETE operations as per HTTP spec, or a success message.
    // return new NextResponse(null, { status: 204 });
    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });


  } catch (error: any) {
    console.error(`Error deleting user ${params.userId}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
