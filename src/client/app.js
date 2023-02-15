import React from "react";
import {NavBar} from "./pages/navbar";
import "bulma";
import "toastr/toastr.scss";
import {Redirect, Route, Switch} from "react-router-dom";
import {RecordGame} from "./pages/record-game";
import {Scoreboard} from "./pages/scoreboard";
import {PlayerStats} from "./pages/player-stats";
import {Home} from "./pages/home";


export class App extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return <div>
            <NavBar/>
            <Switch>
                <Route path="/record" component={RecordGame}/>
                {/*<Route path="/scoreboard" component={Scoreboard}/>*/}
                <Route path="/stats" component={PlayerStats}/>
                <Route exact path="/" component={Home}/>
                <Redirect to={"/"} />
            </Switch>
        </div>;
    }
}
