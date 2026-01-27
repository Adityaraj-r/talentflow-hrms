/**
 * @typedef {Object} AdminMetrics
 * @property {number} totalUsers
 * @property {string} totalUsersLabel
 * @property {'up'|'down'|'neutral'} [totalUsersTrend]
 * @property {string} [totalUsersTrendValue]
 * @property {number} activeUsers
 * @property {string} activeUsersLabel
 * @property {'up'|'down'|'neutral'} [activeUsersTrend]
 * @property {string} [activeUsersTrendValue]
 * @property {number} pendingApprovals
 * @property {string} pendingApprovalsLabel
 * @property {number} systemAlerts
 * @property {string} systemAlertsLabel
 * @property {string} securityStatus
 * @property {string} securityStatusLabel
 * @property {'green'|'yellow'|'red'|'purple'} [securityColor]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} Activity
 * @property {string} id
 * @property {'create'|'update'|'delete'|'login'|'logout'|'approval'|'rejection'} type
 * @property {string} title
 * @property {string} description
 * @property {string} timestamp
 * @property {Object} [user]
 * @property {string} [user.name]
 * @property {string} [user.email]
 * @property {string} [user.role]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} UserDistribution
 * @property {string} role
 * @property {number} count
 * @property {string} percentage
 */

/**
 * @typedef {Object} DepartmentStats
 * @property {string} department
 * @property {number} employeeCount
 * @property {number} activeEmployees
 * @property {number} activePercentage
 */

// Export empty object (types are in JSDoc)
export default {};
