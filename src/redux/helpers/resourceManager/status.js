/**
 * Status of a resource record - helper functions
 * @module status
 */

export const resourceStatus = {
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  FULFILLED: 'FULFILLED'
};

/**
 * @param {Object} item The item
 * @return {boolean} True when the item is loading.
 */
export const isLoading = (item) =>
    !item || item.get('state') === resourceStatus.PENDING;

/**
 * @param {Object} item The item
 * @return {boolean} True when the item could not be loaded, written, updated or deleted.
 */
export const hasFailed = (item) =>
    !!item && item.get('state') === resourceStatus.FAILED;

/**
 * @param {Object} item The item
 * @return {boolean} True when the item has been loaded.
 */
export const isReady = (item) =>
    !!item && item.get('state') === resourceStatus.FULFILLED && !!item.get('data');

/**
 * @param {number} Number of milliseconds since Jan 1 1970
 * @return {Function} The function returns true when the item is too old and should be invalidated.
 */
export const isTooOld = (threshold) => (item) =>
  Date.now() - item.get('lastUpdate') > threshold;

/**
 * Instance of the 'isTooOld'
 */
export const afterTenMinutesIsTooOld = isTooOld(10 * 60 * 1000);

/**
 * @param {Object} item The item
 * @return {boolean} True when the item is outdated.
 */
export const didInvalidate = (item, isTooOld = afterTenMinutesIsTooOld) =>
  item.get('didInvalidate') === true || isTooOld(item);
