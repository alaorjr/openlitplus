"use client";

import { useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "@/lib/session";
import RouteBreadcrumbs from "@/components/nav/route-breadcrumb";
import UserListTable from "@/components/(playground)/settings/user-list-table";
import CreateUserDialog from "@/components/(playground)/settings/create-user-dialog"; // Import the dialog
import { Button } from "@/components/ui/button"; // For the "Create User" button
import { User } from "@/types/user";

export default function UserManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  // State to trigger re-fetch in UserListTable. Increment to change key.
  const [userListRefreshKey, setUserListRefreshKey] = useState(0);

  const fetchUserSession = useCallback(async () => {
    // setLoading(true); // Already handled by initial loading state, avoid re-setting if not desired on every call
    const sessionUser = await getCurrentUser();
    setUser(sessionUser as User | null);
    setIsAdmin(sessionUser?.isAdmin || false);
    setLoading(false); // Ensure loading is false after fetch
  }, []);

  useEffect(() => {
    fetchUserSession();
  }, [fetchUserSession]);

  const handleUserCreated = useCallback(() => {
    setUserListRefreshKey(prevKey => prevKey + 1); // Trigger UserListTable refresh
    // Optionally, re-fetch session if creating a user could change current user's state/permissions, though unlikely here.
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <RouteBreadcrumbs
          className="mb-4"
          path={["Settings", "User Management"]}
        />
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            User Management
          </h1>
        </header>
        <p>Loading user information...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6">
         <RouteBreadcrumbs
          className="mb-4"
          path={["Settings", "User Management"]}
        />
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            User Management
          </h1>
        </header>
        <div className="flex flex-col items-center justify-center h-full py-10">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            Unauthorized
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <RouteBreadcrumbs
        className="mb-4"
        path={["Settings", "User Management"]}
      />
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          User Management
        </h1>
        <Button onClick={() => setIsCreateUserDialogOpen(true)}>
          Create User
        </Button>
      </header>
      <section>
        <UserListTable
          key={userListRefreshKey}
          currentSessionUserId={user?.id}
          onUserAction={handleUserCreated} // Pass the refresh handler
        />
      </section>
      <CreateUserDialog
        open={isCreateUserDialogOpen}
        onOpenChange={setIsCreateUserDialogOpen}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
