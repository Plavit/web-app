import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form';

import auth, { actionTypes as authActionTypes } from './modules/auth';
import assignments from './modules/assignments';
import { default as canSubmit } from './modules/canSubmit'; // because of a named export 'canSubmit'
import comments from './modules/comments';
import evaluationProgress from './modules/evaluationProgress';
import exercises from './modules/exercises';
import files from './modules/files';
import filesContent from './modules/filesContent';
import groups from './modules/groups';
import instances from './modules/instances';
import limits from './modules/limits';
import notifications from './modules/notifications';
import { default as search } from './modules/search'; // because of a named export 'search'
import sidebar from './modules/sidebar';
import stats from './modules/stats';
import submission from './modules/submission';
import submissions from './modules/submissions';
import registration from './modules/registration';
import users from './modules/users';
import runtimeEnvironments from './modules/runtimeEnvironments';

const createRecodexReducers = (token) => ({
  auth: auth(token),
  assignments,
  canSubmit,
  comments,
  evaluationProgress,
  exercises,
  files,
  filesContent,
  groups,
  instances,
  limits,
  notifications,
  search,
  sidebar,
  stats,
  submission,
  submissions,
  registration,
  users,
  runtimeEnvironments
});

const librariesReducers = {
  routing: routerReducer,
  form: formReducer
};

const createReducer = (token) => {
  const appReducer = combineReducers(
    Object.assign(
      {},
      librariesReducers,
      createRecodexReducers(token)
    )
  );

  return (state, action) => {
    if (action.type === authActionTypes.LOGOUT) {
      state = undefined;
    }

    return appReducer(state, action);
  };
};

export default createReducer;
