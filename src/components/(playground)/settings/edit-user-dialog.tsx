"use client";

import { useState, FormEvent, useEffect } from "react";
import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void; // Callback to refresh user list
}

export default function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: EditUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setIsAdmin(user.isAdmin || false);
      setPassword(""); // Always clear password fields when dialog opens/user changes
      setConfirmPassword("");
      setError(null); // Clear previous errors
    }
  }, [user, open]); // Rerun when user or open state changes

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password && password.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (!user) {
      setError("No user selected for editing.");
      return;
    }

    setLoading(true);

    const updatePayload: any = {
      name: name !== user.name ? name : undefined,
      email: email !== user.email ? email : undefined,
      isAdmin: isAdmin !== user.isAdmin ? isAdmin : undefined,
    };

    if (password) {
      updatePayload.password = password;
    }

    // Filter out undefined fields to only send changed data
    Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === undefined) {
            delete updatePayload[key];
        }
    });

    if (Object.keys(updatePayload).length === 0) {
        setError("No changes detected.");
        setLoading(false);
        // Optionally close dialog or give different feedback
        // onOpenChange(false);
        return;
    }


    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user.");
      }

      toast.success("User updated successfully!");
      onUserUpdated();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Ensure dialog doesn't try to render content if user is null,
  // though the open prop should ideally control this.
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User: {user.name || user.email}</DialogTitle>
          <DialogDescription>
            Modify the user details. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">
                New Password
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-confirmPassword" className="text-right">
                Confirm Pass.
              </Label>
              <Input
                id="edit-confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="col-span-3"
                placeholder="Confirm new password"
                disabled={!password} // Disable if password field is empty
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isAdmin" className="text-right">
                Admin
              </Label>
              <div className="col-span-3 flex items-center">
                <Checkbox
                  id="edit-isAdmin"
                  checked={isAdmin}
                  onCheckedChange={(checked) => setIsAdmin(Boolean(checked))}
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                  Assign administrative privileges
                </span>
              </div>
            </div>
            {error && (
              <p className="col-span-4 text-center text-sm text-red-500">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
