import { createAction, handleActions } from 'redux-actions';
import { fromJS } from 'immutable';

import { usersSelector } from '../selectors/users';
import factory, { initialState } from '../helpers/resourceManager';
import { createApiAction } from '../middleware/apiMiddleware';
import { additionalActionTypes as submissionsActionTypes } from './submissions';

const resourceName = 'assignments';
const {
  actions,
  actionTypes,
  reduceActions
} = factory({
  resourceName,
  apiEndpointFactory: id => `/exercise-assignments/${id}`
});

export const additionalActionTypes = {
  CAN_SUBMIT: 'recodex/assignments/CAN_SUBMIT',
  CAN_SUBMIT_FULFILLED: 'recodex/assignments/CAN_SUBMIT_FULFILLED',
  CREATE_ASSIGNMENT: 'recodex/assignments/CREATE_ASSIGNMENT',
  CREATE_ASSIGNMENT_PENDING: 'recodex/assignments/CREATE_ASSIGNMENT_PENDING',
  CREATE_ASSIGNMENT_FAILED: 'recodex/assignments/CREATE_ASSIGNMENT_FAILED',
  CREATE_ASSIGNMENT_FULFILLED: 'recodex/assignments/CREATE_ASSIGNMENT_FULFILLED'
};

/**
 * Actions
 */

export const loadAssignment = actions.pushResource;
export const fetchAssignmentssIfNeeded = actions.fetchIfNeeded;
export const fetchAssignmentIfNeeded = actions.fetchOneIfNeeded;

export const fetchAssignmentsForGroup = groupId =>
  actions.fetchMany({
    endpoint: `/groups/${groupId}/assignments`
  });

export const canSubmit = (assignmentId) =>
  createApiAction({
    type: additionalActionTypes.CAN_SUBMIT,
    endpoint: `/exercise-assignments/${assignmentId}/can-submit`,
    meta: { assignmentId }
  });

export const create = (groupId, exerciseId) =>
  createApiAction({
    type: additionalActionTypes.CREATE_ASSIGNMENT,
    endpoint: '/exercise-assignments',
    method: 'POST',
    body: { groupId, exerciseId }
  });

export const editAssignment = (payload) => {
  return { type: '@TODO_EDIT_ASSIGNMENT_ACTION', payload };
};

/**
 * Reducer
 */

const reducer = handleActions(Object.assign({}, reduceActions, {

  [submissionsActionTypes.LOAD_USERS_SUBMISSIONS_FULFILLED]: (state, { payload, meta: { userId, assignmentId } }) =>
    state.setIn([ 'submissions', assignmentId, userId ], fromJS(payload.map(submission => submission.id))),

  [additionalActionTypes.CAN_SUBMIT_FULFILLED]: (state, { payload: canSubmit, meta: { assignmentId } }) =>
    state.setIn([ 'resources', assignmentId, 'data', 'canReceiveSubmissions' ], canSubmit),

  [additionalActionTypes.CREATE_ASSIGNMENT_PENDING]: (state, { meta: { groupId } }) =>
    state,

  [additionalActionTypes.CREATE_ASSIGNMENT_FAILED]: (state, { meta: { groupId } }) =>
    state,

  [additionalActionTypes.CREATE_ASSIGNMENT_FULFILLED]: reduceActions[actionTypes.FETCH_FULFILLED]

}), initialState);

export default reducer;

