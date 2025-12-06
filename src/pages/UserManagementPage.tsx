import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole } from '@/types/pharmacy';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Trash2,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock users
const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    role: 'Admin',
    fullName: 'System Administrator',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    username: 'cashier1',
    role: 'Cashier',
    fullName: 'John Cashier',
    createdAt: '2024-06-20T14:30:00Z',
  },
];

export default function UserManagementPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'Cashier' as UserRole,
  });

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (newUser.password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      toast({
        title: 'Username taken',
        description: 'This username is already in use.',
        variant: 'destructive',
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      username: newUser.username,
      role: newUser.role,
      fullName: newUser.fullName,
      createdAt: new Date().toISOString(),
    };

    setUsers([...users, user]);
    setIsDialogOpen(false);
    setNewUser({
      username: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'Cashier',
    });

    toast({
      title: 'User created',
      description: `${user.fullName} has been added as ${user.role}.`,
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: 'Cannot delete',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      });
      return;
    }

    setUsers(users.filter(u => u.id !== userId));
    toast({
      title: 'User deleted',
      description: 'User has been removed from the system.',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage system users and their access
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Users list */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center',
                          user.role === 'Admin' ? 'bg-primary/10' : 'bg-muted'
                        )}>
                          {user.role === 'Admin' ? (
                            <ShieldCheck className="w-4 h-4 text-primary" />
                          ) : (
                            <Users className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium text-card-foreground">
                          {user.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="font-mono text-sm text-muted-foreground">
                      {user.username}
                    </td>
                    <td>
                      <span className={cn(
                        'status-badge',
                        user.role === 'Admin' ? 'status-badge-success' : 'status-badge-neutral'
                      )}>
                        {user.role === 'Admin' && <Shield className="w-3 h-3 mr-1" />}
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="text-right">
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with specified role and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                placeholder="e.g., John Smith"
                value={newUser.fullName}
                onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Username *</Label>
              <Input
                placeholder="e.g., jsmith"
                value={newUser.username}
                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Role *</Label>
              <Select
                value={newUser.role}
                onValueChange={(v: UserRole) => setNewUser({ ...newUser, role: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Confirm Password *</Label>
              <Input
                type="password"
                placeholder="Re-enter password"
                value={newUser.confirmPassword}
                onChange={e => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
