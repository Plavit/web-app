import React from 'react';
import { matchPath, Switch, Route, Redirect } from 'react-router';
import { defaultMemoize } from 'reselect';

/* container components */
import App from '../containers/App';
import Dashboard from './Dashboard';
import Home from './Home';
import EmailVerification from './EmailVerification';
import Exercise from './Exercise';
import ExerciseAssignments from './ExerciseAssignments';
import Exercises from './Exercises';
import EditExercise from './EditExercise';
import EditExerciseConfig from './EditExerciseConfig';
import EditExerciseLimits from './EditExerciseLimits';
import GroupDetail from './GroupDetail';
import GroupInfo from './GroupInfo';
import GroupUserSolutions from './GroupUserSolutions';
import EditGroup from './EditGroup';
import Instance from './Instance';
import Instances from './Instances';
import EditInstances from './EditInstance';
import Login from './Login';
import Assignment from './Assignment';
import EditAssignment from './EditAssignment';
import AssignmentStats from './AssignmentStats';
import ShadowAssignment from './ShadowAssignment';
import EditShadowAssignment from './EditShadowAssignment';
import NotFound from './NotFound';
import Solution from './Solution';
import Registration from './Registration';
import Users from './Users';
import User from './User';
import EditUser from './EditUser';
import ReferenceSolution from './ReferenceSolution';
import Pipelines from './Pipelines';
import EditPipeline from './EditPipeline';
import Pipeline from './Pipeline';
import FAQ from './FAQ';
import SubmissionFailures from './SubmissionFailures';
import SisIntegration from './SisIntegration';
import Archive from './Archive';
import SystemMessages from './SystemMessages/SystemMessages';
import ChangePassword from './ChangePassword';
import ResetPassword from './ResetPassword';
import ServerManagement from './ServerManagement';

import { LOGIN_URI_PREFIX, createLoginLinkWithRedirect } from '../redux/helpers/api/tools';
import { API_BASE, URL_PATH_PREFIX } from '../helpers/config';
import { getAssignment } from '../redux/selectors/assignments';
import { getShadowAssignment } from '../redux/selectors/shadowAssignments';

/**
 * Helper function for creating internal route declarations.
 * @param {String} basePath Route string (without prefix)
 * @param {Class} component Attached page component
 * @param {String} linkName Name of the link constant, under which this path is accessible in links
 * @param {Boolean|undefined} auth true = only authorized users, false = only unauthorized users, undefined = do not care
 */
const r = (basePath, component, linkName = '', auth = undefined) => {
  const path = basePath === '*' ? basePath : `${URL_PATH_PREFIX}/${basePath}`;
  return {
    route: { path, component, exact: true },
    basePath,
    auth,
    linkName,
  };
};

