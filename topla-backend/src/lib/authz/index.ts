/**
 * ============================================
 * RBAC v2 Public API
 * ============================================
 * Qayerda ishlatilsa shu modulni import qilish kifoya:
 *   import { requirePermissionV2, can, must, PERM } from '@/lib/authz';
 */

export { PERM, type PermissionValue, type PermissionKey, isKnownPermission } from './permissions.js';
export { ROLE_TEMPLATES, ROLE_TEMPLATES_BY_CODE, type RoleTemplate, type OrgScope } from './role-templates.js';
export {
  can,
  canAny,
  canAll,
  must,
  loadAuthzContext,
  invalidateAuthzContext,
  ForbiddenError,
  type AuthzContext,
  type AuthzMembership,
  type AuthzCheckOptions,
} from './policy.js';
export {
  requirePermissionV2,
  shadowCheckPermission,
  isAuthzV2Enabled,
  type RequirePermissionOptsV2,
} from './middleware.js';
