import React from "react";
import {NavBar} from "./pages/navbar";
import "bulma";
import "toastr/toastr.scss";
import {Redirect, Route, Switch} from "react-router-dom";
import {PlayerStats} from "./pages/player-stats";
import {Home} from "./pages/home";
import ReplayWrapper from "../replay-analyzer/src/App";

export class App extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return <div>
            <NavBar className="navbar"/>
            <Switch>
                <Route path="/record" component={ReplayWrapper}/>
                <Route path="/stats" component={PlayerStats}/>
                <Route exact path="/" component={Home}/>
                <Redirect to={"/"} />
            </Switch>
        </div>;
    }
}