// Route/Link declarations
const routesDescriptors = [
  r('', Home, 'HOME_URI'),
  r('faq', FAQ, 'FAQ_URL'),
  r(`${LOGIN_URI_PREFIX}/:redirect?`, Login, 'LOGIN_URI_FACTORY'),
  r('registration', Registration, 'REGISTRATION_URI', false), // false = only unauthorized
  r('forgotten-password', ResetPassword, 'RESET_PASSWORD_URI'),
  r('app', Dashboard, 'DASHBOARD_URI', true),
  r('app/assignment/:assignmentId', Assignment, 'ASSIGNMENT_DETAIL_URI_FACTORY', true),
  r('app/assignment/:assignmentId/user/:userId', Assignment, 'ASSIGNMENT_DETAIL_SPECIFIC_USER_URI_FACTORY', true),
  r('app/assignment/:assignmentId/edit', EditAssignment, 'ASSIGNMENT_EDIT_URI_FACTORY', true),
  r('app/assignment/:assignmentId/stats', AssignmentStats, 'ASSIGNMENT_STATS_URI_FACTORY', true),
  r('app/assignment/:assignmentId/solution/:solutionId', Solution, 'SOLUTION_DETAIL_URI_FACTORY', true),
  r('app/shadow-assignment/:shadowId', ShadowAssignment, 'SHADOW_ASSIGNMENT_DETAIL_URI_FACTORY', true),
  r('app/shadow-assignment/:shadowId/edit', EditShadowAssignment, 'SHADOW_ASSIGNMENT_EDIT_URI_FACTORY', true),
  r('app/exercises', Exercises, 'EXERCISES_URI', true),
  r('app/exercises/:exerciseId', Exercise, 'EXERCISE_URI_FACTORY', true),
  r('app/exercises/:exerciseId/edit', EditExercise, 'EXERCISE_EDIT_URI_FACTORY', true),
  r('app/exercises/:exerciseId/assignments', ExerciseAssignments, 'EXERCISE_ASSIGNMENTS_URI_FACTORY', true),
  r('app/exercises/:exerciseId/edit-config', EditExerciseConfig, 'EXERCISE_EDIT_CONFIG_URI_FACTORY', true),
  r('app/exercises/:exerciseId/edit-limits', EditExerciseLimits, 'EXERCISE_EDIT_LIMITS_URI_FACTORY', true),
  r(
    'app/exercises/:exerciseId/reference-solution/:referenceSolutionId',
    ReferenceSolution,
    'EXERCISE_REFERENCE_SOLUTION_URI_FACTORY',
    true
  ),
  r('app/pipelines', Pipelines, 'PIPELINES_URI', true),
  r('app/pipelines/:pipelineId', Pipeline, 'PIPELINE_URI_FACTORY', true),
  r('app/pipelines/:pipelineId/edit', EditPipeline, 'PIPELINE_EDIT_URI_FACTORY', true),
  r('app/group/:groupId/edit', EditGroup, 'GROUP_EDIT_URI_FACTORY', true),
  r('app/group/:groupId/info', GroupInfo, 'GROUP_INFO_URI_FACTORY', true),
  r('app/group/:groupId/detail', GroupDetail, 'GROUP_DETAIL_URI_FACTORY', true),
  r('app/group/:groupId/user/:userId', GroupUserSolutions, 'GROUP_USER_SOLUTIONS_URI_FACTORY', true),
  r('app/instance/:instanceId', Instance, 'INSTANCE_URI_FACTORY', true),
  r('app/users', Users, 'USERS_URI', true),
  r('app/user/:userId', User, 'USER_URI_FACTORY', true),
  r('app/user/:userId/edit', EditUser, 'EDIT_USER_URI_FACTORY', true),
  r('app/submission-failures', SubmissionFailures, 'FAILURES_URI', true),
  r('app/system-messages', SystemMessages, 'MESSAGES_URI', true),
  r('app/sis-integration', SisIntegration, 'SIS_INTEGRATION_URI', true),
  r('app/archive', Archive, 'ARCHIVE_URI', true),
  r('app/server', ServerManagement, 'SERVER_MANAGEMENT_URI', true),
  r('admin/instances', Instances, 'ADMIN_INSTANCES_URI', true),
  r('admin/instances/:instanceId/edit', EditInstances, 'ADMIN_EDIT_INSTANCE_URI_FACTORY', true),

  // Routes without links (to be linked from API notification emails)
  r('forgotten-password/change', ChangePassword),
  r('email-verification', EmailVerification, ''),
  r('*', NotFound),
];

/*
 * Routes
 */

const getRedirect = (routeObj, urlPath, isLoggedIn) => {
  if (routeObj.auth !== undefined && routeObj.auth !== isLoggedIn) {
    return routeObj.auth ? createLoginLinkWithRedirect(urlPath) : getLinks().DASHBOARD_URI;
  } else {
    return null;
  }
};

const unwrap = component => {
  while (component && component.WrappedComponent) {
    component = component.WrappedComponent;
  }
  return component;
};

/**
 * Basically a replacement for old match function from react-router v3.
 * It tries to match actual route base on the URL and returns either a redirect
 * or route parameters + async load list of functions extracted from components info.
 * @param {String} urlPath
 * @param {Boolean} isLoggedIn
 */
export const match = (urlPath, isLoggedIn) => {
  const routeObj = routesDescriptors.find(({ route }) => matchPath(urlPath, route) !== null);
  const component = unwrap(routeObj.route.component);

  const redirect = getRedirect(routeObj, urlPath, isLoggedIn);
  const match = matchPath(urlPath, routeObj.route);

  const loadAsync = [unwrap(App).loadAsync(Boolean(component && component.customLoadGroups))];
  if (component && component.loadAsync) {
    loadAsync.push(component.loadAsync);
  }

  return { redirect, ...match, loadAsync };
};

