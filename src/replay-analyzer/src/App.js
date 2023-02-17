import './App.css';
import Home from './components/Home';
import React, { useEffect } from 'react';
import $ from 'jquery'
import store from "./store";
import {Provider} from "react-redux";

const ReplayWrapper = () => {

    return (
        <Provider store={store}>
            <ReplayAnalyzer />
        </Provider>
    )
}

const ReplayAnalyzer = () => {
  useEffect(() => {
    $('#mainDiv').fadeIn(700)
  }, [])

  return (
      <div>
        <div id='mainDiv' className="container flexCol" style={{ display: 'flex', paddingTop: "50px" }}>
          <div className="flexRow flexGrow">
            <Home />
          </div>
        </div>
      </div>
  );
}

export default ReplayWrapper;
