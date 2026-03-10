import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Edit, Trash2, Shield, User as UserIcon, Clock, ArrowLeft } from 'lucide-react';
import authService, { type User } from '@/services/authService';
import userService, { type UserCreate, type UserUpdate } from '@/services/userService';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user' | 'temp',
    is_active: true,
  });

  useEffect(() => {
    // Check if user is admin
    if (!authService.isAdmin()) {
      navigate('/');
      return;
    }
    
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setError('');
    } catch {
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const userData: UserCreate = {
        username: formData.username,
        name: formData.name,
        password: formData.password,
        role: formData.role,
        ...(formData.email && { email: formData.email }),
      };
      
      await userService.createUser(userData);
      setSuccess('Usuário criado com sucesso!');
      setCreateDialogOpen(false);
      resetForm();
      loadUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar usuário');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    
    try {
      const userData: UserUpdate = {
        ...(formData.username && { username: formData.username }),
        ...(formData.email && { email: formData.email }),
        ...(formData.name && { name: formData.name }),
        ...(formData.password && { password: formData.password }),
        role: formData.role,
        is_active: formData.is_active,
      };
      
      await userService.updateUser(selectedUser.id, userData);
      setSuccess('Usuário atualizado com sucesso!');
      setEditDialogOpen(false);
      resetForm();
      loadUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao atualizar usuário');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.deleteUser(selectedUser.id);
      setSuccess('Usuário deletado com sucesso!');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao deletar usuário');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      name: user.name,
      password: '',
      role: user.role,
      is_active: user.is_active,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      name: '',
      password: '',
      role: 'user',
      is_active: true,
    });
    setSelectedUser(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'user':
        return <Badge className="bg-blue-500"><UserIcon className="w-3 h-3 mr-1" />Usuário</Badge>;
      case 'temp':
        return <Badge className="bg-gray-500"><Clock className="w-3 h-3 mr-1" />Temporário</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 md:pt-20 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-xl md:text-2xl">Gerenciamento de Usuários</CardTitle>
                <CardDescription className="text-sm">
                  Gerencie usuários, permissões e acessos ao sistema
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(user)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium break-all">{user.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Role:</span>
                      <div className="mt-1">{getRoleBadge(user.role)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="mt-1">
                        {user.is_active ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criado em:</span>
                      <p className="font-medium">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo usuário
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-username">Username *</Label>
              <Input
                id="create-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="usuario"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="create-name">Nome *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="create-email">Email (opcional)</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="create-password">Senha *</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Digite a senha"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="create-role">Permissão</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'user' | 'temp') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="create-role">
                  <SelectValue placeholder="Selecione a permissão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="temp">Temporário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar Usuário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere os dados do usuário
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email (opcional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Deixe em branco para manter"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Permissão</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'user' | 'temp') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="temp">Temporário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-active">Usuário ativo</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o usuário <strong>{selectedUser?.name}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
