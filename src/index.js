import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import {App} from './client/app.js'
import {HashRouter, BrowserRouter as Router} from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {   process.env.NODE_ENV !== 'production' ?
                <Router>
                    <App/>
                </Router>
            :
                <HashRouter>
                    <App/>
                </HashRouter>
        }
    </React.StrictMode>
);

reportWebVitals();