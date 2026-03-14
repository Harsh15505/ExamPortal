import RoleLogin from './RoleLogin'

export default function AdminLogin() {
  return <RoleLogin expectedRole="admin" title="Admin Login" backTo="/login" />
}