export const buildRoutes = (urlPath, isLoggedIn) => {
  return (
    <Switch>
      {routesDescriptors.map(routeObj => {
        const redirect = getRedirect(routeObj, urlPath, isLoggedIn);
        return redirect ? (
          <Redirect key={routeObj.route.path} path={routeObj.route.path} exact={routeObj.route.exact} to={redirect} />
        ) : (
          <Route key={routeObj.route.path} {...routeObj.route} />
        );
      })}
    </Switch>
  );
};

export const pathHasCustomLoadGroups = defaultMemoize(urlPath => {
  const routeObj = routesDescriptors.find(({ route }) => matchPath(urlPath, route) !== null);
  const component = unwrap(routeObj.route.component);
  return Boolean(component && component.customLoadGroups);
});

/**
 * A specialized function that uses combination of route decoding and redux selectors
 * to get groupId associated with current url path.
 * 1) If the component class has static member customRelatedGroupSelector, it is used as selector.
 *    (state and matched URL params are passed to it)
 * 2) if groupId is present in URL parameters, it is returned.
 * 3) If assignmentId or shadowId is present in URL, we select corresponding object from redux and
 *    get groupId from it.
 * @param {Object} state redux
 * @param {string} urlPath location + search URL part
 * @returns {string|null} groupId of null if no group is related
 */
export const pathRelatedGroupSelector = (state, urlPath) => {
  const routeObj = routesDescriptors.find(({ route }) => matchPath(urlPath, route) !== null);
  if (!routeObj) {
    return null;
  }
  const matchRes = matchPath(urlPath, routeObj.route);
  const component = unwrap(routeObj.route.component);
  if (component && component.customRelatedGroupSelector) {
    // completely custom selector given by the page component
    return component.customRelatedGroupSelector(state, matchRes.params);
  }

  // lets use default rules to extract group ID from path parameters
  if (matchRes.params) {
    if (matchRes.params.groupId) {
      return matchRes.params.groupId;
    }

    if (matchRes.params.assignmentId) {
      const assignment = getAssignment(state)(matchRes.params.assignmentId);
      const groupId = assignment && assignment.getIn(['data', 'groupId']);
      if (groupId) {
        return groupId;
      }
    }

    if (matchRes.params.shadowId) {
      const shadow = getShadowAssignment(state)(matchRes.params.shadowId);
      const groupId = shadow && shadow.getIn(['data', 'groupId']);
      if (groupId) {
        return groupId;
      }
    }
  }

  return null;
};

/*
 * Links
 */

let linksCache = null;

const createLink = path => {
  const tokens = path.split('/');
  const index = [];
  tokens.forEach((token, idx) => {
    if (token.startsWith(':')) {
      index.push(idx);
    }
  });

  if (index.length > 0) {
    // link factory
    return (...params) => {
      const res = [...tokens]; // make a copy of URL path tokens (so we can fill in parameters)
      index.forEach(idx => (res[idx] = params.shift())); // fill in parameters using indexed positions
      while (res.length > 0 && !res[res.length - 1]) {
        // remove empty parameters at the end (params.shift() will fill in undefined for every missing parameter)
        res.pop();
      }
      res.unshift(URL_PATH_PREFIX);
      return res.join('/');
    };
  } else {
    // static link
    return `${URL_PATH_PREFIX}/${path}`;
  }
};

export const getLinks = () => {
  if (!linksCache) {
    // Fixed links not related to routes.
    linksCache = {
      API_BASE,
      GITHUB_BUGS_URL: 'https://www.github.com/recodex/web-app/issues',
      LOGIN_EXTERN_FINALIZATION_URI_FACTORY: service => `${URL_PATH_PREFIX}/login-extern/${service}`,
      DOWNLOAD: fileId => `${API_BASE}/uploaded-files/${fileId}/download`,
    };

    // Gather links from router descriptors
    routesDescriptors
      .filter(({ linkName, basePath }) => linkName && basePath !== '*')
      .forEach(({ route, linkName, basePath }) => {
        linksCache[linkName] = createLink(basePath);
      });

    // Additional link specializations...
    linksCache.LOGIN_URI = linksCache.LOGIN_URI_FACTORY(''); // empty string means bare endpoint
  }

  return linksCache;
};
