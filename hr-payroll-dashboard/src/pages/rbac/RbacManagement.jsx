import { useState, useEffect } from 'react';
import { rbacService } from '../../services/api';
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const RbacManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [usersWithRoles, setUsersWithRoles] = useState([]);
  const [rolesWithPermissions, setRolesWithPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRole, setCurrentRole] = useState({ role_id: null, role_name: '', description: '' });
  const [currentPermission, setCurrentPermission] = useState({ permission_id: null, permission_name: '' });

  // Assignment states
  const [userRoleDialogOpen, setUserRoleDialogOpen] = useState(false);
  const [rolePermissionDialogOpen, setRolePermissionDialogOpen] = useState(false);
  const [assignmentUser, setAssignmentUser] = useState({ user_id: '', role_id: '' });
  const [assignmentRolePerm, setAssignmentRolePerm] = useState({ role_id: '', permission_id: '' });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      switch (tabValue) {
        case 0: {
          const rolesRes = await rbacService.getRoles();
          setRoles(rolesRes.data);
          break;
        }
        case 1: {
          const permsRes = await rbacService.getPermissions();
          setPermissions(permsRes.data);
          break;
        }
        case 2: {
          const userRolesRes = await rbacService.getUsersWithRoles();
          setUsersWithRoles(userRolesRes.data);
          break;
        }
        case 3: {
          const rolePermsRes = await rbacService.getRolesWithPermissions();
          setRolesWithPermissions(rolePermsRes.data);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  // Role handlers
  const handleOpenRoleDialog = (role = null) => {
    if (role) {
      setEditMode(true);
      setCurrentRole({
        role_id: role.role_id,
        role_name: role.role_name,
        description: role.description || '',
      });
    } else {
      setEditMode(false);
      setCurrentRole({ role_id: null, role_name: '', description: '' });
    }
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      if (editMode) {
        await rbacService.updateRole(currentRole.role_id, {
          role_name: currentRole.role_name,
          description: currentRole.description,
        });
        setSuccess('Cập nhật vai trò thành công');
      } else {
        await rbacService.createRole({
          role_name: currentRole.role_name,
          description: currentRole.description,
        });
        setSuccess('Tạo vai trò thành công');
      }
      setRoleDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lưu vai trò');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      try {
        await rbacService.deleteRole(roleId);
        setSuccess('Xóa vai trò thành công');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.error || 'Lỗi khi xóa vai trò');
      }
    }
  };

  // Permission handlers
  const handleOpenPermissionDialog = (permission = null) => {
    if (permission) {
      setEditMode(true);
      setCurrentPermission({
        permission_id: permission.permission_id,
        permission_name: permission.permission_name,
      });
    } else {
      setEditMode(false);
      setCurrentPermission({ permission_id: null, permission_name: '' });
    }
    setPermissionDialogOpen(true);
  };

  const handleSavePermission = async () => {
    try {
      if (editMode) {
        await rbacService.updatePermission(currentPermission.permission_id, {
          permission_name: currentPermission.permission_name,
        });
        setSuccess('Cập nhật quyền hạn thành công');
      } else {
        await rbacService.createPermission({
          permission_name: currentPermission.permission_name,
        });
        setSuccess('Tạo quyền hạn thành công');
      }
      setPermissionDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lưu quyền hạn');
    }
  };

  const handleDeletePermission = async (permissionId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa quyền hạn này?')) {
      try {
        await rbacService.deletePermission(permissionId);
        setSuccess('Xóa quyền hạn thành công');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.error || 'Lỗi khi xóa quyền hạn');
      }
    }
  };

  // User‑Role assignment handlers
  const handleOpenUserRoleDialog = () => {
    setAssignmentUser({ user_id: '', role_id: '' });
    setUserRoleDialogOpen(true);
  };

  const handleSaveUserRole = async () => {
    try {
      await rbacService.assignUserRole({
        user_id: Number(assignmentUser.user_id),
        role_id: Number(assignmentUser.role_id),
      });
      setSuccess('Gán vai trò cho người dùng thành công');
      setUserRoleDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi gán vai trò cho người dùng');
    }
  };

  const handleRemoveUserRole = async (userId, roleId) => {
    if (window.confirm('Xóa vai trò này khỏi người dùng?')) {
      try {
        await rbacService.removeUserRole({
          user_id: userId,
          role_id: roleId,
        });
        setSuccess('Xóa vai trò khỏi người dùng thành công');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.error || 'Lỗi khi xóa vai trò khỏi người dùng');
      }
    }
  };

  // Role‑Permission assignment handlers
  const handleOpenRolePermissionDialog = () => {
    setAssignmentRolePerm({ role_id: '', permission_id: '' });
    setRolePermissionDialogOpen(true);
  };

  const handleSaveRolePermission = async () => {
    try {
      await rbacService.assignPermissionToRole({
        role_id: Number(assignmentRolePerm.role_id),
        permission_id: Number(assignmentRolePerm.permission_id),
      });
      setSuccess('Gán quyền hạn cho vai trò thành công');
      setRolePermissionDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi gán quyền hạn cho vai trò');
    }
  };

  const handleRemoveRolePermission = async (roleId, permissionId) => {
    if (window.confirm('Xóa quyền hạn này khỏi vai trò?')) {
      try {
        await rbacService.removePermissionFromRole({
          role_id: roleId,
          permission_id: permissionId,
        });
        setSuccess('Xóa quyền hạn khỏi vai trò thành công');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.error || 'Lỗi khi xóa quyền hạn khỏi vai trò');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Quản lý phân quyền
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Vai trò" />
        <Tab label="Quyền hạn" />
        <Tab label="Vai trò người dùng" />
        <Tab label="Quyền hạn vai trò" />
      </Tabs>

      {loading && <CircularProgress />}

      {/* Roles Tab */}
      {!loading && tabValue === 0 && (
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenRoleDialog()}
            sx={{ mb: 2 }}
          >
            Thêm vai trò
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Tên vai trò</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.role_id}>
                    <TableCell>{role.role_id}</TableCell>
                    <TableCell>{role.role_name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenRoleDialog(role)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteRole(role.role_id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Permissions Tab */}
      {!loading && tabValue === 1 && (
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenPermissionDialog()}
            sx={{ mb: 2 }}
          >
            Thêm quyền hạn
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Tên quyền hạn</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.permission_id}>
                    <TableCell>{perm.permission_id}</TableCell>
                    <TableCell>{perm.permission_name}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenPermissionDialog(perm)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeletePermission(perm.permission_id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* User Roles Tab */}
      {!loading && tabValue === 2 && (
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenUserRoleDialog}
            sx={{ mb: 2 }}
          >
            Gán vai trò cho người dùng
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID người dùng</TableCell>
                  <TableCell>Tên đăng nhập</TableCell>
                  <TableCell>Họ tên</TableCell>
                  <TableCell>Vai trò</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersWithRoles.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.user_id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      {user.roles?.map((r) => (
                        <span key={r.role_id} style={{ marginRight: 8 }}>
                          {r.role_name}
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveUserRole(user.user_id, r.role_id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      )) || 'Chưa có vai trò'}
                    </TableCell>
                    <TableCell>
                      {/* Quick assign? Could open dialog pre‑filled */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Role Permissions Tab */}
      {!loading && tabValue === 3 && (
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenRolePermissionDialog}
            sx={{ mb: 2 }}
          >
            Gán quyền hạn cho vai trò
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID vai trò</TableCell>
                  <TableCell>Tên vai trò</TableCell>
                  <TableCell>Quyền hạn</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rolesWithPermissions.map((role) => (
                  <TableRow key={role.role_id}>
                    <TableCell>{role.role_id}</TableCell>
                    <TableCell>{role.role_name}</TableCell>
                    <TableCell>
                      {role.permissions?.map((p) => (
                        <span key={p.permission_id} style={{ marginRight: 8 }}>
                          {p.permission_name}
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveRolePermission(role.role_id, p.permission_id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      )) || 'Chưa có quyền hạn'}
                    </TableCell>
                    <TableCell>
                      {/* Quick assign? */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>{editMode ? 'Sửa vai trò' : 'Thêm vai trò'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên vai trò"
            fullWidth
            value={currentRole.role_name}
            onChange={(e) => setCurrentRole({ ...currentRole, role_name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Mô tả"
            fullWidth
            multiline
            rows={3}
            value={currentRole.description}
            onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSaveRole}>{editMode ? 'Cập nhật' : 'Tạo'}</Button>
        </DialogActions>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog open={permissionDialogOpen} onClose={() => setPermissionDialogOpen(false)}>
        <DialogTitle>{editMode ? 'Sửa quyền hạn' : 'Thêm quyền hạn'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên quyền hạn"
            fullWidth
            value={currentPermission.permission_name}
            onChange={(e) =>
              setCurrentPermission({ ...currentPermission, permission_name: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSavePermission}>{editMode ? 'Cập nhật' : 'Tạo'}</Button>
        </DialogActions>
      </Dialog>

      {/* User‑Role Assignment Dialog */}
      <Dialog open={userRoleDialogOpen} onClose={() => setUserRoleDialogOpen(false)}>
        <DialogTitle>Gán vai trò cho người dùng</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="ID người dùng"
            fullWidth
            value={assignmentUser.user_id}
            onChange={(e) => setAssignmentUser({ ...assignmentUser, user_id: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Vai trò</InputLabel>
            <Select
              value={assignmentUser.role_id}
              label="Vai trò"
              onChange={(e) => setAssignmentUser({ ...assignmentUser, role_id: e.target.value })}
            >
              {roles.map((r) => (
                <MenuItem key={r.role_id} value={r.role_id}>
                  {r.role_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserRoleDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSaveUserRole}>Gán</Button>
        </DialogActions>
      </Dialog>

      {/* Role‑Permission Assignment Dialog */}
      <Dialog open={rolePermissionDialogOpen} onClose={() => setRolePermissionDialogOpen(false)}>
        <DialogTitle>Gán quyền hạn cho vai trò</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Vai trò</InputLabel>
            <Select
              value={assignmentRolePerm.role_id}
              label="Vai trò"
              onChange={(e) =>
                setAssignmentRolePerm({ ...assignmentRolePerm, role_id: e.target.value })
              }
            >
              {roles.map((r) => (
                <MenuItem key={r.role_id} value={r.role_id}>
                  {r.role_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Quyền hạn</InputLabel>
            <Select
              value={assignmentRolePerm.permission_id}
              label="Quyền hạn"
              onChange={(e) =>
                setAssignmentRolePerm({ ...assignmentRolePerm, permission_id: e.target.value })
              }
            >
              {permissions.map((p) => (
                <MenuItem key={p.permission_id} value={p.permission_id}>
                  {p.permission_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRolePermissionDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSaveRolePermission}>Gán</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RbacManagement;