// necessary polyfill for both
import 'isomorphic-fetch';

import React from 'react';
import { renderToString } from 'react-dom/server';
import Express from 'express';
import Promise from 'bluebird';
import Helmet from 'react-helmet';
import cookieParser from 'cookie-parser';

import { match } from 'react-router';
import { ReduxAsyncConnect, loadOnServer } from 'redux-async-connect';
import { Provider } from 'react-redux';
import { syncHistoryWithStore } from 'react-router-redux';
import createHistory from 'react-router/lib/createMemoryHistory';
import { configureStore } from './redux/store';
import routes from './pages/routes';
import { apiCall } from './redux/api';


/**
 * Init server-side rendering of the app using Express with
 * some basic middleware for tempaltes and static file serving.
 */

let app = new Express();
app.set('view engine', 'ejs');
app.use(Express.static('public'));
app.use(cookieParser());

app.get('*', (req, res) => {
  const memoryHistory = createHistory(req.originalUrl);
  // Extract the accessToken from the cookies for authenticated API requests from the server.
  const token = req.cookies.accessToken; // undefined === the user is not logged in
  const store = configureStore(memoryHistory, undefined, token);
  const history = syncHistoryWithStore(memoryHistory, store);
  const location = req.originalUrl;

  match({ history, routes, location }, (error, redirectLocation, renderProps) => {
    if (redirectLocation) {
      res.redirect(301, redirectLocation.pathname + redirectLocation.search);
    } else if (error) {
      // @todo use the 500.ejs view
      res.status(500).send(error.message);
    } else if (renderProps == null) {
      // this should never happen but just for sure - if router failed
      res.status(404).send('Not found');
    } else {
      let reqUrl = location.pathname + location.search;

      loadOnServer(renderProps, store).then(() => {
        let reduxState = JSON.stringify(store.getState());
        let html = renderToString(
          <Provider store={store}>
            <ReduxAsyncConnect {...renderProps} helpers={{ apiCall }} />
          </Provider>
        );
        const head = Helmet.rewind();

        res.render('index', {
          html,
          head,
          reduxState,
          bundle: 'http://localhost:8080/bundle.js' // @todo change
        });
      });
    }
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});