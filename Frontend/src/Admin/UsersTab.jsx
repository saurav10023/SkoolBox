import { useEffect, useState } from "react";
import {
  Users, ShieldCheck, UserPlus, X, Loader2, AlertCircle,
  Eye, EyeOff, Ban, ShieldOff, RefreshCw, Trash2,
} from "lucide-react";
import API from "../api/axios";
import ConfirmModal from "./ConfirmModal ";

/* ─────────────────────────────────────────────
   USERS TAB
───────────────────────────────────────────── */
const UsersTab = ({ showToast }) => {
  const [regularUsers, setRegularUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("users");
  const [actionId, setActionId] = useState(null);
  const [toggleAdminId, setToggleAdminId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Create user state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [createData, setCreateData] = useState({
    username: "", password: "", mobileNumber: "", email: "", role: "user"
  });
  const [createError, setCreateError] = useState("");

  const isMobileValid = /^[0-9]{10}$/.test(createData.mobileNumber);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [usersRes, adminsRes] = await Promise.all([
        API.get("/api/v1/users/admin/users"),
        API.get("/api/v1/users/admin/admins"),
      ]);
      setRegularUsers(usersRes.data.data || []);
      setAdmins(adminsRes.data.data || []);
    } catch { showToast("Failed to fetch users", "error"); }
    finally { setLoading(false); }
  };

  const updateBoth = (userId, patch) => {
    setRegularUsers(prev => prev.map(u => u._id === userId ? { ...u, ...patch } : u));
    setAdmins(prev => prev.map(u => u._id === userId ? { ...u, ...patch } : u));
  };

  const handleToggleBlock = async (userId) => {
    setActionId(userId);
    try {
      const res = await API.patch(`/api/v1/users/admin/users/${userId}/block`);
      updateBoth(userId, { isBlocked: res.data.data.isBlocked });
      showToast(`User ${res.data.data.isBlocked ? "blocked" : "unblocked"}`, "success");
    } catch { showToast("Failed to update user", "error"); }
    finally { setActionId(null); }
  };

  const handleToggleAdmin = async (userId) => {
    setToggleAdminId(userId);
    try {
      const res = await API.patch(`/api/v1/users/admin/users/${userId}/toggle-admin`);
      const newRole = res.data.data.role;
      if (newRole === "admin") {
        setRegularUsers(prev => {
          const user = prev.find(u => u._id === userId);
          if (user) setAdmins(a => [{ ...user, role: "admin" }, ...a]);
          return prev.filter(u => u._id !== userId);
        });
      } else {
        setAdmins(prev => {
          const user = prev.find(u => u._id === userId);
          if (user) setRegularUsers(a => [{ ...user, role: "user" }, ...a]);
          return prev.filter(u => u._id !== userId);
        });
      }
      showToast(
        `User ${newRole === "admin" ? "promoted to admin" : "demoted to user"}`,
        "success"
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update role", "error");
    } finally { setToggleAdminId(null); }
  };

  const handleDelete = async (userId) => {
    try {
      await API.delete(`/api/v1/users/admin/users/${userId}`);
      setRegularUsers(prev => prev.filter(u => u._id !== userId));
      setAdmins(prev => prev.filter(u => u._id !== userId));
      showToast("User deleted", "success");
    } catch { showToast("Failed to delete user", "error"); }
    finally { setConfirm(null); }
  };

  const handleResetPassword = async () => {
    if (!newPassword) { showToast("Enter a new password", "error"); return; }
    try {
      await API.patch(`/api/v1/users/admin/users/${resetModal}/reset-password`, { newPassword });
      showToast("Password reset successfully", "success");
      setResetModal(null);
      setNewPassword("");
    } catch { showToast("Failed to reset password", "error"); }
  };

  const handleCreateUser = async () => {
    if (!createData.username || !createData.password || !createData.mobileNumber) {
      setCreateError("Username, password and mobile number are required");
      return;
    }
    if (!isMobileValid) {
      setCreateError("Enter a valid 10-digit mobile number");
      return;
    }
    if (createData.password.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const res = await API.post("/api/v1/users/admin/create-user", createData);
      const newUser = res.data.data;

      // Add to the right list
      if (newUser.role === "admin") {
        setAdmins(prev => [newUser, ...prev]);
      } else {
        setRegularUsers(prev => [newUser, ...prev]);
      }

      showToast("User created successfully", "success");
      setShowCreateForm(false);
      setCreateData({ username: "", password: "", mobileNumber: "", email: "", role: "user" });

      // Switch to the relevant tab
      setView(newUser.role === "admin" ? "admins" : "users");
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const UserCard = ({ user }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <img src={user.avatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
          <div>
            <p className="text-sm font-bold text-gray-900 capitalize">{user.username}</p>
            <p className="text-xs text-gray-400">{user.mobileNumber} · {user.email || "No email"}</p>
            <p className="text-xs text-gray-400">Joined {new Date(user.createdAt).toLocaleDateString("en-IN")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
            {user.role === "admin" ? "Admin" : "User"}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${user.isBlocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
            {user.isBlocked ? "Blocked" : "Active"}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        <button
          onClick={() => handleToggleBlock(user._id)}
          disabled={actionId === user._id}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg transition-all font-medium disabled:opacity-50
            ${user.isBlocked
              ? "border-green-200 text-green-600 hover:bg-green-50"
              : "border-orange-200 text-orange-600 hover:bg-orange-50"}`}
        >
          {actionId === user._id ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />}
          {user.isBlocked ? "Unblock" : "Block"}
        </button>

        <button
          onClick={() => handleToggleAdmin(user._id)}
          disabled={toggleAdminId === user._id}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg transition-all font-medium disabled:opacity-50
            ${user.role === "admin"
              ? "border-purple-200 text-purple-600 hover:bg-purple-50"
              : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"}`}
        >
          {toggleAdminId === user._id
            ? <Loader2 size={11} className="animate-spin" />
            : user.role === "admin" ? <ShieldOff size={11} /> : <ShieldCheck size={11} />}
          {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
        </button>

        <button
          onClick={() => setResetModal(user._id)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium"
        >
          <RefreshCw size={11} /> Reset Password
        </button>

        <button
          onClick={() => setConfirm(user._id)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-all font-medium"
        >
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  const currentList = view === "users" ? regularUsers : admins;

  return (
    <div className="space-y-4">

      {/* Header row — toggle + create button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setView("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${view === "users" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Users size={14} />
            Users
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${view === "users" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
              {regularUsers.length}
            </span>
          </button>
          <button
            onClick={() => setView("admins")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${view === "admins" ? "bg-white text-purple-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <ShieldCheck size={14} />
            Admins
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${view === "admins" ? "bg-purple-100 text-purple-600" : "bg-gray-200 text-gray-500"}`}>
              {admins.length}
            </span>
          </button>
        </div>

        {/* Create User button */}
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all
            ${showCreateForm
              ? "bg-gray-100 border-gray-200 text-gray-600"
              : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"}`}
        >
          {showCreateForm ? <><X size={14} /> Cancel</> : <><UserPlus size={14} /> Create User</>}
        </button>
      </div>

      {/* ── Create User Form ── */}
      {showCreateForm && (
        <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus size={15} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Create New User</h3>
              <p className="text-xs text-gray-400">No OTP required — admin creates directly</p>
            </div>
          </div>

          {createError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-xs font-medium">
              <AlertCircle size={13} /> {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. john_doe"
                value={createData.username}
                onChange={e => setCreateData({ ...createData, username: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Mobile */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Mobile Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit number"
                value={createData.mobileNumber}
                onChange={e => setCreateData({ ...createData, mobileNumber: e.target.value.replace(/\D/, "") })}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all
                  ${createData.mobileNumber && !isMobileValid
                    ? "border-red-300 focus:ring-red-400"
                    : "border-gray-200 focus:ring-blue-500"}`}
              />
              {createData.mobileNumber && (
                <p className={`text-xs pl-0.5 ${isMobileValid ? "text-green-500" : "text-gray-400"}`}>
                  {createData.mobileNumber.length}/10 {isMobileValid && "✓"}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCreatePass ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={createData.password}
                  onChange={e => setCreateData({ ...createData, password: e.target.value })}
                  className="w-full px-3 py-2.5 pr-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePass(!showCreatePass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCreatePass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {createData.password && (
                <p className={`text-xs pl-0.5 ${createData.password.length >= 6 ? "text-green-500" : "text-gray-400"}`}>
                  {createData.password.length >= 6 ? "Strong enough ✓" : `${createData.password.length}/6 minimum`}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Email
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="email"
                placeholder="user@email.com"
                value={createData.email}
                onChange={e => setCreateData({ ...createData, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Role</label>
            <div className="flex gap-3">
              {["user", "admin"].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCreateData({ ...createData, role: r })}
                  className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl text-xs font-semibold transition-all capitalize
                    ${createData.role === r
                      ? r === "admin"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                >
                  {r === "admin" ? <ShieldCheck size={13} /> : <Users size={13} />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreateUser}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            {creating
              ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
              : <><UserPlus size={14} /> Create User</>}
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2 bg-white border border-gray-100 rounded-2xl">
            {view === "admins"
              ? <ShieldCheck size={28} className="text-gray-200" />
              : <Users size={28} className="text-gray-200" />}
            <p className="text-gray-400 text-sm">
              {view === "admins" ? "No admins yet" : "No users yet"}
            </p>
          </div>
        ) : currentList.map(user => (
          <UserCard key={user._id} user={user} />
        ))}
      </div>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-black text-gray-900">Reset Password</h3>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setResetModal(null); setNewPassword(""); }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleResetPassword}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          message="Delete this user permanently?"
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default UsersTab;