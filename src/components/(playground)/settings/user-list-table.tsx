"use client";

import { useEffect, useState, useMemo } from "react";
import { User } from "@/types/user";
import { DataTable } from "@/components/data-table/table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import EditUserDialog from "./edit-user-dialog";
import DeleteUserConfirmationDialog from "./delete-user-confirmation-dialog"; // Import Delete Dialog

interface UserListTableProps {
  onUserAction?: () => void;
  currentSessionUserId?: string | null;
}

export default function UserListTable({ onUserAction, currentSessionUserId }: UserListTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);

  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditUserDialogOpen(true);
  };

  const handleUserUpdated = () => {
    if (onUserAction) {
      onUserAction();
    }
    setIsEditUserDialogOpen(false);
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setIsDeleteConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      const response = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user.");
      }
      toast.success(`User ${deletingUser.email} deleted successfully!`);
      if (onUserAction) {
        onUserAction();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during deletion.");
      console.error("Delete error:", err);
    } finally {
      setIsDeleteConfirmDialogOpen(false);
      setDeletingUser(null);
    }
  };

  const adminUsersCount = useMemo(() => users.filter(u => u.isAdmin).length, [users]);

  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => row.getValue("name") || "N/A",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "isAdmin",
      header: "Admin",
      cell: ({ row }) => {
        const isAdmin = row.getValue("isAdmin");
        return isAdmin ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUserOnlyAdmin = user.id === currentSessionUserId && user.isAdmin && adminUsersCount === 1;
        return (
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteUser(user)}
              disabled={isCurrentUserOnlyAdmin}
              title={isCurrentUserOnlyAdmin ? "Cannot delete the only admin user." : "Delete user"}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ], [currentSessionUserId, adminUsersCount]); // Add dependencies

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/users");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Error: ${response.statusText}` }));
        if (response.status === 403) {
          setError("You are not authorized to view this data.");
        } else {
          setError(errorData.error || `Error: ${response.statusText}`);
        }
        return;
      }
      const data = await response.json();
      setUsers(data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Failed to fetch users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <p>Loading users...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (users.length === 0 && !loading) {
    return <p>No users found.</p>;
  }

  return (
    <>
      <DataTable columns={columns} data={users} />
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={isEditUserDialogOpen}
          onOpenChange={setIsEditUserDialogOpen}
          onUserUpdated={handleUserUpdated}
        />
      )}
      {deletingUser && (
        <DeleteUserConfirmationDialog
          user={deletingUser}
          open={isDeleteConfirmDialogOpen}
          onOpenChange={setIsDeleteConfirmDialogOpen}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </>
  );
}
